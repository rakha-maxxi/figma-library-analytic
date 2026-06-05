import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import * as dashboardService from '../services/dashboard.js';

const router = Router();

const WIDGET_REGISTRY = [
  { widgetId: 'summary_metrics', title: 'Summary Metrics', description: 'Key metrics: total instances, components, files, last scan', category: 'Usage', defaultSize: 'full', supportedSizes: ['full'] },
  { widgetId: 'direct_instances_trend', title: 'Direct Instances Trend', description: 'Line chart of total instances over scan history', category: 'Usage', defaultSize: 'large', supportedSizes: ['medium', 'large', 'full'] },
  { widgetId: 'recent_usage_changes', title: 'Recent Usage Changes', description: 'Latest component usage changes across files', category: 'Activity', defaultSize: 'medium', supportedSizes: ['medium', 'large'] },
  { widgetId: 'top_used_components', title: 'Top Used Components', description: 'Most adopted components ranked by usage', category: 'Components', defaultSize: 'medium', supportedSizes: ['small', 'medium', 'large'] },
  { widgetId: 'files_needing_attention', title: 'Files Needing Attention', description: 'Files that are failed, stale, or have zero usage', category: 'Files', defaultSize: 'large', supportedSizes: ['medium', 'large', 'full'] },
  { widgetId: 'governance_health', title: 'Governance Health', description: 'Overview of unused, low-usage, and deprecated components', category: 'Governance', defaultSize: 'full', supportedSizes: ['large', 'full'] },
  { widgetId: 'failed_scans', title: 'Failed Scans', description: 'List of recently failed scan jobs with reasons', category: 'Scans', defaultSize: 'medium', supportedSizes: ['small', 'medium', 'large'] },
  { widgetId: 'stale_files', title: 'Stale Files', description: 'Files not scanned within freshness threshold', category: 'Files', defaultSize: 'medium', supportedSizes: ['small', 'medium', 'large'] },
  { widgetId: 'unused_in_tracked_files', title: 'Unused in Tracked Files', description: 'Source components with zero usage across registered files', category: 'Governance', defaultSize: 'medium', supportedSizes: ['medium', 'large', 'full'] },
  { widgetId: 'low_usage_components', title: 'Low Usage Components', description: 'Components below the usage threshold', category: 'Governance', defaultSize: 'medium', supportedSizes: ['medium', 'large'] },
  { widgetId: 'source_components_count', title: 'Source Components Count', description: 'Number of components in the source UI Kit', category: 'Components', defaultSize: 'small', supportedSizes: ['small'] },
  { widgetId: 'used_components_count', title: 'Used Components Count', description: 'Components with at least one direct instance', category: 'Components', defaultSize: 'small', supportedSizes: ['small'] },
  { widgetId: 'tracked_files_count', title: 'Tracked Files Count', description: 'Number of registered consumer files', category: 'Files', defaultSize: 'small', supportedSizes: ['small'] },
  { widgetId: 'latest_scan_freshness', title: 'Latest Scan Freshness', description: 'Timestamp of the most recent successful scan', category: 'Scans', defaultSize: 'small', supportedSizes: ['small'] },
  { widgetId: 'scan_success_rate', title: 'Scan Success Rate', description: 'Percentage of successful scans', category: 'Scans', defaultSize: 'small', supportedSizes: ['small'] },
  { widgetId: 'recent_activity', title: 'Recent Activity', description: 'Latest system events and actions', category: 'Activity', defaultSize: 'medium', supportedSizes: ['medium', 'large'] },
];

router.get('/widgets', (_req, res) => {
  return successResponse(res, WIDGET_REGISTRY);
});

router.get('/layout', async (_req, res, next) => {
  try {
    const result = await dashboardService.getLayout();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.put('/layout', async (req, res, next) => {
  try {
    const { layout } = req.body;
    const result = await dashboardService.saveLayout(layout);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/layout/reset', async (_req, res, next) => {
  try {
    const result = await dashboardService.resetLayout();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
