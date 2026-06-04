import { prisma } from '../config/prisma.js';
import { getFigmaClient } from './figma-connection.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import {
  buildSourceComponentMap,
  detectSourceInstances,
  aggregateUsage,
} from '../scanner/detection.js';
import { detectChanges } from '../scanner/change-detection.js';
import { logActivity } from './activity-log.js';

let isScanRunning = false;

export async function getScanBatches() {
  return prisma.scanBatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getScanJobs(filters?: { batchId?: string; status?: string; fileId?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.batchId) where.batchId = filters.batchId;
  if (filters?.status) where.status = filters.status;
  if (filters?.fileId) where.registeredFileId = filters.fileId;

  return prisma.scanJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { registeredFile: true },
    take: 100,
  });
}

export async function getScanBatch(batchId: string) {
  return prisma.scanBatch.findUnique({ where: { id: batchId } });
}

export async function startScanAll() {
  if (isScanRunning) {
    throw new AppError(ErrorCodes.SCAN_ALREADY_RUNNING, 'A scan is already in progress', 409);
  }

  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (!sourceFile) {
    throw new AppError(ErrorCodes.SOURCE_FILE_NOT_CONFIGURED, 'No source UI Kit configured', 400);
  }

  const activeFiles = await prisma.registeredFile.findMany({
    where: { trackingEnabled: true },
  });

  if (activeFiles.length === 0) {
    throw new AppError(ErrorCodes.REGISTERED_FILE_NOT_FOUND, 'No active registered files to scan', 400);
  }

  const batch = await prisma.scanBatch.create({
    data: {
      status: 'running',
      totalFiles: activeFiles.length,
      startedAt: new Date(),
    },
  });

  for (const file of activeFiles) {
    await prisma.scanJob.create({
      data: {
        batchId: batch.id,
        registeredFileId: file.id,
        status: 'pending',
      },
    });
  }

  processScanBatch(batch.id).catch(err => {
    console.error('Scan batch failed:', err);
  });

  void logActivity({
    eventType: 'scan.batch.started',
    title: 'Scan batch started',
    description: `Scanning ${activeFiles.length} file${activeFiles.length > 1 ? 's' : ''}`,
    entityType: 'scan_batch',
    entityId: batch.id,
    severity: 'info',
    metadata: { totalFiles: activeFiles.length },
  });

  return {
    batchId: batch.id,
    status: batch.status,
    totalFiles: activeFiles.length,
  };
}

export async function startScanFile(registeredFileId: string) {
  const file = await prisma.registeredFile.findUnique({ where: { id: registeredFileId } });
  if (!file) {
    throw new AppError(ErrorCodes.REGISTERED_FILE_NOT_FOUND, 'Registered file not found', 404);
  }

  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (!sourceFile) {
    throw new AppError(ErrorCodes.SOURCE_FILE_NOT_CONFIGURED, 'No source UI Kit configured', 400);
  }

  const batch = await prisma.scanBatch.create({
    data: {
      status: 'running',
      totalFiles: 1,
      startedAt: new Date(),
    },
  });

  const job = await prisma.scanJob.create({
    data: {
      batchId: batch.id,
      registeredFileId: file.id,
      status: 'pending',
    },
  });

  processScanBatch(batch.id).catch(err => {
    console.error('Scan batch failed:', err);
  });

  return {
    scanJobId: job.id,
    batchId: batch.id,
    status: 'pending',
  };
}

export async function retryFailedScan(scanJobId: string) {
  const oldJob = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: { registeredFile: true },
  });

  if (!oldJob) {
    throw new AppError(ErrorCodes.SCAN_FAILED, 'Scan job not found', 404);
  }

  if (oldJob.status !== 'failed') {
    throw new AppError(ErrorCodes.SCAN_FAILED, 'Can only retry failed scan jobs', 400);
  }

  return startScanFile(oldJob.registeredFileId);
}

async function processScanBatch(batchId: string) {
  isScanRunning = true;

  try {
    const jobs = await prisma.scanJob.findMany({
      where: { batchId, status: 'pending' },
      include: { registeredFile: true },
      orderBy: { createdAt: 'asc' },
    });

    const settings = await prisma.appSetting.findFirst();
    const scanDelayMs = settings?.scanDelayMs || 7000;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        await processSingleScanJob(job.id, job.registeredFile);
        await prisma.scanBatch.update({
          where: { id: batchId },
          data: { completedFiles: { increment: 1 } },
        });
      } catch (err) {
        const errorCode = err instanceof AppError ? err.code : 'SCAN_FAILED';
        const errorMessage = err instanceof Error ? err.message : 'Unknown scan error';

        if (err instanceof AppError && err.code === ErrorCodes.FIGMA_RATE_LIMITED) {
          await prisma.scanJob.update({
            where: { id: job.id },
            data: {
              status: 'rate_limited',
              errorCode,
              errorMessage,
              retryAfterSeconds: (err.details as { retryAfterSeconds?: number })?.retryAfterSeconds || 30,
              finishedAt: new Date(),
            },
          });

          void logActivity({
            eventType: 'scan.job.rate_limited',
            title: 'Scan rate limited',
            description: `Rate limited while scanning "${job.registeredFile.name}"`,
            entityType: 'scan_job',
            entityId: job.id,
            severity: 'warning',
            metadata: { fileName: job.registeredFile.name },
          });
        } else {
          await prisma.scanJob.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              errorCode,
              errorMessage,
              finishedAt: new Date(),
            },
          });

          void logActivity({
            eventType: 'scan.job.failed',
            title: 'Scan job failed',
            description: `Failed to scan "${job.registeredFile.name}": ${errorMessage}`,
            entityType: 'scan_job',
            entityId: job.id,
            severity: 'error',
            metadata: { fileName: job.registeredFile.name, errorCode },
          });
        }

        await prisma.scanBatch.update({
          where: { id: batchId },
          data: { failedFiles: { increment: 1 } },
        });

        await prisma.registeredFile.update({
          where: { id: job.registeredFileId },
          data: {
            lastScanJobId: job.id,
            lastScanStatus: 'failed',
            lastScanAttemptAt: new Date(),
            status: 'failed',
          },
        });
      }

      if (i < jobs.length - 1) {
        await sleep(scanDelayMs);
      }
    }

    const finalBatch = await prisma.scanBatch.findUnique({ where: { id: batchId } });
    if (finalBatch) {
      let finalStatus = 'success';
      if (finalBatch.failedFiles > 0 && finalBatch.completedFiles > 0) {
        finalStatus = 'partial_success';
      } else if (finalBatch.completedFiles === 0) {
        finalStatus = 'failed';
      }

      await prisma.scanBatch.update({
        where: { id: batchId },
        data: { status: finalStatus, finishedAt: new Date() },
      });

      void logActivity({
        eventType: 'scan.batch.completed',
        title: `Scan batch ${finalStatus === 'success' ? 'completed' : finalStatus === 'partial_success' ? 'partially completed' : 'failed'}`,
        description: `${finalBatch.completedFiles} of ${finalBatch.totalFiles} files completed, ${finalBatch.failedFiles} failed`,
        entityType: 'scan_batch',
        entityId: batchId,
        severity: finalStatus === 'success' ? 'success' : finalStatus === 'partial_success' ? 'warning' : 'error',
        metadata: { completed: finalBatch.completedFiles, failed: finalBatch.failedFiles, total: finalBatch.totalFiles },
      });
    }
  } finally {
    isScanRunning = false;
  }
}

async function processSingleScanJob(
  scanJobId: string,
  registeredFile: { id: string; figmaFileKey: string; name: string },
) {
  const startTime = Date.now();

  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: { status: 'running', startedAt: new Date() },
  });

  await prisma.registeredFile.update({
    where: { id: registeredFile.id },
    data: {
      lastScanJobId: scanJobId,
      lastScanStatus: 'running',
      lastScanAttemptAt: new Date(),
    },
  });

  const sourceComponents = await prisma.sourceComponent.findMany({
    where: { status: 'active' },
  });

  if (sourceComponents.length === 0) {
    throw new AppError(ErrorCodes.NO_COMPONENTS_FOUND, 'No active source components found', 400);
  }

  const sourceComponentMap = buildSourceComponentMap(sourceComponents);

  const figma = await getFigmaClient();
  const figmaFile = await figma.getFile(registeredFile.figmaFileKey);

  const detectedInstances = detectSourceInstances({
    figmaFile,
    registeredFileId: registeredFile.id,
    registeredFileKey: registeredFile.figmaFileKey,
    sourceComponentMap,
  });

  const aggregatedUsage = aggregateUsage(detectedInstances);

  const previousUsage = await prisma.componentUsageCurrent.findMany({
    where: { registeredFileId: registeredFile.id },
  });

  await prisma.$transaction(async (tx) => {
    for (const usage of aggregatedUsage) {
      await tx.usageSnapshot.create({
        data: {
          scanJobId,
          sourceComponentId: usage.sourceComponentId,
          registeredFileId: usage.registeredFileId,
          instanceCount: usage.instanceCount,
          pageCount: usage.pageCount,
          frameCount: usage.frameCount,
          scannedAt: new Date(),
        },
      });
    }

    await tx.componentUsageCurrent.deleteMany({
      where: { registeredFileId: registeredFile.id },
    });

    for (const usage of aggregatedUsage) {
      await tx.componentUsageCurrent.create({
        data: {
          sourceComponentId: usage.sourceComponentId,
          registeredFileId: usage.registeredFileId,
          instanceCount: usage.instanceCount,
          pageCount: usage.pageCount,
          frameCount: usage.frameCount,
          lastSeenAt: new Date(),
          lastScannedAt: new Date(),
          lastScanJobId: scanJobId,
        },
      });
    }

    const existingInstances = await tx.usageInstance.findMany({
      where: { registeredFileId: registeredFile.id, status: 'active' },
    });

    const detectedNodeIds = new Set(detectedInstances.map(i => `${i.sourceComponentId}:${i.registeredFileId}:${i.instanceNodeId}`));

    for (const inst of detectedInstances) {
      await tx.usageInstance.upsert({
        where: {
          sourceComponentId_registeredFileId_instanceNodeId: {
            sourceComponentId: inst.sourceComponentId,
            registeredFileId: inst.registeredFileId,
            instanceNodeId: inst.instanceNodeId,
          },
        },
        update: {
          instanceName: inst.instanceName,
          pageName: inst.pageName,
          frameName: inst.frameName,
          figmaNodeUrl: inst.figmaNodeUrl,
          usageDepth: inst.usageDepth,
          parentSourceComponentId: inst.parentSourceComponentId,
          parentInstanceNodeId: inst.parentInstanceNodeId,
          lastSeenAt: new Date(),
          status: 'active',
          missingDetectedAt: null,
        },
        create: {
          sourceComponentId: inst.sourceComponentId,
          registeredFileId: inst.registeredFileId,
          instanceNodeId: inst.instanceNodeId,
          instanceName: inst.instanceName,
          pageName: inst.pageName,
          frameName: inst.frameName,
          figmaNodeUrl: inst.figmaNodeUrl,
          usageDepth: inst.usageDepth,
          parentSourceComponentId: inst.parentSourceComponentId,
          parentInstanceNodeId: inst.parentInstanceNodeId,
          status: 'active',
        },
      });
    }

    for (const existing of existingInstances) {
      const key = `${existing.sourceComponentId}:${existing.registeredFileId}:${existing.instanceNodeId}`;
      if (!detectedNodeIds.has(key)) {
        await tx.usageInstance.update({
          where: { id: existing.id },
          data: { status: 'missing', missingDetectedAt: new Date() },
        });
      }
    }

    const changes = detectChanges(
      aggregatedUsage.map(u => ({
        sourceComponentId: u.sourceComponentId,
        registeredFileId: u.registeredFileId,
        instanceCount: u.instanceCount,
      })),
      previousUsage.map(u => ({
        sourceComponentId: u.sourceComponentId,
        registeredFileId: u.registeredFileId,
        instanceCount: u.instanceCount,
      })),
    );

    for (const change of changes) {
      await tx.usageChange.create({
        data: {
          scanJobId,
          sourceComponentId: change.sourceComponentId,
          registeredFileId: change.registeredFileId,
          changeType: change.changeType,
          previousCount: change.previousCount,
          currentCount: change.currentCount,
          difference: change.difference,
          detectedAt: new Date(),
        },
      });
    }
  });

  const totalInstances = aggregatedUsage.reduce((sum, u) => sum + u.instanceCount, 0);
  const uniqueComponentsUsed = aggregatedUsage.length;
  const durationMs = Date.now() - startTime;

  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: {
      status: 'success',
      finishedAt: new Date(),
      durationMs,
      totalInstances,
      uniqueComponentsUsed,
    },
  });

  const fileStatus = totalInstances === 0 ? 'zero_usage' : 'healthy';

  await prisma.registeredFile.update({
    where: { id: registeredFile.id },
    data: {
      status: fileStatus,
      lastScanStatus: 'success',
      lastScanAttemptAt: new Date(),
      lastSuccessfulScanAt: new Date(),
      totalInstances,
      uniqueComponentsUsed,
    },
  });

  void logActivity({
    eventType: 'scan.job.success',
    title: 'Scan job completed',
    description: `Scanned "${registeredFile.name}" — ${totalInstances} instances across ${uniqueComponentsUsed} components in ${durationMs}ms`,
    entityType: 'scan_job',
    entityId: scanJobId,
    severity: 'success',
    metadata: { fileName: registeredFile.name, totalInstances, uniqueComponents: uniqueComponentsUsed, durationMs },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
