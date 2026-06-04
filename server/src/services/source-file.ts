import { prisma } from '../config/prisma.js';
import { getFigmaClient } from './figma-connection.js';
import { extractFigmaFileKey, isValidFigmaUrl } from '../utils/figma-url-parser.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { importSourceComponents } from '../scanner/detection.js';
import { logActivity } from './activity-log.js';

export async function getSourceFile() {
  const file = await prisma.sourceFile.findFirst({
    where: { status: 'active' },
  });
  return file;
}

export async function registerSourceFile(figmaUrl: string) {
  if (!isValidFigmaUrl(figmaUrl)) {
    throw new AppError(ErrorCodes.INVALID_FIGMA_URL, 'Invalid Figma file URL. Expected format: https://www.figma.com/design/{key}/{name}', 400);
  }

  const fileKey = extractFigmaFileKey(figmaUrl);
  if (!fileKey) {
    throw new AppError(ErrorCodes.INVALID_FIGMA_URL, 'Could not extract file key from URL', 400);
  }

  const figma = await getFigmaClient();
  const meta = await figma.getFileMeta(fileKey);

  const existing = await prisma.sourceFile.findFirst({
    where: { status: 'active' },
  });

  if (existing) {
    await prisma.sourceFile.update({
      where: { id: existing.id },
      data: { status: 'inactive' },
    });
  }

  const file = await prisma.sourceFile.upsert({
    where: { figmaFileKey: fileKey },
    update: {
      name: meta.name,
      figmaUrl: figmaUrl,
      status: 'active',
      lastComponentRefreshAt: new Date(),
    },
    create: {
      figmaFileKey: fileKey,
      name: meta.name,
      figmaUrl: figmaUrl,
      status: 'active',
      lastComponentRefreshAt: new Date(),
    },
  });

  const componentsImported = await refreshComponents(file.id, fileKey);

  void logActivity({
    eventType: 'source.registered',
    title: 'Source UI Kit registered',
    description: `Registered "${meta.name}" with ${componentsImported} components`,
    entityType: 'source_file',
    entityId: file.id,
    severity: 'success',
    metadata: { fileName: meta.name, components: componentsImported },
  });

  return {
    id: file.id,
    figmaFileKey: file.figmaFileKey,
    name: file.name,
    figmaUrl: file.figmaUrl,
    status: file.status,
    componentsImported,
  };
}

export async function refreshSourceComponents(sourceFileId?: string) {
  let sourceFile;
  if (sourceFileId) {
    sourceFile = await prisma.sourceFile.findUnique({ where: { id: sourceFileId } });
  } else {
    sourceFile = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  }

  if (!sourceFile) {
    throw new AppError(ErrorCodes.SOURCE_FILE_NOT_CONFIGURED, 'No active source UI Kit file configured', 400);
  }

  const componentsImported = await refreshComponents(sourceFile.id, sourceFile.figmaFileKey);

  await prisma.sourceFile.update({
    where: { id: sourceFile.id },
    data: { lastComponentRefreshAt: new Date() },
  });

  void logActivity({
    eventType: 'source.components.imported',
    title: 'Source components refreshed',
    description: `Imported ${componentsImported} components from "${sourceFile.name}"`,
    entityType: 'source_file',
    entityId: sourceFile.id,
    severity: 'info',
    metadata: { components: componentsImported },
  });

  return {
    sourceFileId: sourceFile.id,
    componentsImported,
    refreshedAt: new Date().toISOString(),
  };
}

async function refreshComponents(sourceFileId: string, fileKey: string): Promise<number> {
  const figma = await getFigmaClient();
  const figmaFile = await figma.getFile(fileKey);
  const components = importSourceComponents(figmaFile);

  if (components.length === 0) {
    throw new AppError(ErrorCodes.NO_COMPONENTS_FOUND, 'No components found in the source UI Kit file', 400);
  }

  const existingComponents = await prisma.sourceComponent.findMany({
    where: { sourceFileId },
  });

  const existingByNodeId = new Map(existingComponents.map(c => [c.componentNodeId, c]));
  const newNodeIds = new Set(components.map(c => c.componentNodeId));

  for (const comp of components) {
    const existing = existingByNodeId.get(comp.componentNodeId);
    if (existing) {
      await prisma.sourceComponent.update({
        where: { id: existing.id },
        data: {
          componentKey: comp.componentKey,
          componentName: comp.componentName,
          componentSetName: comp.componentSetName,
          pageName: comp.pageName,
          description: comp.description,
          status: 'active',
          lastSeenInSourceAt: new Date(),
        },
      });
    } else {
      await prisma.sourceComponent.create({
        data: {
          sourceFileId,
          componentKey: comp.componentKey,
          componentNodeId: comp.componentNodeId,
          componentName: comp.componentName,
          componentSetName: comp.componentSetName,
          pageName: comp.pageName,
          description: comp.description,
          status: 'active',
        },
      });
    }
  }

  for (const [nodeId, existing] of existingByNodeId) {
    if (!newNodeIds.has(nodeId)) {
      await prisma.sourceComponent.update({
        where: { id: existing.id },
        data: { status: 'deprecated' },
      });
    }
  }

  return components.length;
}

export async function removeSourceFile() {
  const file = await prisma.sourceFile.findFirst({ where: { status: 'active' } });
  if (file) {
    await prisma.sourceFile.update({
      where: { id: file.id },
      data: { status: 'inactive' },
    });

    void logActivity({
      eventType: 'source.removed',
      title: 'Source UI Kit removed',
      description: `Removed "${file.name}"`,
      entityType: 'source_file',
      entityId: file.id,
      severity: 'warning',
    });
  }
  return { removed: true };
}
