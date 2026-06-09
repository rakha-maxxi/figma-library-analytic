import type { FigmaNode, FigmaFileResponse } from '../figma/figma-client.js';
import { toFigmaNodeUrl } from '../utils/figma-url-parser.js';
import { traverseTree, type TraversalContext } from './tree-traversal.js';

export interface ComponentFingerprint {
  sourceComponentId: string;
  componentName: string;
  componentSetName: string | null;
  propertyKeys: string[];
  childNames: string[];
  childTypes: string[];
  childCount: number;
  textLayerCount: number;
  vectorCount: number;
  autoLayoutType: string | null;
  fillCount: number;
  strokeCount: number;
  cornerRadius: number | null;
}

export interface DetachedCandidate {
  registeredFileId: string;
  sourceComponentId: string | null;
  candidateNodeId: string;
  candidateNodeName: string;
  pageName: string | null;
  frameName: string | null;
  figmaNodeUrl: string;
  detectionType: 'confirmed_detached' | 'suspected_by_name' | 'suspected_by_structure' | 'suspected_by_visual_signature';
  confidenceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchedSignals: string[];
  reason: string;
}

function buildFingerprint(
  node: FigmaNode,
  sourceComponentId: string,
  componentName: string,
  componentSetName: string | null,
  componentProperties: Record<string, unknown> | undefined,
): ComponentFingerprint {
  let autoLayoutType: string | null = null;
  if (node.layoutMode) autoLayoutType = node.layoutMode as string;
  const fp: ComponentFingerprint = {
    sourceComponentId,
    componentName,
    componentSetName,
    propertyKeys: componentProperties ? Object.keys(componentProperties) : [],
    childNames: [],
    childTypes: [],
    childCount: node.children?.length || 0,
    textLayerCount: 0,
    vectorCount: 0,
    autoLayoutType: node.layoutMode ? (node.layoutMode as string) : null,
    fillCount: Array.isArray(node.fills) ? node.fills.length : 0,
    strokeCount: Array.isArray(node.strokes) ? node.strokes.length : 0,
    cornerRadius: node.cornerRadius != null ? (node.cornerRadius as number) : null,
  };

  if (node.children) {
    for (const child of node.children) {
      fp.childNames.push(child.name);
      fp.childTypes.push(child.type);
      if (child.type === 'TEXT') fp.textLayerCount++;
      if (child.type === 'VECTOR' || child.type === 'BOOLEAN_OPERATION' || child.type === 'STAR' || child.type === 'LINE' || child.type === 'ELLIPSE' || child.type === 'REGULAR_POLYGON') {
        fp.vectorCount++;
      }
    }
  }

  return fp;
}

function nameSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const lb = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.7;
  // Levenshtein-ish ratio
  const maxLen = Math.max(la.length, lb.length);
  if (maxLen === 0) return 0;
  let matches = 0;
  const shorter = la.length < lb.length ? la : lb;
  const longer = la.length < lb.length ? lb : la;
  let si = 0;
  for (let li = 0; li < longer.length && si < shorter.length; li++) {
    if (longer[li] === shorter[si]) { matches++; si++; }
    else si++;
  }
  return matches / maxLen;
}

function structureSimilarity(a: ComponentFingerprint, node: FigmaNode): { score: number; signals: string[] } {
  const signals: string[] = [];
  let total = 0;
  let matched = 0;

  const children = node.children || [];
  total++; if (a.childCount > 0 && a.childCount <= children.length + 2 && a.childCount >= children.length - 2) { matched++; signals.push('childCount'); }

  total++; const textCount = children.filter(c => c.type === 'TEXT').length;
  if (a.textLayerCount > 0 && textCount >= a.textLayerCount - 1 && textCount <= a.textLayerCount + 1) { matched++; signals.push('textLayers'); }

  total++; const vecCount = children.filter(c => ['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE'].includes(c.type)).length;
  if (a.vectorCount > 0 && vecCount >= a.vectorCount - 1 && vecCount <= a.vectorCount + 1) { matched++; signals.push('vectorCount'); }

  if (a.cornerRadius != null && node.cornerRadius != null && Math.abs((a.cornerRadius) - (node.cornerRadius as number)) < 2) {
    total++; matched++; signals.push('cornerRadius');
  }

  total += a.childNames.length;
  const nodeChildNames = children.map(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const name of a.childNames) {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nodeChildNames.includes(clean) || nodeChildNames.some(n => n.includes(clean) || clean.includes(n))) matched++;
  }
  if (matched > 0) signals.push('childNames');

  return { score: total > 0 ? matched / total : 0, signals };
}

function visualSimilarity(a: ComponentFingerprint, node: FigmaNode): { score: number; signals: string[] } {
  const signals: string[] = [];
  let matched = 0;
  let total = 0;

  if (a.autoLayoutType && node.layoutMode) { total++; if (a.autoLayoutType === node.layoutMode) matched++; signals.push('autoLayout'); }

  total++; const nodeFills = Array.isArray(node.fills) ? node.fills.length : 0;
  if (a.fillCount > 0 && nodeFills > 0) { matched++; signals.push('fills'); }

  total++; const nodeStrokes = Array.isArray(node.strokes) ? node.strokes.length : 0;
  if (a.strokeCount > 0 && nodeStrokes > 0) { matched++; signals.push('strokes'); }

  return { score: total > 0 ? matched / total : 0, signals };
}

function confidenceLevel(score: number): { level: 'high' | 'medium' | 'low'; score: number } {
  return {
    level: score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low',
    score: Math.round(score * 100) / 100,
  };
}

export function buildFingerprints(
  sourceComponents: Array<{ id: string; componentName: string; componentSetName: string | null }>,
  sourceFile: FigmaFileResponse,
): Map<string, ComponentFingerprint> {
  const map = new Map<string, ComponentFingerprint>();
  const compById = new Map(sourceComponents.map(c => [c.id, c]));

  traverseTree(sourceFile.document, (node, _context) => {
    if (node.type !== 'COMPONENT') return;
    const sourceComp = sourceComponents.find(c => c.id === node.id || (node.id && compById.get(node.id)));
    if (!sourceComp) return;
    const componentMeta = sourceFile.components?.[node.id];
    map.set(sourceComp.id, buildFingerprint(node, sourceComp.id, sourceComp.componentName, sourceComp.componentSetName, node.componentProperties));
  });

  return map;
}

export function detectDetachedCandidates(input: {
  figmaFile: FigmaFileResponse;
  registeredFileId: string;
  registeredFileKey: string;
  fingerprints: Map<string, ComponentFingerprint>;
  scannedSourceComponentIds: Set<string>;
}): DetachedCandidate[] {
  const candidates: DetachedCandidate[] = [];

  traverseTree(input.figmaFile.document, (node, context) => {
    if (node.type === 'INSTANCE' || node.type === 'CANVAS' || node.type === 'DOCUMENT') return;
    if (node.type !== 'FRAME' && node.type !== 'GROUP' && node.type !== 'COMPONENT') return;

    // Check explicit detached metadata from Figma
    const componentMeta = input.figmaFile.components?.[node.id];
    if (componentMeta && input.scannedSourceComponentIds.has(node.id)) return; // Already scanned as instance

    // Check for detached origin (Figma sometimes includes this on detached instances)
    const detachedInfo = node.detachedInfo || node.componentPropertyReferences;
    if (detachedInfo && typeof detachedInfo === 'object' && Object.keys(detachedInfo as object).length > 0) {
      const sourceCompId = Array.from(input.fingerprints.keys()).find(k => {
        const fp = input.fingerprints.get(k)!;
        return fp.componentName.toLowerCase() === node.name.toLowerCase();
      }) || null;
      candidates.push({
        registeredFileId: input.registeredFileId,
        sourceComponentId: sourceCompId,
        candidateNodeId: node.id,
        candidateNodeName: node.name,
        pageName: context.pageName,
        frameName: context.frameName,
        figmaNodeUrl: toFigmaNodeUrl(input.registeredFileKey, node.id),
        detectionType: 'confirmed_detached',
        confidenceScore: 1,
        confidenceLevel: 'high',
        matchedSignals: ['detachedInfo_metadata'],
        reason: sourceCompId
          ? `Detached instance of "${node.name}" confirmed by Figma metadata`
          : `Detached node "${node.name}" with component origin metadata`,
      });
      return;
    }

    // Heuristic detection: compare against fingerprints
    let bestMatch: { fingerprint: ComponentFingerprint; score: number; signals: string[]; reason: string; type: DetachedCandidate['detectionType'] } | null = null;

    for (const fp of input.fingerprints.values()) {
      const nameScore = nameSimilarity(fp.componentName, node.name);
      const setNameScore = fp.componentSetName ? nameSimilarity(fp.componentSetName, node.name) : 0;
      const bestNameScore = Math.max(nameScore, setNameScore);

      // Name-based detection
      if (bestNameScore >= 0.6) {
        const structure = structureSimilarity(fp, node);
        const combinedScore = (bestNameScore * 0.6 + structure.score * 0.4);
        const conf = confidenceLevel(combinedScore);
        if (combinedScore >= 0.4) {
          const signals = [...structure.signals, 'nameMatch'];
          if (!bestMatch || combinedScore > bestMatch.score) {
            bestMatch = {
              fingerprint: fp,
              score: combinedScore,
              signals,
              reason: `Name "${node.name}" matched to "${fp.componentName}"${fp.componentSetName ? ` (${fp.componentSetName})` : ''}`,
              type: 'suspected_by_name',
            };
          }
        }
      }

      // Structure-based detection (for renamed detached components)
      if (bestNameScore < 0.4) {
        const structure = structureSimilarity(fp, node);
        if (structure.score >= 0.5) {
          const visual = visualSimilarity(fp, node);
          const combinedScore = (structure.score * 0.7 + visual.score * 0.3);
          const conf = confidenceLevel(combinedScore);
          if (combinedScore >= 0.4 && (!bestMatch || combinedScore > bestMatch.score)) {
            bestMatch = {
              fingerprint: fp,
              score: combinedScore,
              signals: [...structure.signals, ...visual.signals],
              reason: `Structure similar to "${fp.componentName}"${fp.componentSetName ? ` (${fp.componentSetName})` : ''}: ${structure.signals.join(', ')}`,
              type: 'suspected_by_structure',
            };
          }
        }
      }

      // Visual signature only (low priority, fallback)
      if (!bestMatch) {
        const visual = visualSimilarity(fp, node);
        if (visual.score >= 0.6) {
          const conf = confidenceLevel(visual.score);
          if (visual.score >= 0.5) {
            bestMatch = {
              fingerprint: fp,
              score: visual.score,
              signals: visual.signals,
              reason: `Visual properties match "${fp.componentName}": ${visual.signals.join(', ')}`,
              type: 'suspected_by_visual_signature',
            };
          }
        }
      }
    }

    if (bestMatch) {
      const conf = confidenceLevel(bestMatch.score);
      candidates.push({
        registeredFileId: input.registeredFileId,
        sourceComponentId: bestMatch.fingerprint.sourceComponentId,
        candidateNodeId: node.id,
        candidateNodeName: node.name,
        pageName: context.pageName,
        frameName: context.frameName,
        figmaNodeUrl: toFigmaNodeUrl(input.registeredFileKey, node.id),
        detectionType: bestMatch.type,
        confidenceScore: conf.score,
        confidenceLevel: conf.level,
        matchedSignals: bestMatch.signals,
        reason: bestMatch.reason + ` (confidence: ${Math.round(conf.score * 100)}%)`,
      });
    }
  });

  return candidates;
}
