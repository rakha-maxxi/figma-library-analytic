import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import { getActivityLogs } from '../services/activity-log.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await getActivityLogs({
      eventType: req.query.eventType as string | undefined,
      severity: req.query.severity as string | undefined,
      entityType: req.query.entityType as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
