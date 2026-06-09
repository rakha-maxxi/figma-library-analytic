// High-Fidelity Local Mock Database and Simulator for Design Ops Tracker

export interface FigmaConnection {
  id: string;
  name: string;
  connected: boolean;
  pat: string;
  userName: string;
  userEmail: string;
  lastValidatedAt: string | null;
}

export interface SourceFile {
  id: string;
  figmaFileKey: string;
  name: string;
  figmaUrl: string;
  status: 'active' | 'inactive';
  lastComponentRefreshAt: string | null;
}

export interface SourceComponent {
  id: string;
  sourceFileId: string;
  componentKey: string;
  componentNodeId: string;
  componentName: string;
  componentSetName: string | null;
  pageName: string;
  description: string | null;
  status: 'active' | 'deprecated';
}

export interface RegisteredFile {
  id: string;
  figmaFileKey: string;
  name: string;
  figmaUrl: string;
  status: 'not_scanned' | 'healthy' | 'zero_usage' | 'low_adoption' | 'failed' | 'stale' | 'disabled';
  trackingEnabled: boolean;
  lastScanJobId: string | null;
  lastScanStatus: 'pending' | 'running' | 'success' | 'failed' | 'paused' | null;
  lastScanAttemptAt: string | null;
  lastSuccessfulScanAt: string | null;
  totalInstances: number;
  uniqueComponentsUsed: number;
  scanIntervalMinutes?: number | null;
}

export interface ScanBatch {
  id: string;
  status: 'pending' | 'running' | 'success' | 'partial_success' | 'failed' | 'paused';
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
  status: 'pending' | 'running' | 'success' | 'failed' | 'paused';
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  totalInstances: number;
  uniqueComponentsUsed: number;
  progress: number;
  scanPhase?: string | null;
  createdAt?: string;
}

export interface UsageInstance {
  id: string;
  componentId: string;
  componentName: string;
  registeredFileId: string;
  fileName: string;
  pageName: string;
  frameName: string;
  figmaNodeId: string;
}

export interface ComponentUsageCurrent {
  id: string;
  componentId: string;
  registeredFileId: string;
  instanceCount: number;
  lastSeenAt: string;
}

export interface UsageSnapshot {
  id: string;
  batchId: string;
  componentId: string;
  registeredFileId: string;
  instanceCount: number;
  recordedAt: string;
}

export interface UsageChange {
  id: string;
  batchId: string;
  componentId: string;
  componentName: string;
  componentSetName?: string | null;
  registeredFileId: string;
  fileName: string;
  previousCount: number;
  currentCount: number;
  changeType: 'newly_used' | 'increased' | 'decreased' | 'removed' | 'no_change';
  detectedAt: string;
}

export type DetectionType = 'confirmed_detached' | 'suspected_by_name' | 'suspected_by_structure' | 'suspected_by_visual_signature';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type CandidateStatus = 'open' | 'reviewed' | 'ignored' | 'resolved';

export interface DetachedComponentCandidate {
  id: string;
  registeredFileId: string;
  sourceComponentId: string | null;
  sourceComponentName: string | null;
  scanJobId: string;
  candidateNodeId: string;
  candidateNodeName: string;
  pageName: string | null;
  frameName: string | null;
  figmaNodeUrl: string | null;
  detectionType: DetectionType;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  matchedSignals: string[];
  reason: string;
  status: CandidateStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

// Initial Mock Seed Data
const SEED_CONNECTION: FigmaConnection = {
  id: 'conn-1',
  name: 'Default Figma Connection',
  connected: true,
  pat: 'fig_pat_••••••••••••••••••••',
  userName: 'Emil Kowalski',
  userEmail: 'emil@linear.app',
  lastValidatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
};

const SEED_SOURCE_FILE: SourceFile = {
  id: 'sf-1',
  figmaFileKey: 'uikit_ds_2026',
  name: 'Linear Core UI Design System',
  figmaUrl: 'https://figma.com/file/uikit_ds_2026/Linear-Core-UI-Design-System',
  status: 'active',
  lastComponentRefreshAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
};

const SEED_COMPONENTS: SourceComponent[] = [
  { id: 'c-1', sourceFileId: 'sf-1', componentKey: 'key-btn', componentNodeId: '12:100', componentName: 'Button', componentSetName: 'Interactive Controls', pageName: 'Components/Buttons', description: 'Core call to action button.', status: 'active' },
  { id: 'c-2', sourceFileId: 'sf-1', componentKey: 'key-inp', componentNodeId: '14:24', componentName: 'Input', componentSetName: 'Interactive Controls', pageName: 'Components/Inputs', description: 'Standard text input field.', status: 'active' },
  { id: 'c-3', sourceFileId: 'sf-1', componentKey: 'key-avt', componentNodeId: '22:15', componentName: 'Avatar', componentSetName: 'Data Display', pageName: 'Components/Avatar', description: 'User profile avatar with fallback.', status: 'active' },
  { id: 'c-4', sourceFileId: 'sf-1', componentKey: 'key-crd', componentNodeId: '35:450', componentName: 'Card', componentSetName: 'Containers', pageName: 'Components/Cards', description: 'Content card layout container.', status: 'active' },
  { id: 'c-5', sourceFileId: 'sf-1', componentKey: 'key-swi', componentNodeId: '10:5', componentName: 'Switch', componentSetName: 'Interactive Controls', pageName: 'Components/Toggle', description: 'Boolean switcher toggle.', status: 'active' },
  { id: 'c-6', sourceFileId: 'sf-1', componentKey: 'key-dlg', componentNodeId: '42:90', componentName: 'Dialog', componentSetName: 'Feedback/Overlays', pageName: 'Components/Overlay', description: 'Accessible modal popup container.', status: 'active' },
  { id: 'c-7', sourceFileId: 'sf-1', componentKey: 'key-tbl', componentNodeId: '80:12', componentName: 'Table', componentSetName: 'Data Display', pageName: 'Components/Tables', description: 'Data-dense grid view.', status: 'active' },
  { id: 'c-8', sourceFileId: 'sf-1', componentKey: 'key-ddn', componentNodeId: '18:310', componentName: 'DropdownMenu', componentSetName: 'Interactive Controls', pageName: 'Components/Dropdowns', description: 'Contextual option selection overlay.', status: 'active' },
  { id: 'c-9', sourceFileId: 'sf-1', componentKey: 'key-bdg', componentNodeId: '25:220', componentName: 'Badge', componentSetName: 'Data Display', pageName: 'Components/Badge', description: 'Status or numerical count indicator.', status: 'active' },
  { id: 'c-10', sourceFileId: 'sf-1', componentKey: 'key-prg', componentNodeId: '11:15', componentName: 'Progress', componentSetName: 'Feedback/Overlays', pageName: 'Components/Indicators', description: 'Linear progression track bar.', status: 'active' },
  { id: 'c-11', sourceFileId: 'sf-1', componentKey: 'key-skn', componentNodeId: '9:88', componentName: 'Skeleton', componentSetName: 'Feedback/Overlays', pageName: 'Components/Indicators', description: 'Loading state shimmer placeholder.', status: 'active' },
  { id: 'c-12', sourceFileId: 'sf-1', componentKey: 'key-old-btn', componentNodeId: '5:41', componentName: 'Legacy Button', componentSetName: 'Interactive Controls', pageName: 'Deprecated/Old', description: 'Deprecated button replaced by V2. Candidates for cleanup.', status: 'deprecated' }
];

const SEED_REGISTERED_FILES: RegisteredFile[] = [
  {
    id: 'rf-1',
    figmaFileKey: 'console_web_app',
    name: 'Console Web Dashboard',
    figmaUrl: 'https://figma.com/file/console_web_app/Console-Web-Dashboard',
    status: 'healthy',
    trackingEnabled: true,
    lastScanJobId: 'job-h1',
    lastScanStatus: 'success',
    lastScanAttemptAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    lastSuccessfulScanAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    totalInstances: 420,
    uniqueComponentsUsed: 9,
  },
  {
    id: 'rf-2',
    figmaFileKey: 'mobile_ios_app',
    name: 'iOS Mobile App (SwiftUI Design)',
    figmaUrl: 'https://figma.com/file/mobile_ios_app/iOS-Mobile-App-SwiftUI-Design',
    status: 'healthy',
    trackingEnabled: true,
    lastScanJobId: 'job-h2',
    lastScanStatus: 'success',
    lastScanAttemptAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastSuccessfulScanAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    totalInstances: 185,
    uniqueComponentsUsed: 7,
  },
  {
    id: 'rf-3',
    figmaFileKey: 'marketing_v2',
    name: 'Marketing Landing Pages v2',
    figmaUrl: 'https://figma.com/file/marketing_v2/Marketing-Landing-Pages-v2',
    status: 'low_adoption',
    trackingEnabled: true,
    lastScanJobId: 'job-h3',
    lastScanStatus: 'success',
    lastScanAttemptAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    lastSuccessfulScanAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    totalInstances: 14,
    uniqueComponentsUsed: 2,
  },
  {
    id: 'rf-4',
    figmaFileKey: 'billing_redesign',
    name: 'Billing & Checkout Flow Explores',
    figmaUrl: 'https://figma.com/file/billing_redesign/Billing-Checkout-Flow-Explores',
    status: 'failed',
    trackingEnabled: true,
    lastScanJobId: 'job-h4',
    lastScanStatus: 'failed',
    lastScanAttemptAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    lastSuccessfulScanAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalInstances: 84,
    uniqueComponentsUsed: 5,
  },
  {
    id: 'rf-5',
    figmaFileKey: 'stale_explore',
    name: 'Archive/Legacy Exploration Playground',
    figmaUrl: 'https://figma.com/file/stale_explore/Archive-Legacy-Exploration-Playground',
    status: 'stale',
    trackingEnabled: true,
    lastScanJobId: 'job-h5',
    lastScanStatus: 'success',
    lastScanAttemptAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastSuccessfulScanAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    totalInstances: 310,
    uniqueComponentsUsed: 8,
  },
  {
    id: 'rf-6',
    figmaFileKey: 'unscanned_docs',
    name: 'Design Ops Guidelines & Examples',
    figmaUrl: 'https://figma.com/file/unscanned_docs/Design-Ops-Guidelines-Examples',
    status: 'not_scanned',
    trackingEnabled: true,
    lastScanJobId: null,
    lastScanStatus: null,
    lastScanAttemptAt: null,
    lastSuccessfulScanAt: null,
    totalInstances: 0,
    uniqueComponentsUsed: 0,
  }
];

// Initial Component Usage Counts per File
const SEED_USAGE_CURRENT: ComponentUsageCurrent[] = [
  // console_web_app (rf-1): 420 instances, 9 components
  { id: 'uc-1', componentId: 'c-1', registeredFileId: 'rf-1', instanceCount: 150, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }, // Button
  { id: 'uc-2', componentId: 'c-2', registeredFileId: 'rf-1', instanceCount: 95, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Input
  { id: 'uc-3', componentId: 'c-3', registeredFileId: 'rf-1', instanceCount: 45, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Avatar
  { id: 'uc-4', componentId: 'c-4', registeredFileId: 'rf-1', instanceCount: 40, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Card
  { id: 'uc-5', componentId: 'c-5', registeredFileId: 'rf-1', instanceCount: 22, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Switch
  { id: 'uc-6', componentId: 'c-6', registeredFileId: 'rf-1', instanceCount: 15, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Dialog
  { id: 'uc-7', componentId: 'c-7', registeredFileId: 'rf-1', instanceCount: 28, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Table
  { id: 'uc-8', componentId: 'c-8', registeredFileId: 'rf-1', instanceCount: 20, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },  // Dropdown
  { id: 'uc-9', componentId: 'c-9', registeredFileId: 'rf-1', instanceCount: 5, lastSeenAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },   // Badge
  
  // mobile_ios_app (rf-2): 185 instances, 7 components
  { id: 'uc-10', componentId: 'c-1', registeredFileId: 'rf-2', instanceCount: 75, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-11', componentId: 'c-2', registeredFileId: 'rf-2', instanceCount: 40, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-12', componentId: 'c-3', registeredFileId: 'rf-2', instanceCount: 20, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-13', componentId: 'c-5', registeredFileId: 'rf-2', instanceCount: 25, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-14', componentId: 'c-6', registeredFileId: 'rf-2', instanceCount: 8, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-15', componentId: 'c-9', registeredFileId: 'rf-2', instanceCount: 12, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-16', componentId: 'c-10', registeredFileId: 'rf-2', instanceCount: 5, lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }, // Progress
  
  // marketing_v2 (rf-3): 14 instances, 2 components
  { id: 'uc-17', componentId: 'c-1', registeredFileId: 'rf-3', instanceCount: 8, lastSeenAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-18', componentId: 'c-4', registeredFileId: 'rf-3', instanceCount: 6, lastSeenAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },

  // billing_redesign (rf-4): 84 instances, 5 components (from 5 days ago scan)
  { id: 'uc-19', componentId: 'c-1', registeredFileId: 'rf-4', instanceCount: 30, lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-20', componentId: 'c-2', registeredFileId: 'rf-4', instanceCount: 20, lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-21', componentId: 'c-4', registeredFileId: 'rf-4', instanceCount: 14, lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-22', componentId: 'c-6', registeredFileId: 'rf-4', instanceCount: 5, lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-23', componentId: 'c-8', registeredFileId: 'rf-4', instanceCount: 15, lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },

  // stale_explore (rf-5): 310 instances, 8 components
  { id: 'uc-24', componentId: 'c-1', registeredFileId: 'rf-5', instanceCount: 120, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-25', componentId: 'c-2', registeredFileId: 'rf-5', instanceCount: 80, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-26', componentId: 'c-4', registeredFileId: 'rf-5', instanceCount: 30, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-27', componentId: 'c-5', registeredFileId: 'rf-5', instanceCount: 15, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-28', componentId: 'c-8', registeredFileId: 'rf-5', instanceCount: 20, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-29', componentId: 'c-9', registeredFileId: 'rf-5', instanceCount: 25, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-30', componentId: 'c-11', registeredFileId: 'rf-5', instanceCount: 10, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'uc-31', componentId: 'c-12', registeredFileId: 'rf-5', instanceCount: 10, lastSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() } // Legacy Button (deprecated)
];

const SEED_INSTANCES: UsageInstance[] = [
  { id: 'i-1', componentId: 'c-1', componentName: 'Button', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', pageName: 'Analytics', frameName: 'Export Dialog', figmaNodeId: '102:44' },
  { id: 'i-2', componentId: 'c-1', componentName: 'Button', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', pageName: 'Settings', frameName: 'Billing Form', figmaNodeId: '124:90' },
  { id: 'i-3', componentId: 'c-2', componentName: 'Input', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', pageName: 'Login Screen', frameName: 'Email Input Field', figmaNodeId: '12:44' },
  { id: 'i-4', componentId: 'c-6', componentName: 'Dialog', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', pageName: 'Settings', frameName: 'Danger Zone Delete Modal', figmaNodeId: '129:210' },
  { id: 'i-5', componentId: 'c-12', componentName: 'Legacy Button', registeredFileId: 'rf-5', fileName: 'Archive/Legacy Exploration Playground', pageName: 'Playground V1', frameName: 'Submit Card', figmaNodeId: '5:410' },
];

const SEED_BATCHES: ScanBatch[] = [
  {
    id: 'batch-h1',
    status: 'success',
    totalFiles: 5,
    completedFiles: 5,
    failedFiles: 0,
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 42000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'batch-h2',
    status: 'partial_success',
    totalFiles: 5,
    completedFiles: 4,
    failedFiles: 1,
    startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 38000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  }
];

const SEED_JOBS: ScanJob[] = [
  { id: 'job-h1', batchId: 'batch-h1', registeredFileId: 'rf-1', status: 'success', startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), finishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 8000).toISOString(), durationMs: 8000, errorCode: null, errorMessage: null, totalInstances: 420, uniqueComponentsUsed: 9, progress: 100 },
  { id: 'job-h2', batchId: 'batch-h1', registeredFileId: 'rf-2', status: 'success', startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), finishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 6200).toISOString(), durationMs: 6200, errorCode: null, errorMessage: null, totalInstances: 185, uniqueComponentsUsed: 7, progress: 100 },
  { id: 'job-h3', batchId: 'batch-h2', registeredFileId: 'rf-3', status: 'success', startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), finishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 4000).toISOString(), durationMs: 4000, errorCode: null, errorMessage: null, totalInstances: 14, uniqueComponentsUsed: 2, progress: 100 },
  { id: 'job-h4', batchId: 'batch-h2', registeredFileId: 'rf-4', status: 'failed', startedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), finishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000 + 2000).toISOString(), durationMs: 2000, errorCode: 'FIGMA_RATE_LIMIT_EXCEEDED', errorMessage: 'The Figma API rate limit was exceeded. Try configurable scan delays.', totalInstances: 0, uniqueComponentsUsed: 0, progress: 35 },
  { id: 'job-h5', batchId: 'batch-h1', registeredFileId: 'rf-5', status: 'success', startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), finishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 10500).toISOString(), durationMs: 10500, errorCode: null, errorMessage: null, totalInstances: 310, uniqueComponentsUsed: 8, progress: 100 }
];

const SEED_CHANGES: UsageChange[] = [
  { id: 'ch-1', batchId: 'batch-h1', componentId: 'c-1', componentName: 'Button', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', previousCount: 140, currentCount: 150, changeType: 'increased', detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'ch-2', batchId: 'batch-h1', componentId: 'c-3', componentName: 'Avatar', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', previousCount: 50, currentCount: 45, changeType: 'decreased', detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'ch-3', batchId: 'batch-h1', componentId: 'c-9', componentName: 'Badge', registeredFileId: 'rf-1', fileName: 'Console Web Dashboard', previousCount: 0, currentCount: 5, changeType: 'newly_used', detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'ch-4', batchId: 'batch-h2', componentId: 'c-12', componentName: 'Legacy Button', registeredFileId: 'rf-5', fileName: 'Archive/Legacy Exploration Playground', previousCount: 20, currentCount: 10, changeType: 'decreased', detectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
];

// Snapshot history seed
const SEED_SNAPSHOTS: UsageSnapshot[] = [
  { id: 'sn-1', batchId: 'batch-h1', componentId: 'c-1', registeredFileId: 'rf-1', instanceCount: 140, recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'sn-2', batchId: 'batch-h1', componentId: 'c-1', registeredFileId: 'rf-1', instanceCount: 150, recordedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'sn-3', batchId: 'batch-h1', componentId: 'c-1', registeredFileId: 'rf-2', instanceCount: 70, recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'sn-4', batchId: 'batch-h1', componentId: 'c-1', registeredFileId: 'rf-2', instanceCount: 75, recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

export class MockDatabase {
  private static getStore<T>(key: string, initial: T): T {
    const val = localStorage.getItem(`ds_tracker_${key}`);
    if (val) return JSON.parse(val);
    localStorage.setItem(`ds_tracker_${key}`, JSON.stringify(initial));
    return initial;
  }

  private static setStore<T>(key: string, data: T): void {
    localStorage.setItem(`ds_tracker_${key}`, JSON.stringify(data));
  }

  // Getters
  static getConnection(): FigmaConnection {
    return this.getStore('connection', SEED_CONNECTION);
  }
  static getSourceFile(): SourceFile | null {
    const file = this.getStore<SourceFile | null>('source_file', SEED_SOURCE_FILE);
    return file;
  }
  static getComponents(): SourceComponent[] {
    return this.getStore('components', SEED_COMPONENTS);
  }
  static getRegisteredFiles(): RegisteredFile[] {
    return this.getStore('registered_files', SEED_REGISTERED_FILES);
  }
  static getBatches(): ScanBatch[] {
    return this.getStore('batches', SEED_BATCHES);
  }
  static getJobs(): ScanJob[] {
    return this.getStore('jobs', SEED_JOBS);
  }
  static getUsageCurrent(): ComponentUsageCurrent[] {
    return this.getStore('usage_current', SEED_USAGE_CURRENT);
  }
  static getInstances(): UsageInstance[] {
    return this.getStore('instances', SEED_INSTANCES);
  }
  static getChanges(): UsageChange[] {
    return this.getStore('changes', SEED_CHANGES);
  }
  static getSnapshots(): UsageSnapshot[] {
    return this.getStore('snapshots', SEED_SNAPSHOTS);
  }

  // Setters / Actions
  static saveConnection(pat: string, name: string): FigmaConnection {
    const connection: FigmaConnection = {
      id: 'conn-1',
      name,
      connected: true,
      pat: pat.replace(/./g, '•'), // mask it like the backend does
      userName: 'Figma Dev User',
      userEmail: 'dev@figma-ops.local',
      lastValidatedAt: new Date().toISOString()
    };
    this.setStore('connection', connection);
    return connection;
  }

  static disconnectConnection(): FigmaConnection {
    const connection: FigmaConnection = {
      id: 'conn-1',
      name: 'Default Figma Connection',
      connected: false,
      pat: '',
      userName: '',
      userEmail: '',
      lastValidatedAt: null
    };
    this.setStore('connection', connection);
    return connection;
  }

  static saveSourceFile(url: string, name: string): SourceFile {
    const key = url.split('/file/')[1]?.split('/')[0] || 'mock_key_' + Math.random().toString(36).substring(4);
    const file: SourceFile = {
      id: 'sf-' + Math.random().toString(36).substring(4),
      figmaFileKey: key,
      name,
      figmaUrl: url,
      status: 'active',
      lastComponentRefreshAt: new Date().toISOString()
    };
    this.setStore('source_file', file);
    return file;
  }

  static removeSourceFile(): void {
    this.setStore('source_file', null);
  }

  static addRegisteredFile(url: string, name: string): RegisteredFile {
    const key = url.split('/file/')[1]?.split('/')[0] || 'mock_key_' + Math.random().toString(36).substring(4);
    const files = this.getRegisteredFiles();
    
    // Check duplication
    const duplicate = files.find(f => f.figmaFileKey === key);
    if (duplicate) {
      throw new Error('File already registered');
    }

    const newFile: RegisteredFile = {
      id: 'rf-' + Math.random().toString(36).substring(4),
      figmaFileKey: key,
      name,
      figmaUrl: url,
      status: 'not_scanned',
      trackingEnabled: true,
      lastScanJobId: null,
      lastScanStatus: null,
      lastScanAttemptAt: null,
      lastSuccessfulScanAt: null,
      totalInstances: 0,
      uniqueComponentsUsed: 0
    };

    files.push(newFile);
    this.setStore('registered_files', files);
    return newFile;
  }

  static removeRegisteredFile(id: string): void {
    const files = this.getRegisteredFiles().filter(f => f.id !== id);
    this.setStore('registered_files', files);

    // clean current usage
    const usage = this.getUsageCurrent().filter(u => u.registeredFileId !== id);
    this.setStore('usage_current', usage);
  }

  static toggleFileTracking(id: string): RegisteredFile {
    const files = this.getRegisteredFiles();
    const file = files.find(f => f.id === id);
    if (!file) throw new Error('File not found');
    file.trackingEnabled = !file.trackingEnabled;
    file.status = file.trackingEnabled ? (file.lastSuccessfulScanAt ? 'healthy' : 'not_scanned') : 'disabled';
    this.setStore('registered_files', files);
    return file;
  }

  // Scanning simulation engine
  // Simulates scanning sequentially. Uses callbacks to update state/progress.
  static activeScanTimeout: any = null;

  static runScanBatch(onUpdate: () => void): string {
    if (this.activeScanTimeout) {
      return 'Already scanning';
    }

    const activeFiles = this.getRegisteredFiles().filter(f => f.trackingEnabled);
    if (activeFiles.length === 0) {
      throw new Error('No active files to scan');
    }

    const batchId = 'batch-' + Math.random().toString(36).substring(4);
    const newBatch: ScanBatch = {
      id: batchId,
      status: 'running',
      totalFiles: activeFiles.length,
      completedFiles: 0,
      failedFiles: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      createdAt: new Date().toISOString()
    };

    const batches = this.getBatches();
    batches.unshift(newBatch);
    this.setStore('batches', batches);

    // Create jobs
    const jobs = this.getJobs();
    const batchJobs: ScanJob[] = activeFiles.map(file => ({
      id: 'job-' + Math.random().toString(36).substring(4),
      batchId: batchId,
      registeredFileId: file.id,
      status: 'pending',
      startedAt: null,
      finishedAt: null,
      durationMs: null,
      errorCode: null,
      errorMessage: null,
      totalInstances: 0,
      uniqueComponentsUsed: 0,
      progress: 0
    }));

    jobs.unshift(...batchJobs);
    this.setStore('jobs', jobs);

    // Start sequential background execution
    let currentJobIdx = 0;
    
    const executeNextJob = () => {
      if (currentJobIdx >= batchJobs.length) {
        // Batch completed
        const updatedBatch = this.getBatches().find(b => b.id === batchId);
        if (updatedBatch) {
          updatedBatch.status = updatedBatch.failedFiles === 0 ? 'success' : 
                               (updatedBatch.completedFiles === 0 ? 'failed' : 'partial_success');
          updatedBatch.finishedAt = new Date().toISOString();
          this.setStore('batches', this.getBatches());
        }
        this.activeScanTimeout = null;
        onUpdate();
        return;
      }

      const jobRef = batchJobs[currentJobIdx];
      const job = this.getJobs().find(j => j.id === jobRef.id);
      if (!job) return;

      job.status = 'running';
      job.startedAt = new Date().toISOString();
      this.setStore('jobs', this.getJobs());
      onUpdate();

      // Simulate file node traversing progress
      let prog = 0;
      const interval = setInterval(() => {
        prog += 20;
        const currentJob = this.getJobs().find(j => j.id === jobRef.id);
        if (currentJob) {
          currentJob.progress = Math.min(prog, 100);
          this.setStore('jobs', this.getJobs());
          onUpdate();
        }

        if (prog >= 100) {
          clearInterval(interval);
          // Complete single job
          const finalJob = this.getJobs().find(j => j.id === jobRef.id);
          if (finalJob) {
            // Seed a realistic layout scan result
            // Simulate random failure (15% rate) for billing redesign or other files
            const shouldFail = Math.random() < 0.15 || finalJob.registeredFileId === 'rf-4'; 
            
            const file = this.getRegisteredFiles().find(f => f.id === finalJob.registeredFileId);
            if (shouldFail) {
              finalJob.status = 'failed';
              finalJob.finishedAt = new Date().toISOString();
              finalJob.errorCode = 'FIGMA_AUTHENTICATION_EXPIRED';
              finalJob.errorMessage = 'The file node depth exceeds traversing allocation limit or access key is expired.';
              
              if (file) {
                file.status = 'failed';
                file.lastScanJobId = finalJob.id;
                file.lastScanStatus = 'failed';
                file.lastScanAttemptAt = new Date().toISOString();
              }
              
              const b = this.getBatches().find(b => b.id === batchId);
              if (b) b.failedFiles += 1;
            } else {
              finalJob.status = 'success';
              finalJob.finishedAt = new Date().toISOString();
              finalJob.durationMs = 2000 + Math.floor(Math.random() * 5000);
              
              // Random instances generated
              const componentCount = 3 + Math.floor(Math.random() * 6);
              const components = this.getComponents();
              const usedComponents = [...components].sort(() => 0.5 - Math.random()).slice(0, componentCount);
              
              let fileTotalInstances = 0;
              const newUsageCurrent = this.getUsageCurrent().filter(u => u.registeredFileId !== finalJob.registeredFileId);
              const newSnapshots = this.getSnapshots();
              const newChanges = this.getChanges();

              usedComponents.forEach(comp => {
                const count = 5 + Math.floor(Math.random() * 80);
                fileTotalInstances += count;

                // get previous count
                const prev = this.getUsageCurrent().find(u => u.registeredFileId === finalJob.registeredFileId && u.componentId === comp.id);
                const prevCount = prev ? prev.instanceCount : 0;

                newUsageCurrent.push({
                  id: 'uc-' + Math.random().toString(36).substring(4),
                  componentId: comp.id,
                  registeredFileId: finalJob.registeredFileId,
                  instanceCount: count,
                  lastSeenAt: new Date().toISOString()
                });

                // Create snapshot
                newSnapshots.push({
                  id: 'sn-' + Math.random().toString(36).substring(4),
                  batchId: batchId,
                  componentId: comp.id,
                  registeredFileId: finalJob.registeredFileId,
                  instanceCount: count,
                  recordedAt: new Date().toISOString()
                });

                // Change detection
                if (prevCount !== count) {
                  let changeType: UsageChange['changeType'] = 'no_change';
                  if (prevCount === 0 && count > 0) changeType = 'newly_used';
                  else if (count > prevCount) changeType = 'increased';
                  else if (count < prevCount) changeType = 'decreased';

                  newChanges.unshift({
                    id: 'ch-' + Math.random().toString(36).substring(4),
                    batchId: batchId,
                    componentId: comp.id,
                    componentName: comp.componentName,
                    registeredFileId: finalJob.registeredFileId,
                    fileName: file?.name || 'Unknown File',
                    previousCount: prevCount,
                    currentCount: count,
                    changeType,
                    detectedAt: new Date().toISOString()
                  });
                }
              });

              // Check if any previously used component is now removed
              const prevUsed = this.getUsageCurrent().filter(u => u.registeredFileId === finalJob.registeredFileId);
              prevUsed.forEach(pu => {
                const stillUsed = usedComponents.find(c => c.id === pu.componentId);
                if (!stillUsed) {
                  newChanges.unshift({
                    id: 'ch-' + Math.random().toString(36).substring(4),
                    batchId: batchId,
                    componentId: pu.componentId,
                    componentName: components.find(c => c.id === pu.componentId)?.componentName || 'Unknown Component',
                    registeredFileId: finalJob.registeredFileId,
                    fileName: file?.name || 'Unknown File',
                    previousCount: pu.instanceCount,
                    currentCount: 0,
                    changeType: 'removed',
                    detectedAt: new Date().toISOString()
                  });
                }
              });

              finalJob.totalInstances = fileTotalInstances;
              finalJob.uniqueComponentsUsed = componentCount;

              this.setStore('usage_current', newUsageCurrent);
              this.setStore('snapshots', newSnapshots);
              this.setStore('changes', newChanges);

              if (file) {
                file.status = fileTotalInstances > 0 ? 'healthy' : 'zero_usage';
                file.lastScanJobId = finalJob.id;
                file.lastScanStatus = 'success';
                file.lastScanAttemptAt = new Date().toISOString();
                file.lastSuccessfulScanAt = new Date().toISOString();
                file.totalInstances = fileTotalInstances;
                file.uniqueComponentsUsed = componentCount;
              }

              const b = this.getBatches().find(b => b.id === batchId);
              if (b) b.completedFiles += 1;
            }

            this.setStore('registered_files', this.getRegisteredFiles());
            this.setStore('jobs', this.getJobs());
            this.setStore('batches', this.getBatches());
            
            onUpdate();
            currentJobIdx++;
            
            // Wait configured delay before next file job to reduce figma rate limit risk simulation
            this.activeScanTimeout = setTimeout(executeNextJob, 1000);
          }
        }
      }, 300);
    };

    // Begin queue
    executeNextJob();

    return batchId;
  }
}
