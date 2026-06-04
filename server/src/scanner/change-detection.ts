export type ChangeType = 'newly_used' | 'increased' | 'decreased' | 'removed';

export interface ChangeRecord {
  sourceComponentId: string;
  registeredFileId: string;
  changeType: ChangeType;
  previousCount: number;
  currentCount: number;
  difference: number;
}

function getChangeType(previousCount: number, currentCount: number): ChangeType | 'no_change' {
  if (previousCount === 0 && currentCount > 0) return 'newly_used';
  if (previousCount > 0 && currentCount === 0) return 'removed';
  if (currentCount > previousCount) return 'increased';
  if (currentCount < previousCount) return 'decreased';
  return 'no_change';
}

export function detectChanges(
  currentUsage: Array<{ sourceComponentId: string; registeredFileId: string; instanceCount: number }>,
  previousUsage: Array<{ sourceComponentId: string; registeredFileId: string; instanceCount: number }>,
): ChangeRecord[] {
  const changes: ChangeRecord[] = [];

  const prevMap = new Map<string, number>();
  for (const prev of previousUsage) {
    prevMap.set(`${prev.sourceComponentId}:${prev.registeredFileId}`, prev.instanceCount);
  }

  const currentKeys = new Set<string>();

  for (const curr of currentUsage) {
    const key = `${curr.sourceComponentId}:${curr.registeredFileId}`;
    currentKeys.add(key);
    const prevCount = prevMap.get(key) || 0;
    const changeType = getChangeType(prevCount, curr.instanceCount);

    if (changeType !== 'no_change') {
      changes.push({
        sourceComponentId: curr.sourceComponentId,
        registeredFileId: curr.registeredFileId,
        changeType,
        previousCount: prevCount,
        currentCount: curr.instanceCount,
        difference: curr.instanceCount - prevCount,
      });
    }
  }

  for (const prev of previousUsage) {
    const key = `${prev.sourceComponentId}:${prev.registeredFileId}`;
    if (!currentKeys.has(key) && prev.instanceCount > 0) {
      changes.push({
        sourceComponentId: prev.sourceComponentId,
        registeredFileId: prev.registeredFileId,
        changeType: 'removed',
        previousCount: prev.instanceCount,
        currentCount: 0,
        difference: -prev.instanceCount,
      });
    }
  }

  return changes;
}
