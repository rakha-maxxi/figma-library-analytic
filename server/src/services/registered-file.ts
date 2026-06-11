import { prisma } from '../config/prisma.js';
import { getFigmaClient } from './figma-connection.js';
import { extractFigmaFileKey, isValidFigmaUrl } from '../utils/figma-url-parser.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { logActivity } from './activity-log.js';

export async function getRegisteredFiles(filters?: { search?: string; status?: string; trackingEnabled?: boolean }) {
  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.name = { contains: filters.search };
  }
  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }
  if (filters?.trackingEnabled !== undefined) {
    where.trackingEnabled = filters.trackingEnabled;
  }

  return prisma.registeredFile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function addRegisteredFiles(figmaUrls: string[]) {
  const added: Array<{ id: string; name: string; figmaFileKey: string; figmaUrl: string; status: string }> = [];
  const duplicates: string[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  const figma = await getFigmaClient();

  for (const url of figmaUrls) {
    try {
      if (!isValidFigmaUrl(url)) {
        failed.push({ url, error: 'Invalid Figma file URL' });
        continue;
      }

      const fileKey = extractFigmaFileKey(url);
      if (!fileKey) {
        failed.push({ url, error: 'Could not extract file key' });
        continue;
      }

      const existing = await prisma.registeredFile.findUnique({ where: { figmaFileKey: fileKey } });
      if (existing) {
        duplicates.push(url);
        continue;
      }

      const meta = await figma.getFileMeta(fileKey);

      const file = await prisma.registeredFile.create({
        data: {
          figmaFileKey: fileKey,
          name: meta.name,
          figmaUrl: url,
          status: 'not_scanned',
          trackingEnabled: true,
        },
      });

      added.push({
        id: file.id,
        name: file.name,
        figmaFileKey: file.figmaFileKey,
        figmaUrl: file.figmaUrl,
        status: file.status,
      });

      void logActivity({
        eventType: 'file.registered',
        title: 'Consumer file registered',
        description: `Registered "${file.name}" for tracking`,
        entityType: 'registered_file',
        entityId: file.id,
        severity: 'success',
        metadata: { fileName: file.name },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      failed.push({ url, error: message });
    }
  }

  return { added, duplicates, failed };
}

export async function updateRegisteredFile(id: string, data: { trackingEnabled?: boolean; scanIntervalMinutes?: number | null }) {
  const file = await prisma.registeredFile.findUnique({ where: { id } });
  if (!file) {
    throw new AppError(ErrorCodes.REGISTERED_FILE_NOT_FOUND, 'Registered file not found', 404);
  }

  const updateData: Record<string, unknown> = {};
  if (data.trackingEnabled !== undefined) {
    updateData.trackingEnabled = data.trackingEnabled;
    updateData.status = data.trackingEnabled
      ? (file.lastSuccessfulScanAt ? 'healthy' : 'not_scanned')
      : 'disabled';
  }
  if (data.scanIntervalMinutes !== undefined) {
    updateData.scanIntervalMinutes = data.scanIntervalMinutes;
  }

  const updated = await prisma.registeredFile.update({
    where: { id },
    data: updateData,
  });

  void logActivity({
    eventType: 'file.tracking.toggled',
    title: `File tracking ${data.trackingEnabled ? 'enabled' : 'disabled'}`,
    description: `Tracking ${data.trackingEnabled ? 'enabled' : 'disabled'} for "${file.name}"`,
    entityType: 'registered_file',
    entityId: id,
    severity: 'info',
    metadata: { fileName: file.name, trackingEnabled: data.trackingEnabled ?? false },
  });

  return updated;
}

export async function removeRegisteredFile(id: string) {
  const file = await prisma.registeredFile.findUnique({ where: { id } });
  if (!file) {
    throw new AppError(ErrorCodes.REGISTERED_FILE_NOT_FOUND, 'Registered file not found', 404);
  }

  await prisma.registeredFile.delete({ where: { id } });

  void logActivity({
    eventType: 'file.removed',
    title: 'Consumer file removed',
    description: `Removed "${file.name}"`,
    entityType: 'registered_file',
    entityId: id,
    severity: 'warning',
    metadata: { fileName: file.name },
  });

  return { removed: true };
}

export async function getFileDetail(id: string) {
  const file = await prisma.registeredFile.findUnique({ where: { id } });
  if (!file) {
    throw new AppError(ErrorCodes.REGISTERED_FILE_NOT_FOUND, 'Registered file not found', 404);
  }

  const usage = await prisma.componentUsageCurrent.findMany({
    where: { registeredFileId: id },
    include: { sourceComponent: true },
  });

  const components = usage.map(u => ({
    component: {
      id: u.sourceComponent.id,
      componentName: u.sourceComponent.componentName,
      componentSetName: u.sourceComponent.componentSetName,
      componentKey: u.sourceComponent.componentKey,
      status: u.sourceComponent.status,
    },
    count: u.instanceCount,
    lastSeen: u.lastSeenAt?.toISOString() || u.lastScannedAt.toISOString(),
  }));

  return { file, components };
}

export async function getFileComponents(id: string) {
  const usage = await prisma.componentUsageCurrent.findMany({
    where: { registeredFileId: id },
    include: { sourceComponent: true },
    orderBy: { instanceCount: 'desc' },
  });

  return usage.map(u => ({
    id: u.sourceComponent.id,
    componentName: u.sourceComponent.componentName,
    componentSetName: u.sourceComponent.componentSetName,
    componentKey: u.sourceComponent.componentKey,
    status: u.sourceComponent.status,
    instanceCount: u.instanceCount,
    lastSeenAt: u.lastSeenAt?.toISOString() || u.lastScannedAt.toISOString(),
  }));
}

export async function getFileInstances(id: string, limit = 50) {
  const instances = await prisma.usageInstance.findMany({
    where: { registeredFileId: id, status: 'active' },
    include: { sourceComponent: true },
    orderBy: { lastSeenAt: 'desc' },
    take: limit,
  });

  return instances.map(i => ({
    id: i.id,
    componentId: i.sourceComponentId,
    componentName: i.sourceComponent.componentName,
    componentSetName: i.sourceComponent.componentSetName,
    instanceNodeId: i.instanceNodeId,
    instanceName: i.instanceName,
    pageName: i.pageName,
    frameName: i.frameName,
    figmaNodeUrl: i.figmaNodeUrl,
    usageDepth: i.usageDepth,
    parentSourceComponentId: i.parentSourceComponentId,
    parentInstanceNodeId: i.parentInstanceNodeId,
    firstSeenAt: i.firstSeenAt.toISOString(),
    lastSeenAt: i.lastSeenAt.toISOString(),
    status: i.status,
  }));
}

export async function getDetachedCandidates(fileId: string) {
  const candidates = await prisma.detachedComponentCandidate.findMany({
    where: { registeredFileId: fileId, status: { not: 'resolved' } },
    include: { scanJob: true },
    orderBy: [
      { confidenceScore: 'desc' },
      { lastSeenAt: 'desc' },
    ],
  });

  const sourceComponents = await prisma.sourceComponent.findMany({
    where: { id: { in: candidates.map(c => c.sourceComponentId).filter(Boolean) as string[] } },
  });
  const compMap = new Map(sourceComponents.map(c => [c.id, c]));

  return candidates.map(c => {
    const sc = c.sourceComponentId ? compMap.get(c.sourceComponentId) : null;
    return {
      id: c.id,
      registeredFileId: c.registeredFileId,
      sourceComponentId: c.sourceComponentId,
      sourceComponentName: sc?.componentName || null,
      scanJobId: c.scanJobId,
      candidateNodeId: c.candidateNodeId,
      candidateNodeName: c.candidateNodeName,
      pageName: c.pageName,
      frameName: c.frameName,
      figmaNodeUrl: c.figmaNodeUrl,
      detectionType: c.detectionType,
      confidenceScore: c.confidenceScore,
      confidenceLevel: c.confidenceLevel,
      matchedSignals: c.matchedSignalsJson ? JSON.parse(c.matchedSignalsJson) : [],
      reason: c.reason,
      status: c.status,
      firstSeenAt: c.firstSeenAt.toISOString(),
      lastSeenAt: c.lastSeenAt.toISOString(),
    };
  });
}

export async function updateDetachedCandidate(candidateId: string, status: string) {
  const candidate = await prisma.detachedComponentCandidate.findUnique({ where: { id: candidateId } });
  if (!candidate) {
    throw new AppError('CANDIDATE_NOT_FOUND', 'Detached candidate not found', 404);
  }
  const updated = await prisma.detachedComponentCandidate.update({
    where: { id: candidateId },
    data: { status },
  });
  return { id: updated.id, status: updated.status };
}
