import type { FigmaFileResponse, FigmaComponentMeta } from '../figma/figma-client.js';
import { traverseTree, traverseTreeWithNesting, type TraversalContext } from './tree-traversal.js';
import { toFigmaNodeUrl } from '../utils/figma-url-parser.js';

export interface SourceComponentInput {
  componentNodeId: string;
  componentKey: string | null;
  componentName: string;
  componentSetName: string | null;
  pageName: string;
  description: string | null;
}

export function importSourceComponents(figmaFile: FigmaFileResponse): SourceComponentInput[] {
  const result: SourceComponentInput[] = [];
  const componentKeys = new Set<string>();

  traverseTree(figmaFile.document, (node, context) => {
    if (node.type === 'COMPONENT') {
      const meta = figmaFile.components?.[node.id];
      const key = meta?.key || null;

      if (key && componentKeys.has(key)) return;
      if (key) componentKeys.add(key);

      result.push({
        componentNodeId: node.id,
        componentKey: key,
        componentName: node.name,
        componentSetName: context.parentComponentSetName,
        pageName: context.pageName,
        description: meta?.description || null,
      });
    }
  });

  return result;
}

export type UsageDepth = 'direct' | 'nested';

export interface DetectedInstance {
  sourceComponentId: string;
  sourceComponentNodeId: string;
  registeredFileId: string;
  instanceNodeId: string;
  instanceName: string | null;
  pageName: string;
  frameName: string | null;
  figmaNodeUrl: string;
  usageDepth: UsageDepth;
  parentSourceComponentId: string | null;
  parentInstanceNodeId: string | null;
}

export interface SourceComponentMap {
  byKey: Map<string, { id: string; componentNodeId: string; componentName: string }>;
  byNodeId: Map<string, { id: string; componentNodeId: string; componentName: string }>;
}

export function buildSourceComponentMap(
  components: Array<{ id: string; componentKey: string | null; componentNodeId: string; componentName: string }>,
): SourceComponentMap {
  const byKey = new Map<string, { id: string; componentNodeId: string; componentName: string }>();
  const byNodeId = new Map<string, { id: string; componentNodeId: string; componentName: string }>();

  for (const comp of components) {
    const entry = { id: comp.id, componentNodeId: comp.componentNodeId, componentName: comp.componentName };
    if (comp.componentKey) {
      byKey.set(comp.componentKey, entry);
    }
    byNodeId.set(comp.componentNodeId, entry);
  }

  return { byKey, byNodeId };
}

function resolveSourceComponent(
  instanceNode: { componentId?: string; id: string },
  consumerFileComponents: Record<string, FigmaComponentMeta> | undefined,
  sourceComponentMap: SourceComponentMap,
): { id: string; componentNodeId: string } | null {
  const componentId = instanceNode.componentId;
  if (!componentId) return null;

  const componentMeta = consumerFileComponents?.[componentId];
  if (componentMeta?.key) {
    const byKey = sourceComponentMap.byKey.get(componentMeta.key);
    if (byKey) return byKey;
  }

  const byNodeId = sourceComponentMap.byNodeId.get(componentId);
  if (byNodeId) return byNodeId;

  return null;
}

interface MatchedInstanceInfo {
  sourceComponentId: string;
  instanceNodeId: string;
}

export function detectSourceInstances(input: {
  figmaFile: FigmaFileResponse;
  registeredFileId: string;
  registeredFileKey: string;
  sourceComponentMap: SourceComponentMap;
}): DetectedInstance[] {
  const detected: DetectedInstance[] = [];

  traverseTreeWithNesting<MatchedInstanceInfo>(
    input.figmaFile.document,
    (node, context) => {
      if (node.type !== 'INSTANCE') return null;

      const sourceComponent = resolveSourceComponent(
        node,
        input.figmaFile.components,
        input.sourceComponentMap,
      );

      if (!sourceComponent) return null;

      const isNested = context.insideSourceComponentId !== null;

      detected.push({
        sourceComponentId: sourceComponent.id,
        sourceComponentNodeId: sourceComponent.componentNodeId,
        registeredFileId: input.registeredFileId,
        instanceNodeId: node.id,
        instanceName: node.name || null,
        pageName: context.pageName,
        frameName: context.frameName,
        figmaNodeUrl: toFigmaNodeUrl(input.registeredFileKey, node.id),
        usageDepth: isNested ? 'nested' : 'direct',
        parentSourceComponentId: isNested ? context.insideSourceComponentId : null,
        parentInstanceNodeId: isNested ? context.insideInstanceNodeId : null,
      });

      return {
        sourceComponentId: sourceComponent.id,
        instanceNodeId: node.id,
      };
    },
    (node, context, result) => {
      if (node.type === 'INSTANCE' && result) {
        return {
          ...context,
          insideSourceComponentId: result.sourceComponentId,
          insideInstanceNodeId: result.instanceNodeId,
        };
      }
      return context;
    },
  );

  return detected;
}

export interface AggregatedUsage {
  sourceComponentId: string;
  registeredFileId: string;
  instanceCount: number;
  pageCount: number;
  frameCount: number;
}

export function aggregateUsage(instances: DetectedInstance[]): AggregatedUsage[] {
  const directInstances = instances.filter(inst => inst.usageDepth === 'direct');
  
  const grouped = new Map<string, { instances: DetectedInstance[]; pages: Set<string>; frames: Set<string> }>();

  for (const inst of directInstances) {
    const key = `${inst.sourceComponentId}:${inst.registeredFileId}`;
    if (!grouped.has(key)) {
      grouped.set(key, { instances: [], pages: new Set(), frames: new Set() });
    }
    const group = grouped.get(key)!;
    group.instances.push(inst);
    if (inst.pageName) group.pages.add(inst.pageName);
    if (inst.frameName) group.frames.add(inst.frameName);
  }

  const result: AggregatedUsage[] = [];
  for (const [, group] of grouped) {
    const first = group.instances[0];
    result.push({
      sourceComponentId: first.sourceComponentId,
      registeredFileId: first.registeredFileId,
      instanceCount: group.instances.length,
      pageCount: group.pages.size,
      frameCount: group.frames.size,
    });
  }

  return result;
}
