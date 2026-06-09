import { registerWidget } from './widget-registry';

import {
  SummaryMetricsWidget, DirectInstancesTrendWidget, RecentUsageChangesWidget,
  TopUsedComponentsWidget, FilesNeedingAttentionWidget, GovernanceHealthWidget,
  FailedScansWidget, StaleFilesWidget, UnusedInTrackedFilesWidget,
  LowUsageComponentsWidget, SourceComponentsCountWidget, UsedComponentsCountWidget,
  TrackedFilesCountWidget, LatestScanFreshnessWidget, ScanSuccessRateWidget,
  RecentActivityWidget,
  HealthSummaryWidget, AdoptionCoverageWidget, NextActionsWidget, ScanReliabilityWidget,
} from '../components/dashboard/widgets/AllWidgets';

export function initWidgets() {
  registerWidget({ widgetId: 'summary_metrics', title: 'Summary Metrics', description: 'Key metrics: total instances, components, files, last scan', category: 'Usage', defaultSize: 'full', supportedSizes: ['full'] }, SummaryMetricsWidget);
  registerWidget({ widgetId: 'direct_instances_trend', title: 'Direct Instances Trend', description: 'Line chart of total instances over scan history', category: 'Usage', defaultSize: 'large', supportedSizes: ['medium', 'large', 'full'] }, DirectInstancesTrendWidget);
  registerWidget({ widgetId: 'recent_usage_changes', title: 'Recent Usage Changes', description: 'Latest component usage changes across files', category: 'Activity', defaultSize: 'medium', supportedSizes: ['medium', 'large'] }, RecentUsageChangesWidget);
  registerWidget({ widgetId: 'top_used_components', title: 'Top Used Components', description: 'Most adopted components ranked by usage', category: 'Components', defaultSize: 'medium', supportedSizes: ['small', 'medium', 'large'] }, TopUsedComponentsWidget);
  registerWidget({ widgetId: 'files_needing_attention', title: 'Files Needing Attention', description: 'Files that are failed, stale, or zero usage', category: 'Files', defaultSize: 'large', supportedSizes: ['medium', 'large', 'full'] }, FilesNeedingAttentionWidget);
  registerWidget({ widgetId: 'governance_health', title: 'Governance Health', description: 'Overview of unused, low-usage, and deprecated components', category: 'Governance', defaultSize: 'large', supportedSizes: ['medium', 'large'] }, GovernanceHealthWidget);
  registerWidget({ widgetId: 'health_summary', title: 'Design System Health', description: 'Overall health status with key metrics and alerts', category: 'Usage', defaultSize: 'full', supportedSizes: ['full'] }, HealthSummaryWidget);
  registerWidget({ widgetId: 'adoption_coverage', title: 'Adoption Coverage', description: 'Percentage of source components used in consumer files', category: 'Components', defaultSize: 'medium', supportedSizes: ['small', 'medium'] }, AdoptionCoverageWidget);
  registerWidget({ widgetId: 'next_actions', title: 'Recommended Next Actions', description: 'Rule-based action items for Design Ops', category: 'Activity', defaultSize: 'medium', supportedSizes: ['medium', 'large'] }, NextActionsWidget);
  registerWidget({ widgetId: 'scan_reliability', title: 'Scan Reliability', description: 'Success/failure breakdown of recent scan batches', category: 'Scans', defaultSize: 'medium', supportedSizes: ['small', 'medium'] }, ScanReliabilityWidget);
  registerWidget({ widgetId: 'failed_scans', title: 'Failed Scans', description: 'List of recently failed scan jobs', category: 'Scans', defaultSize: 'medium', supportedSizes: ['small', 'medium', 'large'] }, FailedScansWidget);
  registerWidget({ widgetId: 'stale_files', title: 'Stale Files', description: 'Files not scanned within freshness threshold', category: 'Files', defaultSize: 'medium', supportedSizes: ['small', 'medium', 'large'] }, StaleFilesWidget);
  registerWidget({ widgetId: 'unused_in_tracked_files', title: 'Unused in Tracked Files', description: 'Source components with zero usage', category: 'Governance', defaultSize: 'medium', supportedSizes: ['medium', 'large', 'full'] }, UnusedInTrackedFilesWidget);
  registerWidget({ widgetId: 'low_usage_components', title: 'Low Usage Components', description: 'Components below usage threshold', category: 'Governance', defaultSize: 'medium', supportedSizes: ['medium', 'large'] }, LowUsageComponentsWidget);
  registerWidget({ widgetId: 'source_components_count', title: 'Source Components Count', description: 'Number of components in the source UI Kit', category: 'Components', defaultSize: 'small', supportedSizes: ['small'] }, SourceComponentsCountWidget);
  registerWidget({ widgetId: 'used_components_count', title: 'Used Components Count', description: 'Components with at least one direct instance', category: 'Components', defaultSize: 'small', supportedSizes: ['small'] }, UsedComponentsCountWidget);
  registerWidget({ widgetId: 'tracked_files_count', title: 'Tracked Files Count', description: 'Number of registered consumer files', category: 'Files', defaultSize: 'small', supportedSizes: ['small'] }, TrackedFilesCountWidget);
  registerWidget({ widgetId: 'latest_scan_freshness', title: 'Latest Scan Freshness', description: 'Timestamp of the most recent successful scan', category: 'Scans', defaultSize: 'small', supportedSizes: ['small'] }, LatestScanFreshnessWidget);
  registerWidget({ widgetId: 'scan_success_rate', title: 'Scan Success Rate', description: 'Percentage of successful scans', category: 'Scans', defaultSize: 'small', supportedSizes: ['small'] }, ScanSuccessRateWidget);
  registerWidget({ widgetId: 'recent_activity', title: 'Recent Activity', description: 'Latest system events and actions', category: 'Activity', defaultSize: 'medium', supportedSizes: ['medium', 'large'] }, RecentActivityWidget);
}

initWidgets();
