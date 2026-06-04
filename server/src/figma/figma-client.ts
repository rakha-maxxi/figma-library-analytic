import { config } from '../config/index.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  componentId?: string;
  componentProperties?: Record<string, unknown>;
}

export interface FigmaComponentMeta {
  key: string;
  name: string;
  description?: string;
  componentSetId?: string;
  documentationLinks?: unknown[];
}

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  document: FigmaNode;
  components: Record<string, FigmaComponentMeta>;
  componentSets?: Record<string, { key: string; name: string; description?: string }>;
}

export interface FigmaFileMetaResponse {
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
}

export interface FigmaUserResponse {
  id: string;
  handle: string;
  email: string;
  img_url: string;
}

export class FigmaClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = config.figmaApiBaseUrl;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.token,
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new AppError(
        ErrorCodes.FIGMA_RATE_LIMITED,
        'Figma API rate limit exceeded. Please wait a moment and try again.',
        429,
        { retryAfterSeconds: retryAfter ? parseInt(retryAfter, 10) : 30 },
      );
    }

    if (response.status === 403) {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>;
      const detail = (body.err as string) || (body.message as string) || '';
      throw new AppError(
        ErrorCodes.FIGMA_ACCESS_DENIED,
        `Cannot access this Figma file. Make sure your Personal Access Token has access to this file. ${detail ? `Figma says: ${detail}` : 'The file may be private or your token may lack the required scope (file_content:read).'}`,
        403,
      );
    }

    if (response.status === 404) {
      throw new AppError(ErrorCodes.FIGMA_FILE_NOT_FOUND, 'Figma file not found. Check that the URL is correct and the file still exists.', 404);
    }

    if (response.status === 401) {
      throw new AppError(ErrorCodes.FIGMA_TOKEN_INVALID, 'Invalid Figma access token. Please reconnect your token in Settings.', 401);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new AppError(ErrorCodes.FIGMA_API_ERROR, `Figma API error (${response.status}). ${body}`, response.status, body);
    }

    return response.json() as Promise<T>;
  }

  async validateToken(): Promise<FigmaUserResponse> {
    return this.request<FigmaUserResponse>('/v1/me');
  }

  async getFileMeta(fileKey: string): Promise<FigmaFileMetaResponse> {
    return this.request<FigmaFileMetaResponse>(`/v1/files/${fileKey}?depth=1`);
  }

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    return this.request<FigmaFileResponse>(`/v1/files/${fileKey}`);
  }
}
