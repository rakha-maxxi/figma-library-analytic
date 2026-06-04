import { prisma } from '../config/prisma.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { FigmaClient } from '../figma/figma-client.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { logActivity } from './activity-log.js';

export async function getConnectionStatus() {
  const conn = await prisma.figmaConnection.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!conn) {
    return { connected: false, status: 'disconnected', lastValidatedAt: null, connectedUserName: null, connectedUserEmail: null };
  }

  return {
    connected: conn.status === 'connected',
    status: conn.status,
    lastValidatedAt: conn.lastValidatedAt?.toISOString() || null,
    connectedUserName: conn.connectedUserName,
    connectedUserEmail: conn.connectedUserEmail,
  };
}

export async function connectFigma(accessToken: string) {
  const figma = new FigmaClient(accessToken);
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
        encryptedAccessToken: encrypted,
        status: 'connected',
        connectedUserName: user.handle,
        connectedUserEmail: user.email,
        lastValidatedAt: new Date(),
      },
    });
  } else {
    connection = await prisma.figmaConnection.create({
      data: {
        encryptedAccessToken: encrypted,
        status: 'connected',
        connectedUserName: user.handle,
        connectedUserEmail: user.email,
        lastValidatedAt: new Date(),
      },
    });
  }

  void logActivity({
    eventType: 'figma.connected',
    title: 'Figma token connected',
    description: `Connected as ${user.handle} (${user.email})`,
    entityType: 'figma_connection',
    entityId: connection.id,
    severity: 'success',
    metadata: { user: user.handle, email: user.email },
  });

  return {
    status: connection.status,
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
    title: 'Figma token disconnected',
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

  const token = decrypt(conn.encryptedAccessToken);
  return new FigmaClient(token);
}
