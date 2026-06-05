import { prisma } from '../config/prisma.js';
import { logActivity } from './activity-log.js';

export async function getInsightsSummary() {
  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });

  const [totalComponents, registeredFilesCount, usageAgg, failedJobs] = await Promise.all([
    sourceFile
      ? prisma.sourceComponent.count({ where: { sourceFileId: sourceFile.id } })
      : Promise.resolve(0),
    prisma.registeredFile.count({ where: { trackingEnabled: true } }),
    prisma.componentUsageCurrent.aggregate({
      _sum: { instanceCount: true },
    }),
    prisma.scanJob.count({ where: { status: 'failed' } }),
  ]);

  const usageByComponent = await prisma.componentUsageCurrent.groupBy({
    by: ['sourceComponentId'],
    _sum: { instanceCount: true },
  });

  const usageMap = new Map(
    usageByComponent.map(u => [u.sourceComponentId, u._sum.instanceCount || 0]),
  );

  const allComponents = sourceFile
    ? await prisma.sourceComponent.findMany({ where: { sourceFileId: sourceFile.id } })
    : [];

  let unusedCount = 0;
  let lowUsageCount = 0;

  const settings = await prisma.appSetting.findFirst();
  const lowThreshold = settings?.lowUsageInstanceThreshold || 5;

  const successfulScansCount = await prisma.scanJob.count({
    where: { status: 'success' },
  });

  for (const comp of allComponents) {
    const total = usageMap.get(comp.id) || 0;
    if (comp.status === 'deprecated') {
      // Deprecated Candidate, not counted as Unused or Low Usage
    } else if (successfulScansCount === 0) {
      // Not Scanned
    } else if (total === 0) {
      unusedCount++;
    } else if (total > 0 && total < lowThreshold) {
      lowUsageCount++;
    }
  }

  const lastScan = await prisma.scanJob.findFirst({
    where: { status: 'success' },
    orderBy: { finishedAt: 'desc' },
  });

  return {
    totalComponents,
    registeredFiles: registeredFilesCount,
    totalInstances: usageAgg._sum.instanceCount || 0,
    unusedComponents: unusedCount,
    lowUsageComponents: lowUsageCount,
    failedScans: failedJobs,
    lastSuccessfulScanAt: lastScan?.finishedAt?.toISOString() || null,
  };
}

export async function getUnusedComponents() {
  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (!sourceFile) return [];

  const components = await prisma.sourceComponent.findMany({
    where: { sourceFileId: sourceFile.id },
  });

  const successfulScansCount = await prisma.scanJob.count({
    where: { status: 'success' },
  });

  const usageByComponent = await prisma.componentUsageCurrent.groupBy({
    by: ['sourceComponentId'],
    _sum: { instanceCount: true },
  });

  const usageMap = new Map(
    usageByComponent.map(u => [u.sourceComponentId, u._sum.instanceCount || 0]),
  );

  return components
    .filter(c => {
      const total = usageMap.get(c.id) || 0;
      if (c.status === 'deprecated') return false;
      if (successfulScansCount === 0) return false;
      return total === 0;
    })
    .map(c => ({
      id: c.id,
      componentName: c.componentName,
      componentSetName: c.componentSetName,
      componentKey: c.componentKey,
      componentNodeId: c.componentNodeId,
      pageName: c.pageName,
      status: c.status,
    }));
}

export async function getLowUsageComponents() {
  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (!sourceFile) return [];

  const settings = await prisma.appSetting.findFirst();
  const threshold = settings?.lowUsageInstanceThreshold || 5;

  const components = await prisma.sourceComponent.findMany({
    where: { sourceFileId: sourceFile.id },
  });

  const successfulScansCount = await prisma.scanJob.count({
    where: { status: 'success' },
  });

  const usageByComponent = await prisma.componentUsageCurrent.groupBy({
    by: ['sourceComponentId'],
    _sum: { instanceCount: true },
  });

  const usageMap = new Map(
    usageByComponent.map(u => [u.sourceComponentId, u._sum.instanceCount || 0]),
  );

  return components
    .map(c => ({ component: c, count: usageMap.get(c.id) || 0 }))
    .filter(item => {
      if (item.component.status === 'deprecated') return false;
      if (successfulScansCount === 0) return false;
      return item.count > 0 && item.count < threshold;
    })
    .sort((a, b) => a.count - b.count)
    .map(item => ({
      id: item.component.id,
      componentName: item.component.componentName,
      componentSetName: item.component.componentSetName,
      componentKey: item.component.componentKey,
      componentNodeId: item.component.componentNodeId,
      count: item.count,
    }));
}

export async function getMostUsedComponents() {
  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (!sourceFile) return [];

  const usageByComponent = await prisma.componentUsageCurrent.groupBy({
    by: ['sourceComponentId'],
    _sum: { instanceCount: true },
  });

  const usageMap = new Map(
    usageByComponent.map(u => [u.sourceComponentId, u._sum.instanceCount || 0]),
  );

  const components = await prisma.sourceComponent.findMany({
    where: { sourceFileId: sourceFile.id },
  });

  return components
    .map(c => ({ component: c, count: usageMap.get(c.id) || 0 }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      id: item.component.id,
      componentName: item.component.componentName,
      componentSetName: item.component.componentSetName,
      count: item.count,
    }));
}

export async function getStaleFiles() {
  const settings = await prisma.appSetting.findFirst();
  const staleDays = settings?.staleFileDaysThreshold || 14;
  const staleThreshold = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);

  return prisma.registeredFile.findMany({
    where: {
      trackingEnabled: true,
      status: { notIn: ['not_scanned', 'disabled'] },
      lastSuccessfulScanAt: { lt: staleThreshold },
    },
  });
}

export async function getFailedScans() {
  return prisma.scanJob.findMany({
    where: { status: 'failed' },
    orderBy: { finishedAt: 'desc' },
    include: { registeredFile: true },
    take: 20,
  });
}

export async function getRecentChanges(limit = 50) {
  const changes = await prisma.usageChange.findMany({
    orderBy: { detectedAt: 'desc' },
    take: limit,
    include: {
      sourceComponent: true,
      registeredFile: true,
    },
  });

  return changes.map(c => ({
    id: c.id,
    scanJobId: c.scanJobId,
    componentId: c.sourceComponentId,
    componentName: c.sourceComponent.componentName,
    componentSetName: c.sourceComponent.componentSetName,
    registeredFileId: c.registeredFileId,
    fileName: c.registeredFile.name,
    previousCount: c.previousCount,
    currentCount: c.currentCount,
    difference: c.difference,
    changeType: c.changeType,
    detectedAt: c.detectedAt.toISOString(),
  }));
}

export async function getAdoptionTrend() {
  const snapshots = await prisma.usageSnapshot.findMany({
    orderBy: { scannedAt: 'asc' },
    include: { scanJob: { include: { registeredFile: true } } },
  });

  const trendMap = new Map<string, { instances: number; files: Set<string> }>();

  for (const snap of snapshots) {
    const dateKey = snap.scannedAt.toISOString().split('T')[0];
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { instances: 0, files: new Set() });
    }
    const entry = trendMap.get(dateKey)!;
    entry.instances += snap.instanceCount;
    entry.files.add(snap.registeredFileId);
  }

  return Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      instances: data.instances,
      files: data.files.size,
    }));
}

export async function getSettings() {
  let settings = await prisma.appSetting.findFirst();
  if (!settings) {
    settings = await prisma.appSetting.create({
      data: {},
    });
  }
  return settings;
}

export async function updateSettings(data: {
  lowUsageInstanceThreshold?: number;
  staleFileDaysThreshold?: number;
  scanDelayMs?: number;
}) {
  let settings = await prisma.appSetting.findFirst();
  if (!settings) {
    settings = await prisma.appSetting.create({ data: {} });
  }

  const updated = await prisma.appSetting.update({
    where: { id: settings.id },
    data,
  });

  void logActivity({
    eventType: 'settings.updated',
    title: 'Settings updated',
    description: `Updated thresholds: low usage=${updated.lowUsageInstanceThreshold}, stale files=${updated.staleFileDaysThreshold}d, delay=${updated.scanDelayMs}ms`,
    entityType: 'app_setting',
    entityId: updated.id,
    severity: 'info',
    metadata: {
      lowUsageThreshold: updated.lowUsageInstanceThreshold,
      staleFileDaysThreshold: updated.staleFileDaysThreshold,
      scanDelayMs: updated.scanDelayMs,
    },
  });

  return updated;
}
