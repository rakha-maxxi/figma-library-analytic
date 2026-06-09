import { Router } from 'express';
import { successResponse } from '../utils/api-response.js';
import * as scanService from '../services/scan.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { mode, registeredFileId } = req.body;

    if (mode === 'file' && registeredFileId) {
      const result = await scanService.startScanFile(registeredFileId);
      return successResponse(res, result, undefined, 201);
    }

    const result = await scanService.startScanAll();
    return successResponse(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/file/:registeredFileId', async (req, res, next) => {
  try {
    const { registeredFileId } = req.params;
    const result = await scanService.startScanFile(registeredFileId);
    return successResponse(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      batchId: req.query.batchId as string | undefined,
      status: req.query.status as string | undefined,
      fileId: req.query.fileId as string | undefined,
    };
    const result = await scanService.getScanJobs(filters);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/batches', async (_req, res, next) => {
  try {
    const result = await scanService.getScanBatches();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/batches/:batchId', async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const result = await scanService.getScanBatch(batchId);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:scanJobId/retry', async (req, res, next) => {
  try {
    const { scanJobId } = req.params;
    const result = await scanService.retryFailedScan(scanJobId);
    return successResponse(res, result, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/batches/:batchId/stop', async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const result = await scanService.stopScanBatch(batchId);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
