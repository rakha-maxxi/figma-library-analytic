import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import * as insightsService from '../services/insights.js';

const router = Router();

router.get('/summary', async (_req, res, next) => {
  try {
    const result = await insightsService.getInsightsSummary();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/unused-components', async (_req, res, next) => {
  try {
    const result = await insightsService.getUnusedComponents();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/low-usage-components', async (_req, res, next) => {
  try {
    const result = await insightsService.getLowUsageComponents();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/most-used-components', async (_req, res, next) => {
  try {
    const result = await insightsService.getMostUsedComponents();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/stale-files', async (_req, res, next) => {
  try {
    const result = await insightsService.getStaleFiles();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/failed-scans', async (_req, res, next) => {
  try {
    const result = await insightsService.getFailedScans();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/recent-changes', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await insightsService.getRecentChanges(limit);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/adoption-trend', async (_req, res, next) => {
  try {
    const result = await insightsService.getAdoptionTrend();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/settings', async (_req, res, next) => {
  try {
    const result = await insightsService.getSettings();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.patch('/settings', async (req, res, next) => {
  try {
    const result = await insightsService.updateSettings(req.body);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
