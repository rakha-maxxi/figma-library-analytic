export interface FigmaConnectionStatus {
  connected: boolean;
  status: string;
  lastValidatedAt: string | null;
  connectedUserName: string | null;
  connectedUserEmail: string | null;
}

export interface SourceFile {
  id: string;
  figmaFileKey: string;
  name: string;
  figmaUrl: string;
  status: string;
  lastComponentRefreshAt: string | null;
}

export interface SourceComponent {
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
  lastSeenAt: string | null;
}

export interface RegisteredFile {
  id: string;
  figmaFileKey: string;
  name: string;
  figmaUrl: string;
  status: string;
  trackingEnabled: boolean;
  lastScanJobId: string | null;
  lastScanStatus: string | null;
  lastScanAttemptAt: string | null;
  lastSuccessfulScanAt: string | null;
  totalInstances: number;
  uniqueComponentsUsed: number;
}

export interface ScanBatch {
  id: string;
  status: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface ScanJob {
  id: string;
  batchId: string | null;
  registeredFileId: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  totalInstances: number;
  uniqueComponentsUsed: number;
  registeredFile?: RegisteredFile;
}

export interface UsageInstance {
  id: string;
  instanceNodeId: string;
  instanceName: string | null;
  pageName: string | null;
  frameName: string | null;
  figmaNodeUrl: string | null;
  fileName: string;
  registeredFileId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: string;
}

export interface UsageChange {
  id: string;
  scanJobId: string;
  componentId: string;
  componentName: string;
  componentSetName?: string | null;
  registeredFileId: string;
  fileName: string;
  previousCount: number;
  currentCount: number;
  difference: number;
  changeType: string;
  detectedAt: string;
}

export interface ComponentDetail {
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
}

export interface FileDetail {
  file: RegisteredFile;
  components: Array<{
    component: {
      id: string;
      componentName: string;
      componentSetName: string | null;
      componentKey: string | null;
      status: string;
    };
    count: number;
    lastSeen: string;
  }>;
}

export interface InsightsSummary {
  totalComponents: number;
  registeredFiles: number;
  totalInstances: number;
  unusedComponents: number;
  lowUsageComponents: number;
  failedScans: number;
  lastSuccessfulScanAt: string | null;
}

export interface AddFilesResult {
  added: Array<{ id: string; name: string; figmaFileKey: string; figmaUrl: string; status: string }>;
  duplicates: string[];
  failed: Array<{ url: string; error: string }>;
}

export interface ActivityLog {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  severity: 'info' | 'success' | 'warning' | 'error';
  metadata: Record<string, string> | null;
  createdAt: string;
}

