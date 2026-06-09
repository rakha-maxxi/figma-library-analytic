export const config = {
  get port() { return parseInt(process.env.PORT || '4000', 10); },
  get nodeEnv() { return process.env.NODE_ENV || 'development'; },
  get databaseUrl() { return process.env.DATABASE_URL || ''; },
  get directUrl() { return process.env.DIRECT_URL || ''; },
  get figmaApiBaseUrl() { return process.env.FIGMA_API_BASE_URL || 'https://api.figma.com'; },
  get encryptionSecret() { return process.env.ENCRYPTION_SECRET || 'default-secret-change-me-32chars!!'; },
  get appBaseUrl() { return process.env.APP_BASE_URL || 'http://localhost:5173'; },
  get apiBaseUrl() { return process.env.API_BASE_URL || 'http://localhost:4000'; },
  get frontendUrl() { return process.env.FRONTEND_URL || 'http://localhost:5173'; },
  get figmaOauthClientId() { return process.env.FIGMA_OAUTH_CLIENT_ID || ''; },
  get figmaOauthClientSecret() { return process.env.FIGMA_OAUTH_CLIENT_SECRET || ''; },
  get figmaOauthRedirectUri() { return process.env.FIGMA_OAUTH_REDIRECT_URI || 'http://localhost:4000/api/figma/oauth/callback'; },
};
