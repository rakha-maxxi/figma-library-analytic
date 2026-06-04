export function extractFigmaFileKey(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  const patterns = [
    /figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isValidFigmaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https?:\/\/(www\.)?figma\.com\/(design|file)\/[a-zA-Z0-9]+/.test(trimmed);
}

export function toFigmaNodeUrl(fileKey: string, nodeId: string): string {
  const encodedNodeId = nodeId.replace(/:/g, '-');
  return `https://www.figma.com/design/${fileKey}?node-id=${encodedNodeId}`;
}

export function toFigmaFileUrl(fileKey: string): string {
  return `https://www.figma.com/design/${fileKey}`;
}
