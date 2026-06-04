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

const app = express();

app.use(cors({
  origin: [config.appBaseUrl, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use(express.json());

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

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`API base: http://localhost:${config.port}/api`);
});
