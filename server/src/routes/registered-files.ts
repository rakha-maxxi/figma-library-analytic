import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import * as registeredFileService from '../services/registered-file.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { figmaUrls } = req.body;
    if (!figmaUrls || !Array.isArray(figmaUrls) || figmaUrls.length === 0) {
      throw new AppError(ErrorCodes.INVALID_FIGMA_URL, 'figmaUrls array is required', 400);
    }
    const result = await registeredFileService.addRegisteredFiles(figmaUrls);
    return successResponse(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      trackingEnabled: req.query.trackingEnabled !== undefined
        ? req.query.trackingEnabled === 'true'
        : undefined,
    };
    const result = await registeredFileService.getRegisteredFiles(filters);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await registeredFileService.updateRegisteredFile(id, req.body);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await registeredFileService.removeRegisteredFile(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
