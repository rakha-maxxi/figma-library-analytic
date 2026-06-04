import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  directUrl: process.env.DIRECT_URL || '',
  figmaApiBaseUrl: process.env.FIGMA_API_BASE_URL || 'https://api.figma.com',
  encryptionSecret: process.env.ENCRYPTION_SECRET || 'default-secret-change-me-32chars!!',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
};
