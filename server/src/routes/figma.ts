import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import * as figmaConnectionService from '../services/figma-connection.js';

const router = Router();

router.post('/connect', async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken || typeof accessToken !== 'string') {
      throw new AppError(ErrorCodes.FIGMA_TOKEN_INVALID, 'Access token is required', 400);
    }
    const result = await figmaConnectionService.connectFigma(accessToken);
    return successResponse(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/status', async (_req, res, next) => {
  try {
    const result = await figmaConnectionService.getConnectionStatus();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete('/disconnect', async (_req, res, next) => {
  try {
    const result = await figmaConnectionService.disconnectFigma();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
