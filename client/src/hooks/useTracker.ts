import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  FigmaConnection,
  SourceFile,
  SourceComponent,
  RegisteredFile,
  ScanBatch,
  ScanJob,
  UsageInstance,
  UsageChange,
} from '../lib/mockDb';
import type { ActivityLog } from '../lib/types';

export const useConnection = () => {
  return useQuery<FigmaConnection>({
    queryKey: ['connection'],
    queryFn: async () => {
      const data = await api.get<{
        connected: boolean;
        status: string;
        lastValidatedAt: string | null;
        connectedUserName: string | null;
        connectedUserEmail: string | null;
      }>('/api/figma/status');
      return {
        id: 'conn-1',
        name: 'Default Figma Connection',
        connected: data.connected,
        pat: data.connected ? '••••••••••••••••' : '',
        userName: data.connectedUserName || '',
        userEmail: data.connectedUserEmail || '',
        lastValidatedAt: data.lastValidatedAt,
      };
    },
  });
};

export const useSourceFile = () => {
  return useQuery<SourceFile | null>({
    queryKey: ['sourceFile'],
    queryFn: async () => {
      const data = await api.get<SourceFile | null>('/api/source-file');
      if (!data) return null;
      return {
        ...data,
        status: (data.status as 'active' | 'inactive') || 'active',
      };
    },
  });
};

export const useComponents = (filters?: { search?: string; status?: string; set?: string }) => {
  return useQuery<(SourceComponent & { totalInstances: number; filesUsed: number; usageStatus: string })[]>({
    queryKey: ['components', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.set && filters.set !== 'all') params.set('set', filters.set);
      const qs = params.toString();
      const data = await api.get<Array<SourceComponent & { totalInstances: number; filesUsed: number; usageStatus: string }>>(
        `/api/components${qs ? `?${qs}` : ''}`,
      );
      return data.map(c => ({
        id: c.id,
        sourceFileId: c.sourceFileId,
        componentKey: c.componentKey || '',
        componentNodeId: c.componentNodeId,
        componentName: c.componentName,
        componentSetName: c.componentSetName,
        pageName: c.pageName || '',
        description: c.description,
        status: (c.status as 'active' | 'deprecated') || 'active',
        totalInstances: c.totalInstances || 0,
        filesUsed: c.filesUsed || 0,
        usageStatus: c.usageStatus,
      }));
    },
  });
};

export const useComponentDetail = (componentId: string | null) => {
  return useQuery<{
    component: SourceComponent & { usageStatus?: string };
    files: Array<{ file: RegisteredFile; count: number; lastSeen: string }>;
    instances: UsageInstance[];
    trend: Array<{ date: string; count: number }>;
  } | null>({
    queryKey: ['componentDetail', componentId],
    enabled: !!componentId,
    queryFn: async () => {
      if (!componentId) return null;
      const data = await api.get<{
        component: {
          id: string;
          sourceFileId: string;
          componentKey: string | null;
          componentNodeId: string;
          componentName: string;
          componentSetName: string | null;
          pageName: string | null;
          description: string | null;
          status: string;
          totalInstances: number;
          filesUsed: number;
          usageStatus: string;
        };
        files: Array<{
          file: { id: string; name: string; figmaFileKey: string; figmaUrl: string; status: string };
          count: number;
          lastSeen: string;
        }>;
        instances: Array<{
          id: string;
          componentId: string;
          componentName: string;
          registeredFileId: string;
          fileName: string;
          pageName: string | null;
          frameName: string | null;
          figmaNodeId: string;
          figmaNodeUrl: string | null;
        }>;
        trend: Array<{ date: string; count: number }>;
      }>(`/api/components/${componentId}`);

      if (!data) return null;

      return {
        component: {
          id: data.component.id,
          sourceFileId: data.component.sourceFileId,
          componentKey: data.component.componentKey || '',
          componentNodeId: data.component.componentNodeId,
          componentName: data.component.componentName,
          componentSetName: data.component.componentSetName,
          pageName: data.component.pageName || '',
          description: data.component.description,
          status: (data.component.status as 'active' | 'deprecated') || 'active',
          usageStatus: data.component.usageStatus,
        },
        files: data.files.map(f => ({
          file: {
            id: f.file.id,
            figmaFileKey: f.file.figmaFileKey,
            name: f.file.name,
            figmaUrl: f.file.figmaUrl,
            status: f.file.status as RegisteredFile['status'],
            trackingEnabled: true,
            lastScanJobId: null,
            lastScanStatus: null,
            lastScanAttemptAt: null,
            lastSuccessfulScanAt: null,
            totalInstances: 0,
            uniqueComponentsUsed: 0,
          },
          count: f.count,
          lastSeen: f.lastSeen,
        })),
        instances: data.instances.map(i => ({
          id: i.id,
          componentId: i.componentId,
          componentName: i.componentName,
          registeredFileId: i.registeredFileId,
          fileName: i.fileName,
          pageName: i.pageName || '',
          frameName: i.frameName || '',
          figmaNodeId: i.figmaNodeId,
        })),
        trend: data.trend.length > 0 ? data.trend : [{ date: 'Initial', count: 0 }],
      };
    },
  });
};

export const useRegisteredFiles = () => {
  return useQuery<RegisteredFile[]>({
    queryKey: ['registeredFiles'],
    queryFn: async () => {
      const data = await api.get<RegisteredFile[]>('/api/registered-files');
      return data.map(f => ({
        ...f,
        status: (f.status as RegisteredFile['status']) || 'not_scanned',
        lastScanStatus: (f.lastScanStatus as RegisteredFile['lastScanStatus']) || null,
      }));
    },
  });
};

export const useFileDetail = (fileId: string | null) => {
  return useQuery<{
    file: RegisteredFile;
    components: Array<{ component: SourceComponent; count: number; lastSeen: string }>;
  } | null>({
    queryKey: ['fileDetail', fileId],
    enabled: !!fileId,
    queryFn: async () => {
      if (!fileId) return null;
      const data = await api.get<{
        file: RegisteredFile;
        components: Array<{
          component: { id: string; componentName: string; componentSetName: string | null; componentKey: string | null; status: string };
          count: number;
          lastSeen: string;
        }>;
      }>(`/api/files/${fileId}`);

      if (!data) return null;

      return {
        file: {
          ...data.file,
          status: (data.file.status as RegisteredFile['status']) || 'not_scanned',
          lastScanStatus: (data.file.lastScanStatus as RegisteredFile['lastScanStatus']) || null,
        },
        components: data.components.map(c => ({
          component: {
            id: c.component.id,
            sourceFileId: '',
            componentKey: c.component.componentKey || '',
            componentNodeId: '',
            componentName: c.component.componentName,
            componentSetName: c.component.componentSetName,
            pageName: '',
            description: null,
            status: (c.component.status as 'active' | 'deprecated') || 'active',
          },
          count: c.count,
          lastSeen: c.lastSeen,
        })),
      };
    },
  });
};

export const useScanBatches = () => {
  return useQuery<ScanBatch[]>({
    queryKey: ['scanBatches'],
    queryFn: async () => {
      const data = await api.get<ScanBatch[]>('/api/scans/batches');
      return data.map(b => ({
        ...b,
        status: (b.status as ScanBatch['status']) || 'pending',
      }));
    },
    refetchInterval: (query) => {
      const activeRunning = query.state.data?.some(b => b.status === 'running');
      return activeRunning ? 2000 : false;
    },
  });
};

export const useScanJobs = (batchId?: string) => {
  return useQuery<ScanJob[]>({
    queryKey: ['scanJobs', batchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (batchId) params.set('batchId', batchId);
      const qs = params.toString();
      const data = await api.get<Array<ScanJob & { registeredFile?: RegisteredFile }>>(
        `/api/scans${qs ? `?${qs}` : ''}`,
      );
      return data.map(j => ({
        id: j.id,
        batchId: j.batchId,
        registeredFileId: j.registeredFileId,
        status: (j.status as ScanJob['status']) || 'pending',
        startedAt: j.startedAt,
        finishedAt: j.finishedAt,
        durationMs: j.durationMs,
        errorCode: j.errorCode,
        errorMessage: j.errorMessage,
        totalInstances: j.totalInstances,
        uniqueComponentsUsed: j.uniqueComponentsUsed,
        progress: j.status === 'success' ? 100 : j.status === 'running' ? 50 : j.status === 'pending' ? 0 : j.status === 'failed' ? (j.durationMs ? 80 : 30) : 0,
      }));
    },
    refetchInterval: (query) => {
      const activeRunning = query.state.data?.some(j => j.status === 'running' || j.status === 'pending');
      return activeRunning ? 2000 : false;
    },
  });
};

export const useRecentChanges = () => {
  return useQuery<UsageChange[]>({
    queryKey: ['recentChanges'],
    queryFn: async () => {
      const data = await api.get<Array<{
        id: string;
        scanJobId: string;
        componentId: string;
        componentName: string;
        componentSetName: string | null;
        registeredFileId: string;
        fileName: string;
        previousCount: number;
        currentCount: number;
        difference: number;
        changeType: string;
        detectedAt: string;
      }>>('/api/insights/recent-changes');
      return data.map(c => ({
        id: c.id,
        batchId: c.scanJobId,
        componentId: c.componentId,
        componentName: c.componentName,
        componentSetName: c.componentSetName,
        registeredFileId: c.registeredFileId,
        fileName: c.fileName,
        previousCount: c.previousCount,
        currentCount: c.currentCount,
        changeType: (c.changeType as UsageChange['changeType']) || 'no_change',
        detectedAt: c.detectedAt,
      }));
    },
  });
};

export const useAdoptionTrend = () => {
  return useQuery<Array<{ date: string; instances: number; files: number }>>({
    queryKey: ['adoptionTrend'],
    queryFn: async () => {
      return api.get<Array<{ date: string; instances: number; files: number }>>('/api/insights/adoption-trend');
    },
  });
};

export const useInsights = () => {
  return useQuery<{
    unusedComponents: SourceComponent[];
    lowUsageComponents: Array<{ component: SourceComponent; count: number }>;
    mostUsedComponents: Array<{ component: SourceComponent; count: number }>;
    staleFiles: RegisteredFile[];
    failedScansCount: number;
  }>({
    queryKey: ['insights'],
    queryFn: async () => {
      const [unused, lowUsage, mostUsed, staleFiles, failedScans] = await Promise.all([
        api.get<Array<{ id: string; componentName: string; componentSetName: string | null; componentKey: string | null; componentNodeId: string; pageName: string | null; status: string }>>('/api/insights/unused-components'),
        api.get<Array<{ id: string; componentName: string; componentSetName: string | null; componentKey: string | null; componentNodeId: string; count: number }>>('/api/insights/low-usage-components'),
        api.get<Array<{ id: string; componentName: string; componentSetName: string | null; count: number }>>('/api/insights/most-used-components'),
        api.get<RegisteredFile[]>('/api/insights/stale-files'),
        api.get<Array<{ id: string }>>('/api/insights/failed-scans'),
      ]);

      const toSourceComponent = (c: { id: string; componentName: string; componentSetName: string | null; componentKey?: string | null; componentNodeId?: string; pageName?: string | null; status: string }): SourceComponent => ({
        id: c.id,
        sourceFileId: '',
        componentKey: c.componentKey || '',
        componentNodeId: c.componentNodeId || '',
        componentName: c.componentName,
        componentSetName: c.componentSetName,
        pageName: c.pageName || '',
        description: null,
        status: (c.status as 'active' | 'deprecated') || 'active',
      });

      return {
        unusedComponents: unused.map(toSourceComponent),
        lowUsageComponents: lowUsage.map(c => ({
          component: toSourceComponent({ id: c.id, componentName: c.componentName, componentSetName: c.componentSetName, componentKey: c.componentKey, componentNodeId: c.componentNodeId, pageName: null, status: 'active' }),
          count: c.count,
        })),
        mostUsedComponents: mostUsed.map(c => ({
          component: toSourceComponent({ id: c.id, componentName: c.componentName, componentSetName: c.componentSetName, componentKey: null, componentNodeId: '', pageName: null, status: 'active' }),
          count: c.count,
        })),
        staleFiles: staleFiles.map(f => ({
          ...f,
          status: (f.status as RegisteredFile['status']) || 'stale',
          lastScanStatus: (f.lastScanStatus as RegisteredFile['lastScanStatus']) || null,
        })),
        failedScansCount: failedScans.length,
      };
    },
  });
};

export const useFileInstances = (fileId: string | null) => {
  return useQuery<Array<{
    id: string;
    componentId: string;
    componentName: string;
    componentSetName: string | null;
    instanceNodeId: string;
    instanceName: string | null;
    pageName: string | null;
    frameName: string | null;
    figmaNodeUrl: string | null;
    usageDepth: string;
    parentSourceComponentId: string | null;
    parentInstanceNodeId: string | null;
    firstSeenAt: string;
    lastSeenAt: string;
    status: string;
  }>>({
    queryKey: ['fileInstances', fileId],
    enabled: !!fileId,
    queryFn: async () => {
      return api.get(`/api/files/${fileId}/instances?limit=100`);
    },
  });
};

export const useConnectFigma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pat }: { pat: string; name: string }) => {
      return api.post('/api/figma/connect', { accessToken: pat });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection'] });
    },
  });
};

export const useDisconnectFigma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return api.delete('/api/figma/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection'] });
    },
  });
};

export const useRegisterSourceFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url }: { url: string; name: string }) => {
      return api.post('/api/source-file', { figmaUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sourceFile'] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
};

export const useRemoveSourceFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return api.delete('/api/source-file');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sourceFile'] });
    },
  });
};

export const useAddRegisteredFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url }: { url: string; name: string }) => {
      const result = await api.post<{
        added: Array<{ id: string; name: string; figmaFileKey: string; figmaUrl: string; status: string }>;
        duplicates: string[];
        failed: Array<{ url: string; error: string }>;
      }>('/api/registered-files', { figmaUrls: [url] });
      if (result.failed.length > 0) {
        throw new Error(result.failed[0].error);
      }
      if (result.duplicates.length > 0) {
        throw new Error('File already registered');
      }
      return result.added[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registeredFiles'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

export const useRemoveRegisteredFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/registered-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registeredFiles'] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['componentDetail'] });
    },
  });
};

export const useToggleFileTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const files = await api.get<RegisteredFile[]>('/api/registered-files');
      const file = files.find(f => f.id === id);
      if (!file) throw new Error('File not found');
      return api.patch(`/api/registered-files/${id}`, { trackingEnabled: !file.trackingEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registeredFiles'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

export const useStartScan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await api.post<{ batchId: string; status: string; totalFiles: number }>('/api/scans', { mode: 'all' });
      return result.batchId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanBatches'] });
      queryClient.invalidateQueries({ queryKey: ['scanJobs'] });
      queryClient.invalidateQueries({ queryKey: ['registeredFiles'] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['recentChanges'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['componentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['adoptionTrend'] });
    },
  });
};

export const useScanSingleFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const result = await api.post<{ scanJobId: string; batchId: string; status: string }>(`/api/scans/file/${fileId}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanBatches'] });
      queryClient.invalidateQueries({ queryKey: ['scanJobs'] });
      queryClient.invalidateQueries({ queryKey: ['registeredFiles'] });
      queryClient.invalidateQueries({ queryKey: ['fileDetail'] });
      queryClient.invalidateQueries({ queryKey: ['fileInstances'] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['recentChanges'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['adoptionTrend'] });
    },
  });
};

export const useAppSettings = () => {
  return useQuery<{
    id: string;
    lowUsageInstanceThreshold: number;
    staleFileDaysThreshold: number;
    scanDelayMs: number;
  }>({
    queryKey: ['appSettings'],
    queryFn: async () => {
      return api.get<{
        id: string;
        lowUsageInstanceThreshold: number;
        staleFileDaysThreshold: number;
        scanDelayMs: number;
      }>('/api/insights/settings');
    },
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      lowUsageInstanceThreshold?: number;
      staleFileDaysThreshold?: number;
      scanDelayMs?: number;
    }) => {
      return api.patch('/api/insights/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
};

export const useActivityLogs = (filters?: {
  eventType?: string;
  severity?: string;
  entityType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<{
    logs: ActivityLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['activityLogs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventType && filters.eventType !== 'all') params.set('eventType', filters.eventType);
      if (filters?.severity && filters.severity !== 'all') params.set('severity', filters.severity);
      if (filters?.entityType) params.set('entityType', filters.entityType);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.limit) params.set('limit', filters.limit.toString());
      const qs = params.toString();
      return api.get<{
        logs: ActivityLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/activity-logs${qs ? `?${qs}` : ''}`);
    },
  });
};

