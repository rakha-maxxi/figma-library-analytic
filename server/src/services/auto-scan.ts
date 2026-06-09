import { prisma } from '../config/prisma.js';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

async function runAutoScans() {
  try {
    const now = new Date();
    const dueFiles = await prisma.registeredFile.findMany({
      where: {
        trackingEnabled: true,
        scanIntervalMinutes: { not: null },
        OR: [
          { lastSuccessfulScanAt: null },
          {
            lastSuccessfulScanAt: {
              lt: new Date(now.getTime() - 60000),
            },
          },
        ],
      },
    });

    for (const file of dueFiles) {
      const intervalMs = (file.scanIntervalMinutes || 60) * 60 * 1000;
      const lastScan = file.lastSuccessfulScanAt?.getTime() || 0;
      if (now.getTime() - lastScan < intervalMs) continue;

      const activeJob = await prisma.scanJob.findFirst({
        where: {
          registeredFileId: file.id,
          status: { in: ['running', 'pending'] },
        },
      });
      if (activeJob) continue;

      try {
        const { startScanFile } = await import('./scan.js');
        await startScanFile(file.id);
        console.log(`[auto-scan] Queued scan for "${file.name}"`);
      } catch (err) {
        console.error(`[auto-scan] Failed to queue "${file.name}":`, (err as Error).message);
      }
    }
  } catch {
    // suppress — don't crash server on scheduler error
  }
}

export function startAutoScanScheduler() {
  if (schedulerInterval) return;
  schedulerInterval = setInterval(runAutoScans, 60000);
  console.log('[auto-scan] Scheduler started (60s interval)');
}

export function stopAutoScanScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
