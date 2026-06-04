import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import * as registeredFileService from '../services/registered-file.js';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await registeredFileService.getFileDetail(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/components', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await registeredFileService.getFileComponents(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
