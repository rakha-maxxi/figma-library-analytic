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

router.get('/:id/instances', async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await registeredFileService.getFileInstances(id, limit);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/detached', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await registeredFileService.getDetachedCandidates(id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:fileId/detached/:candidateId', async (req, res, next) => {
  try {
    const { fileId, candidateId } = req.params;
    const { status } = req.body;
    const result = await registeredFileService.updateDetachedCandidate(candidateId, status);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
