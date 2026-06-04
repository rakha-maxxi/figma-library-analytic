import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import * as componentService from '../services/component.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      set: req.query.set as string | undefined,
      sort: req.query.sort as string | undefined,
    };
    const result = await componentService.getComponents(filters);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await componentService.getComponentDetail(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/files', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await componentService.getComponentFiles(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/instances', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await componentService.getComponentInstances(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/trend', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await componentService.getComponentTrend(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
