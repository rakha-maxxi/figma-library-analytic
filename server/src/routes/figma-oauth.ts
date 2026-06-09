import { Router } from 'express';
import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { FigmaClient } from '../figma/figma-client.js';
import { successResponse, errorResponse } from '../utils/api-response.js';

const router = Router();

function generateState(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
}

const OAUTH_SCOPES = 'current_user:read file_content:read file_metadata:read';

router.get('/start', async (_req, res) => {
  const clientId = process.env.FIGMA_OAUTH_CLIENT_ID || config.figmaOauthClientId;
  const redirectUri = process.env.FIGMA_OAUTH_REDIRECT_URI || config.figmaOauthRedirectUri;
  const state = generateState();

  // Store state
  const existing = await prisma.figmaConnection.findFirst({ orderBy: { createdAt: 'desc' } });
  if (existing) {
    await prisma.figmaConnection.update({
      where: { id: existing.id },
      data: { encryptedRefreshToken: encrypt(`oauth_state:${state}`) },
    });
  } else {
    await prisma.figmaConnection.create({
      data: {
        authType: 'oauth',
        encryptedAccessToken: encrypt('pending'),
        encryptedRefreshToken: encrypt(`oauth_state:${state}`),
        status: 'disconnected',
      },
    });
  }

  const authUrl = `https://www.figma.com/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(OAUTH_SCOPES)}&state=${state}&response_type=code`;
  return res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return errorResponse(res, 'OAUTH_ERROR', 'Missing code or state parameter', 400);
    }

    const conn = await prisma.figmaConnection.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!conn || !conn.encryptedRefreshToken) {
      return errorResponse(res, 'OAUTH_ERROR', 'No pending OAuth session found', 400);
    }

    const storedState = decrypt(conn.encryptedRefreshToken);
    const expectedState = storedState.startsWith('oauth_state:') ? storedState.replace('oauth_state:', '') : storedState;
    if (state !== expectedState) {
      return errorResponse(res, 'OAUTH_ERROR', 'Invalid state parameter', 400);
    }

    const tokenBody = new URLSearchParams({
        client_id: process.env.FIGMA_OAUTH_CLIENT_ID || config.figmaOauthClientId,
        client_secret: process.env.FIGMA_OAUTH_CLIENT_SECRET || config.figmaOauthClientSecret,
        redirect_uri: process.env.FIGMA_OAUTH_REDIRECT_URI || config.figmaOauthRedirectUri,
        code: code as string,
        grant_type: 'authorization_code',
      });
    console.log('[OAuth] Token request URL: https://api.figma.com/v1/oauth/token');
    console.log('[OAuth] Token request params:', Object.fromEntries([...tokenBody.entries()].map(([k, v]) => [k, k.includes('secret') ? '***' : v])));

    const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });

    console.log('[OAuth] Token response status:', tokenRes.status, tokenRes.statusText);

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text().catch(() => '');
      console.log('[OAuth] Token error body:', errBody);
      return errorResponse(res, 'OAUTH_ERROR', `Token exchange failed: ${errBody.slice(0, 200)}`, 500);
    }

    const tokenData = await tokenRes.json() as Record<string, unknown>;
    const figma = new FigmaClient(tokenData.access_token as string, 'oauth');
    const user = await figma.validateToken();
    const expiresAt = new Date(Date.now() + ((tokenData.expires_in as number) || 3600) * 1000);

    await prisma.figmaConnection.update({
      where: { id: conn.id },
      data: {
        authType: 'oauth',
        encryptedAccessToken: encrypt(tokenData.access_token as string),
        encryptedRefreshToken: encrypt(tokenData.refresh_token as string),
        status: 'connected',
        scope: OAUTH_SCOPES,
        expiresAt,
        figmaUserId: String(tokenData.user_id || user.id),
        connectedUserName: user.handle,
        connectedUserEmail: user.email,
        lastValidatedAt: new Date(),
        name: `Figma OAuth — ${user.handle}`,
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL || config.frontendUrl}?tab=settings&oauth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${process.env.FRONTEND_URL || config.frontendUrl}?tab=settings&oauth=error`);
  }
});

router.post('/refresh', async (_req, res, next) => {
  try {
    const conn = await prisma.figmaConnection.findFirst({
      orderBy: { createdAt: 'desc' },
      where: { authType: 'oauth', status: 'connected' },
    });
    if (!conn || !conn.encryptedRefreshToken) {
      return errorResponse(res, 'OAUTH_ERROR', 'No OAuth connection to refresh', 400);
    }

    const refreshToken = decrypt(conn.encryptedRefreshToken);
    const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FIGMA_OAUTH_CLIENT_ID || config.figmaOauthClientId,
        client_secret: process.env.FIGMA_OAUTH_CLIENT_SECRET || config.figmaOauthClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!tokenRes.ok) return errorResponse(res, 'OAUTH_ERROR', 'Token refresh failed', 500);
    const data = await tokenRes.json() as Record<string, unknown>;
    const expiresAt = new Date(Date.now() + ((data.expires_in as number) || 3600) * 1000);

    await prisma.figmaConnection.update({
      where: { id: conn.id },
      data: {
        encryptedAccessToken: encrypt(data.access_token as string),
        encryptedRefreshToken: data.refresh_token ? encrypt(data.refresh_token as string) : undefined,
        expiresAt,
        lastValidatedAt: new Date(),
      },
    });

    return successResponse(res, { refreshed: true });
  } catch (err) {
    next(err);
  }
});

export default router;
