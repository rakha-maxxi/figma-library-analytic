import { prisma } from '../config/prisma.js';

export interface ComponentFilters {
  search?: string;
  status?: string;
  set?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export async function getComponents(filters?: ComponentFilters) {
  const sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (!sourceFile) return [];

  const where: Record<string, unknown> = { sourceFileId: sourceFile.id };

  if (filters?.set && filters.set !== 'all') {
    where.componentSetName = filters.set;
  }
  if (filters?.search) {
    where.OR = [
      { componentName: { contains: filters.search, mode: 'insensitive' } },
      { componentSetName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const components = await prisma.sourceComponent.findMany({
    where,
    orderBy: { componentName: 'asc' },
  });

  const settings = await prisma.appSetting.findFirst();
  const threshold = settings?.lowUsageInstanceThreshold ?? 5;

  const successfulScansCount = await prisma.scanJob.count({
    where: { status: 'success' },
  });

  const usageData = await prisma.componentUsageCurrent.groupBy({
    by: ['sourceComponentId'],
    _sum: { instanceCount: true },
    _count: { registeredFileId: true },
  });

  const usageMap = new Map(
    usageData.map(u => [
      u.sourceComponentId,
      { totalInstances: u._sum.instanceCount || 0, filesUsed: u._count.registeredFileId },
    ]),
  );

  const lastSeenData = await prisma.componentUsageCurrent.groupBy({
    by: ['sourceComponentId'],
    _max: { lastSeenAt: true },
  });

  const lastSeenMap = new Map(
    lastSeenData.map(u => [u.sourceComponentId, u._max.lastSeenAt]),
  );

  let result = components.map(comp => {
    const usage = usageMap.get(comp.id);
    const totalInstances = usage?.totalInstances || 0;
    const filesUsed = usage?.filesUsed || 0;
    const lastSeenAt = lastSeenMap.get(comp.id)?.toISOString() || null;

    let usageStatus = 'Not Scanned';
    if (comp.status === 'deprecated') {
      usageStatus = 'Deprecated Candidate';
    } else if (successfulScansCount === 0) {
      usageStatus = 'Not Scanned';
    } else if (totalInstances === 0) {
      usageStatus = 'Unused';
    } else if (totalInstances > 0 && totalInstances < threshold) {
      usageStatus = 'Low Usage';
    } else if (totalInstances >= threshold) {
      usageStatus = 'Used';
    }

    return {
      id: comp.id,
      sourceFileId: comp.sourceFileId,
      componentKey: comp.componentKey,
      componentNodeId: comp.componentNodeId,
      componentName: comp.componentName,
      componentSetName: comp.componentSetName,
      pageName: comp.pageName,
      description: comp.description,
      status: comp.status,
      totalInstances,
      filesUsed,
      usageStatus,
      lastSeenAt,
    };
  });

  if (filters?.status && filters.status !== 'all') {
    const normalizedFilter = filters.status.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
    result = result.filter(r => r.usageStatus.toLowerCase() === normalizedFilter);
  }

  if (filters?.sort) {
    const [field, direction] = filters.sort.split(':');
    result.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[field];
      const bVal = (b as Record<string, unknown>)[field];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return direction === 'desc'
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });
  }

  return result;
}

export async function getComponentDetail(id: string) {
  const component = await prisma.sourceComponent.findUnique({ where: { id } });
  if (!component) return null;

  const usage = await prisma.componentUsageCurrent.findMany({
    where: { sourceComponentId: id },
    include: { registeredFile: true },
  });

  const files = usage.map(u => ({
    file: {
      id: u.registeredFile.id,
      name: u.registeredFile.name,
      figmaFileKey: u.registeredFile.figmaFileKey,
      figmaUrl: u.registeredFile.figmaUrl,
      status: u.registeredFile.status,
    },
    count: u.instanceCount,
    lastSeen: u.lastSeenAt?.toISOString() || u.lastScannedAt.toISOString(),
  }));

  const instances = await prisma.usageInstance.findMany({
    where: { sourceComponentId: id, status: 'active' },
    include: { registeredFile: true },
    take: 100,
  });

  const instanceList = instances.map(i => ({
    id: i.id,
    componentId: i.sourceComponentId,
    componentName: component.componentName,
    registeredFileId: i.registeredFileId,
    fileName: i.registeredFile.name,
    pageName: i.pageName,
    frameName: i.frameName,
    figmaNodeId: i.instanceNodeId,
    figmaNodeUrl: i.figmaNodeUrl,
  }));

  const snapshots = await prisma.usageSnapshot.findMany({
    where: { sourceComponentId: id },
    orderBy: { scannedAt: 'asc' },
  });

  const trendMap = new Map<string, number>();
  for (const snap of snapshots) {
    const dateKey = snap.scannedAt.toISOString().split('T')[0];
    trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + snap.instanceCount);
  }

  const trend = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  const totalInstances = usage.reduce((sum, u) => sum + u.instanceCount, 0);

  const settings = await prisma.appSetting.findFirst();
  const threshold = settings?.lowUsageInstanceThreshold ?? 5;
  const successfulScansCount = await prisma.scanJob.count({
    where: { status: 'success' },
  });

  let usageStatus = 'Not Scanned';
  if (component.status === 'deprecated') {
    usageStatus = 'Deprecated Candidate';
  } else if (successfulScansCount === 0) {
    usageStatus = 'Not Scanned';
  } else if (totalInstances === 0) {
    usageStatus = 'Unused';
  } else if (totalInstances > 0 && totalInstances < threshold) {
    usageStatus = 'Low Usage';
  } else if (totalInstances >= threshold) {
    usageStatus = 'Used';
  }

  return {
    component: {
      id: component.id,
      sourceFileId: component.sourceFileId,
      componentKey: component.componentKey,
      componentNodeId: component.componentNodeId,
      componentName: component.componentName,
      componentSetName: component.componentSetName,
      pageName: component.pageName,
      description: component.description,
      status: component.status,
      totalInstances,
      filesUsed: files.length,
      usageStatus,
    },
    files,
    instances: instanceList,
    trend: trend.length > 0 ? trend : [{ date: 'Initial', count: 0 }],
  };
}

export async function getComponentFiles(id: string) {
  const usage = await prisma.componentUsageCurrent.findMany({
    where: { sourceComponentId: id },
    include: { registeredFile: true },
    orderBy: { instanceCount: 'desc' },
  });

  return usage.map(u => ({
    file: {
      id: u.registeredFile.id,
      name: u.registeredFile.name,
      figmaFileKey: u.registeredFile.figmaFileKey,
      figmaUrl: u.registeredFile.figmaUrl,
      status: u.registeredFile.status,
    },
    instanceCount: u.instanceCount,
    lastSeenAt: u.lastSeenAt?.toISOString() || u.lastScannedAt.toISOString(),
  }));
}

export async function getComponentInstances(id: string) {
  const instances = await prisma.usageInstance.findMany({
    where: { sourceComponentId: id, status: 'active' },
    include: { registeredFile: true },
    orderBy: { lastSeenAt: 'desc' },
  });

  return instances.map(i => ({
    id: i.id,
    instanceNodeId: i.instanceNodeId,
    instanceName: i.instanceName,
    pageName: i.pageName,
    frameName: i.frameName,
    figmaNodeUrl: i.figmaNodeUrl,
    fileName: i.registeredFile.name,
    registeredFileId: i.registeredFileId,
    firstSeenAt: i.firstSeenAt.toISOString(),
    lastSeenAt: i.lastSeenAt.toISOString(),
    status: i.status,
  }));
}

export async function getComponentTrend(id: string) {
  const snapshots = await prisma.usageSnapshot.findMany({
    where: { sourceComponentId: id },
    orderBy: { scannedAt: 'asc' },
  });

  const trendMap = new Map<string, number>();
  for (const snap of snapshots) {
    const dateKey = snap.scannedAt.toISOString().split('T')[0];
    trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + snap.instanceCount);
  }

  return Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));
}
