import type { FigmaNode } from '../figma/figma-client.js';

export interface TraversalContext {
  pageName: string;
  parentComponentSetName: string | null;
  frameName: string | null;
  insideSourceComponentId: string | null;
  insideInstanceNodeId: string | null;
}

export function traverseTree(
  node: FigmaNode,
  callback: (node: FigmaNode, context: TraversalContext) => void,
  context: TraversalContext = { 
    pageName: '', 
    parentComponentSetName: null, 
    frameName: null,
    insideSourceComponentId: null,
    insideInstanceNodeId: null,
  },
) {
  if (node.type === 'CANVAS') {
    context = { ...context, pageName: node.name };
  }

  if (node.type === 'COMPONENT_SET') {
    context = { ...context, parentComponentSetName: node.name };
  }

  if (node.type === 'FRAME' || node.type === 'SECTION' || node.type === 'GROUP') {
    if (!context.frameName) {
      context = { ...context, frameName: node.name };
    }
  }

  callback(node, context);

  if (node.children) {
    for (const child of node.children) {
      traverseTree(child, callback, { ...context });
    }
  }
}

export function traverseTreeWithNesting<T>(
  node: FigmaNode,
  processNode: (node: FigmaNode, context: TraversalContext) => T | null,
  updateContextForChildren: (node: FigmaNode, context: TraversalContext, result: T | null) => TraversalContext,
  context: TraversalContext = { 
    pageName: '', 
    parentComponentSetName: null, 
    frameName: null,
    insideSourceComponentId: null,
    insideInstanceNodeId: null,
  },
): void {
  if (node.type === 'CANVAS') {
    context = { ...context, pageName: node.name };
  }

  if (node.type === 'COMPONENT_SET') {
    context = { ...context, parentComponentSetName: node.name };
  }

  if (node.type === 'FRAME' || node.type === 'SECTION' || node.type === 'GROUP') {
    if (!context.frameName) {
      context = { ...context, frameName: node.name };
    }
  }

  const result = processNode(node, context);
  const childContext = updateContextForChildren(node, context, result);

  if (node.children) {
    for (const child of node.children) {
      traverseTreeWithNesting(child, processNode, updateContextForChildren, { ...childContext });
    }
  }
}
