import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import figmaRoutes from './routes/figma.js';
import sourceFileRoutes from './routes/source-file.js';
import registeredFilesRoutes from './routes/registered-files.js';
import scansRoutes from './routes/scans.js';
import componentsRoutes from './routes/components.js';
import filesRoutes from './routes/files.js';
import insightsRoutes from './routes/insights.js';
import activityLogsRoutes from './routes/activity-logs.js';
import dashboardRoutes from './routes/dashboard.js';
import figmaOauthRoutes from './routes/figma-oauth.js';
import { startAutoScanScheduler } from './services/auto-scan.js';

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: [
    config.appBaseUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'https://figma-library-analytic.vercel.app',
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'figma-library-analytic-api' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/figma', figmaRoutes);
app.use('/api/source-file', sourceFileRoutes);
app.use('/api/registered-files', registeredFilesRoutes);
app.use('/api/scans', scansRoutes);
app.use('/api/components', componentsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/figma/oauth', figmaOauthRoutes);

app.use(errorHandler);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  const cid = process.env.FIGMA_OAUTH_CLIENT_ID || '';
  console.log(`Figma OAuth Client ID: ${cid ? cid.slice(0, 6) + '...' : '(EMPTY!)'}`);
  startAutoScanScheduler();
});
