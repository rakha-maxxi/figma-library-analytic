import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { FigmaClient } from '../figma/figma-client.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { logActivity } from './activity-log.js';

export async function getConnectionStatus() {
  const conn = await prisma.figmaConnection.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!conn) {
    return { connected: false, status: 'disconnected', authType: null, lastValidatedAt: null, connectedUserName: null, connectedUserEmail: null };
  }

  return {
    connected: conn.status === 'connected',
    status: conn.status,
    authType: conn.authType,
    lastValidatedAt: conn.lastValidatedAt?.toISOString() || null,
    connectedUserName: conn.connectedUserName,
    connectedUserEmail: conn.connectedUserEmail,
  };
}

export async function connectFigma(accessToken: string) {
  const figma = new FigmaClient(accessToken, 'pat');
  const user = await figma.validateToken();

  const encrypted = encrypt(accessToken);

  const existing = await prisma.figmaConnection.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  let connection;
  if (existing) {
    connection = await prisma.figmaConnection.update({
      where: { id: existing.id },
      data: {
        authType: 'pat',
        encryptedAccessToken: encrypted,
        encryptedRefreshToken: null,
        status: 'connected',
        connectedUserName: user.handle,
        connectedUserEmail: user.email,
        lastValidatedAt: new Date(),
      },
    });
  } else {
    connection = await prisma.figmaConnection.create({
      data: {
        authType: 'pat',
        encryptedAccessToken: encrypted,
        status: 'connected',
        connectedUserName: user.handle,
        connectedUserEmail: user.email,
        lastValidatedAt: new Date(),
      },
    });
  }

  void logActivity({
    eventType: 'figma.pat.connected',
    title: 'Figma PAT connected',
    description: `Connected as ${user.handle} (${user.email})`,
    entityType: 'figma_connection',
    entityId: connection.id,
    severity: 'success',
    metadata: { user: user.handle, email: user.email },
  });

  return {
    status: connection.status,
    authType: connection.authType,
    connectedUserName: connection.connectedUserName,
    connectedUserEmail: connection.connectedUserEmail,
    lastValidatedAt: connection.lastValidatedAt?.toISOString() || null,
  };
}

export async function disconnectFigma() {
  const existing = await prisma.figmaConnection.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    await prisma.figmaConnection.update({
      where: { id: existing.id },
      data: { status: 'disconnected' },
    });
  }

  void logActivity({
    eventType: 'figma.disconnected',
    title: 'Figma connection disconnected',
    entityType: 'figma_connection',
    severity: 'info',
  });

  return { status: 'disconnected' };
}

export async function getFigmaClient(): Promise<FigmaClient> {
  const conn = await prisma.figmaConnection.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!conn || conn.status !== 'connected') {
    throw new AppError(ErrorCodes.NOT_CONNECTED, 'Figma is not connected. Please connect your Figma account first.', 400);
  }

  let token = decrypt(conn.encryptedAccessToken);
  const authType = conn.authType as 'pat' | 'oauth';

  // Auto-refresh OAuth token if expired or close to expiry (within 5 min)
  if (authType === 'oauth' && conn.expiresAt && conn.encryptedRefreshToken) {
    const expiresIn = conn.expiresAt.getTime() - Date.now();
    if (expiresIn < 300000) {
      const refreshToken = decrypt(conn.encryptedRefreshToken);
      try {
        const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.figmaOauthClientId,
            client_secret: config.figmaOauthClientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }).toString(),
        });
        if (tokenRes.ok) {
          const data = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in: number };
          token = data.access_token;
          await prisma.figmaConnection.update({
            where: { id: conn.id },
            data: {
              encryptedAccessToken: encrypt(token),
              encryptedRefreshToken: data.refresh_token ? encrypt(data.refresh_token) : undefined,
              expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
            },
          });
          void logActivity({
            eventType: 'figma.oauth.refreshed',
            title: 'OAuth token refreshed',
            entityType: 'figma_connection',
            entityId: conn.id,
            severity: 'info',
          });
        }
      } catch { /* keep existing token if refresh fails */ }
    }
  }

  return new FigmaClient(token, authType);
}
