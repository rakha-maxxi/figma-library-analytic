import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import * as sourceFileService from '../services/source-file.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { figmaUrl } = req.body;
    if (!figmaUrl || typeof figmaUrl !== 'string') {
      throw new AppError(ErrorCodes.INVALID_FIGMA_URL, 'figmaUrl is required', 400);
    }
    const result = await sourceFileService.registerSourceFile(figmaUrl);
    return successResponse(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const result = await sourceFileService.getSourceFile();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh-components', async (_req, res, next) => {
  try {
    const result = await sourceFileService.refreshSourceComponents();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (_req, res, next) => {
  try {
    const result = await sourceFileService.removeSourceFile();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
