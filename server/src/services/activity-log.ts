import { prisma } from '../config/prisma.js';

// ── Types ──────────────────────────────────────────────────────────────

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

export interface LogActivityParams {
  eventType: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  severity?: ActivitySeverity;
  metadata?: Record<string, string | number | boolean>;
}

export interface ActivityLogFilters {
  eventType?: string;
  severity?: string;
  entityType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Write (fire-and-forget) ────────────────────────────────────────────

/**
 * Log an activity event. Designed to be called with `void logActivity(...)`
 * so it never blocks the caller. Errors are silently caught and logged to console.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        eventType: params.eventType,
        title: params.title,
        description: params.description ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        severity: params.severity ?? 'info',
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to write log:', err);
  }
}

// ── Read (paginated + filtered) ────────────────────────────────────────

export async function getActivityLogs(filters: ActivityLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.eventType) {
    where.eventType = filters.eventType;
  }
  if (filters.severity) {
    where.severity = filters.severity;
  }
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs: logs.map(log => ({
      id: log.id,
      eventType: log.eventType,
      title: log.title,
      description: log.description,
      entityType: log.entityType,
      entityId: log.entityId,
      severity: log.severity,
      metadata: log.metadataJson ? JSON.parse(log.metadataJson) : null,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
