import React from 'react';
import { WidgetCard } from '../WidgetCard';
import type { WidgetProps } from '../../../lib/widget-registry';
import { useRegisteredFiles, useRecentChanges, useComponents, useAdoptionTrend, useInsights, useScanBatches } from '../../../hooks/useTracker';
import { Badge } from '../../ui/badge';
import { parseFigmaComponentName } from '../../../lib/utils';
import {
  LayersIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon,
  PlusCircleIcon, MinusCircleIcon, CheckCircle2Icon,
  ClockIcon, FileTextIcon, ActivityIcon, ZapIcon,
  ShieldCheckIcon, ShieldAlertIcon, ShieldXIcon,
  BarChart3Icon, LightbulbIcon, ArrowRightIcon,
  RefreshCwIcon, EyeIcon,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SummaryMetricsWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: files } = useRegisteredFiles();
  const { data: components } = useComponents();
  const { data: insights } = useInsights();
  const totalInstances = files?.reduce((a, f) => a + (f.trackingEnabled ? f.totalInstances : 0), 0) || 0;
  const activeFiles = files?.filter(f => f.trackingEnabled).length || 0;
  const lastScan = files?.filter(f => f.lastSuccessfulScanAt).map(f => new Date(f.lastSuccessfulScanAt!).getTime()) || [];
  const latest = lastScan.length ? new Date(Math.max(...lastScan)) : null;
  return (
    <WidgetCard layout={layout} title="Summary Metrics">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-md p-3 bg-muted/10 text-center">
          <LayersIcon className="size-4 text-violet-500 mx-auto mb-1" />
          <p className="text-xl font-bold font-mono tabular-nums">{totalInstances}</p>
          <p className="text-[10px] text-muted-foreground">Direct Instances</p>
        </div>
        <div className="border border-border rounded-md p-3 bg-muted/10 text-center">
          <ZapIcon className="size-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold font-mono tabular-nums">{components?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Source Components</p>
        </div>
        <div className="border border-border rounded-md p-3 bg-muted/10 text-center">
          <FileTextIcon className="size-4 text-sky-500 mx-auto mb-1" />
          <p className="text-xl font-bold font-mono tabular-nums">{activeFiles}</p>
          <p className="text-[10px] text-muted-foreground">Tracked Files</p>
        </div>
        <div className="border border-border rounded-md p-3 bg-muted/10 text-center">
          <ClockIcon className="size-4 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold font-mono tabular-nums">{latest ? latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
          <p className="text-[10px] text-muted-foreground">Latest Scan</p>
        </div>
      </div>
      {insights && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40 flex-wrap">
          <Badge className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
            <AlertTriangleIcon className="size-3 mr-0.5" />
            {insights.unusedComponents?.length || 0} unused
          </Badge>
          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
            <TrendingDownIcon className="size-3 mr-0.5" />
            {insights.lowUsageComponents?.length || 0} low usage
          </Badge>
          <Badge className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">
            <ZapIcon className="size-3 mr-0.5" />
            {insights.failedScansCount} failed scans
          </Badge>
        </div>
      )}
    </WidgetCard>
  );
};

export const DirectInstancesTrendWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: trend } = useAdoptionTrend();
  const chartData = trend?.map(d => ({ name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), instances: d.instances })) || [];
  return (
    <WidgetCard layout={layout} title="Direct Instances Trend">
      {chartData.length >= 2 ? (
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" opacity={0.3} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'oklch(0.205 0 0)', borderColor: 'oklch(1 0 0 / 10%)', borderRadius: '6px' }} labelStyle={{ color: '#fff', fontSize: '10px' }} />
              <Area type="monotone" dataKey="instances" stroke="oklch(0.488 0.243 264.376)" fillOpacity={0.15} fill="oklch(0.488 0.243 264.376)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <ActivityIcon className="size-6 mb-1 opacity-30" />
          <p className="text-xs font-semibold text-foreground/60">Need at least 2 scans for trend data</p>
          <p className="text-[10px]">Run scans to build adoption history.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const RecentUsageChangesWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: changes } = useRecentChanges();
  const badge = (type: string) => {
    switch (type) {
      case 'newly_used': return <Badge className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><PlusCircleIcon className="size-3 mr-0.5" />New</Badge>;
      case 'increased': return <Badge className="text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20"><TrendingUpIcon className="size-3 mr-0.5" />Up</Badge>;
      case 'decreased': return <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20"><TrendingDownIcon className="size-3 mr-0.5" />Down</Badge>;
      case 'removed': return <Badge className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/20"><MinusCircleIcon className="size-3 mr-0.5" />Removed</Badge>;
      default: return null;
    }
  };
  return (
    <WidgetCard layout={layout} title="Recent Usage Changes">
      {changes && changes.length > 0 ? (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {changes.slice(0, 8).map(ch => (
            <div key={ch.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{parseFigmaComponentName(ch.componentName, ch.componentSetName || '').baseName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ch.fileName}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {badge(ch.changeType)}
                <span className="font-mono text-[10px] tabular-nums">{ch.previousCount}→{ch.currentCount}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <CheckCircle2Icon className="size-6 mb-1 opacity-30" />
          <p className="text-xs font-semibold text-foreground/60">No changes detected</p>
          <p className="text-[10px]">Run scans to see usage deltas.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const TopUsedComponentsWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: components } = useComponents();
  const top = (components || []).filter(c => (c as unknown as { totalInstances: number }).totalInstances > 0)
    .sort((a, b) => ((b as unknown as { totalInstances: number }).totalInstances) - ((a as unknown as { totalInstances: number }).totalInstances))
    .slice(0, 6);
  return (
    <WidgetCard layout={layout} title="Top Used Components">
      {top.length > 0 ? (
        <div className="space-y-1.5">
          {top.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                <span className="truncate">{parseFigmaComponentName(c.componentName, c.componentSetName).baseName}</span>
              </div>
              <span className="font-mono font-bold tabular-nums shrink-0 ml-2">{(c as unknown as { totalInstances: number }).totalInstances}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <p className="text-xs font-semibold text-foreground/60">No usage detected yet</p>
          <p className="text-[10px]">Run a scan to populate usage data.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const FilesNeedingAttentionWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: files } = useRegisteredFiles();
  const failing = (files || []).filter(f => f.status === 'failed' || f.status === 'stale' || (f.status === 'zero_usage' && f.trackingEnabled));
  const reasonLabel = (s: string) => {
    switch (s) {
      case 'failed': return { label: 'Failed', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
      case 'stale': return { label: 'Stale', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
      case 'zero_usage': return { label: 'Zero Usage', cls: 'bg-muted text-muted-foreground' };
      default: return { label: s, cls: '' };
    }
  };
  return (
    <WidgetCard layout={layout} title="Files Needing Attention">
      {failing.length > 0 ? (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {failing.map(f => {
            const r = reasonLabel(f.status);
            return (
              <div key={f.id} className="flex items-center justify-between text-xs border rounded-md p-2.5 bg-muted/10">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{f.figmaFileKey}</p>
                </div>
                <Badge className={`text-[9px] shrink-0 ml-2 ${r.cls}`}>{r.label}</Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <CheckCircle2Icon className="size-6 mb-1 text-emerald-500/30" />
          <p className="text-xs font-semibold text-foreground/60">All files are healthy</p>
          <p className="text-[10px]">No files need attention right now.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const GovernanceHealthWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: insights } = useInsights();
  const unusedCount = insights?.unusedComponents?.length || 0;
  const lowUsageCount = insights?.lowUsageComponents?.length || 0;
  const staleCount = insights?.staleFiles?.length || 0;
  const items = [
    { label: 'Unused in tracked files', count: unusedCount, color: 'amber', icon: AlertTriangleIcon, desc: 'Zero instances detected' },
    { label: 'Low usage', count: lowUsageCount, color: 'violet', icon: TrendingDownIcon, desc: 'Below adoption threshold' },
    { label: 'Stale files', count: staleCount, color: 'rose', icon: ClockIcon, desc: 'Not scanned recently' },
  ];
  return (
    <WidgetCard layout={layout} title="Governance Health">
      <div className="space-y-2">
        {items.map(item => {
          const Icon = item.icon;
          const colorMap: Record<string, string> = {
            amber: 'border-amber-500/20 bg-amber-500/5',
            violet: 'border-violet-500/20 bg-violet-500/5',
            rose: 'border-rose-500/20 bg-rose-500/5',
          };
          const textMap: Record<string, string> = {
            amber: 'text-amber-500',
            violet: 'text-violet-500',
            rose: 'text-rose-500',
          };
          return (
            <div key={item.label} className={`flex items-center justify-between rounded-lg p-3 border ${colorMap[item.color]} text-xs`}>
              <div className="flex items-center gap-2.5">
                <Icon className={`size-4 ${textMap[item.color]}`} />
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <span className={`text-lg font-bold font-mono tabular-nums ${textMap[item.color]}`}>{item.count}</span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
};

export const FailedScansWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: scanBatches } = useScanBatches();
  const failed = scanBatches?.filter(b => b.failedFiles > 0) || [];
  return (
    <WidgetCard layout={layout} title="Failed Scans">
      {failed.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {failed.slice(0, 5).map(b => (
            <div key={b.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-2">
              <div>
                <p className="font-medium capitalize">{b.status.replace('_', ' ')}</p>
                <p className="text-[10px] text-muted-foreground">{b.failedFiles}/{b.totalFiles} failed</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{b.finishedAt ? new Date(b.finishedAt).toLocaleDateString() : '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <CheckCircle2Icon className="size-6 mb-1 text-emerald-500/30" />
          <p className="text-xs font-semibold text-foreground/60">No failed scans</p>
          <p className="text-[10px]">All scan batches completed successfully.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const StaleFilesWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: insights } = useInsights();
  const stale = insights?.staleFiles || [];
  return (
    <WidgetCard layout={layout} title="Stale Files">
      {stale.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {stale.slice(0, 5).map(f => (
            <div key={f.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">Last: {f.lastSuccessfulScanAt ? new Date(f.lastSuccessfulScanAt).toLocaleDateString() : 'Never'}</p>
              </div>
              <Badge className="text-[9px] bg-yellow-500/10 text-yellow-400 shrink-0 ml-2">Stale</Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <CheckCircle2Icon className="size-6 mb-1 text-emerald-500/30" />
          <p className="text-xs font-semibold text-foreground/60">All files up to date</p>
          <p className="text-[10px]">No stale files detected.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const UnusedInTrackedFilesWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: insights } = useInsights();
  const unused = insights?.unusedComponents || [];
  return (
    <WidgetCard layout={layout} title="Unused in Tracked Files">
      {unused.length > 0 ? (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {unused.slice(0, 8).map(c => (
            <div key={c.id} className="text-xs py-1 border-b border-border/20 last:border-0 flex items-center justify-between">
              <span className="truncate">{c.componentName}</span>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">{c.componentSetName || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <CheckCircle2Icon className="size-6 mb-1 text-emerald-500/30" />
          <p className="text-xs font-semibold text-foreground/60">All components adopted</p>
          <p className="text-[10px]">Every source component is used in at least one file.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const LowUsageComponentsWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: insights } = useInsights();
  const low = insights?.lowUsageComponents || [];
  return (
    <WidgetCard layout={layout} title="Low Usage Components">
      {low.length > 0 ? (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {low.slice(0, 8).map(item => (
            <div key={item.component.id} className="text-xs py-1 border-b border-border/20 last:border-0 flex items-center justify-between">
              <span className="truncate">{item.component.componentName}</span>
              <span className="font-mono font-bold tabular-nums shrink-0 ml-2">{item.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <CheckCircle2Icon className="size-6 mb-1 text-emerald-500/30" />
          <p className="text-xs font-semibold text-foreground/60">No low usage components</p>
          <p className="text-[10px]">All components meet the adoption threshold.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const SourceComponentsCountWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: components } = useComponents();
  const count = components?.length || 0;
  return (
    <WidgetCard layout={layout} title="Source Components">
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <p className="text-3xl font-bold font-mono text-violet-500 tabular-nums">{count}</p>
          <p className="text-[10px] text-muted-foreground mt-1">in source UI Kit</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export const UsedComponentsCountWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: components } = useComponents();
  const used = (components || []).filter(c => (c as unknown as { totalInstances: number }).totalInstances > 0).length;
  return (
    <WidgetCard layout={layout} title="Used Components">
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <p className="text-3xl font-bold font-mono text-emerald-500 tabular-nums">{used}</p>
          <p className="text-[10px] text-muted-foreground mt-1">with direct usage</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export const TrackedFilesCountWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: files } = useRegisteredFiles();
  const count = files?.filter(f => f.trackingEnabled).length || 0;
  return (
    <WidgetCard layout={layout} title="Tracked Files">
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <p className="text-3xl font-bold font-mono text-sky-500 tabular-nums">{count}</p>
          <p className="text-[10px] text-muted-foreground mt-1">consumer files</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export const LatestScanFreshnessWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: files } = useRegisteredFiles();
  const times = files?.filter(f => f.lastSuccessfulScanAt).map(f => new Date(f.lastSuccessfulScanAt!).getTime()) || [];
  const latest = times.length ? new Date(Math.max(...times)) : null;
  return (
    <WidgetCard layout={layout} title="Latest Scan">
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <ClockIcon className="size-6 text-amber-500 mx-auto mb-1" />
          <p className="text-xs font-semibold">{latest ? latest.toLocaleString() : 'No scans yet'}</p>
          <p className="text-[10px] text-muted-foreground mt-1">most recent snapshot</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export const ScanSuccessRateWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: batches } = useScanBatches();
  const total = (batches?.length || 0) * (batches?.[0]?.totalFiles || 0);
  const completed = batches?.reduce((s, b) => s + b.completedFiles, 0) || 0;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <WidgetCard layout={layout} title="Scan Success Rate">
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <p className="text-3xl font-bold font-mono tabular-nums" style={{ color: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' }}>{rate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">{completed}/{total} files scanned</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export const RecentActivityWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: changes } = useRecentChanges();
  return (
    <WidgetCard layout={layout} title="Recent Activity">
      {changes && changes.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {changes.slice(0, 6).map(ch => (
            <div key={ch.id} className="text-xs py-1.5 border-b border-border/20 last:border-0">
              <p><span className="font-medium">{ch.componentName}</span> <span className="text-muted-foreground">in {ch.fileName}</span></p>
              <p className="text-[10px] text-muted-foreground">
                {ch.changeType.replace('_', ' ')} · {ch.previousCount}→{ch.currentCount} · {new Date(ch.detectedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1">
          <p className="text-xs font-semibold text-foreground/60">No recent activity</p>
          <p className="text-[10px]">Run scans to see activity here.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export const HealthSummaryWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: files } = useRegisteredFiles();
  const { data: components } = useComponents();
  const { data: insights } = useInsights();
  const totalInstances = files?.reduce((a, f) => a + (f.trackingEnabled ? f.totalInstances : 0), 0) || 0;
  const activeFiles = files?.filter(f => f.trackingEnabled).length || 0;
  const totalComps = components?.length || 0;
  const usedComps = (components || []).filter(c => (c as unknown as { totalInstances: number }).totalInstances > 0).length;
  const unused = insights?.unusedComponents?.length || 0;
  const lowUsage = insights?.lowUsageComponents?.length || 0;
  const failedScans = insights?.failedScansCount || 0;
  const staleFiles = insights?.staleFiles?.length || 0;
  const lastScan = files?.filter(f => f.lastSuccessfulScanAt).map(f => new Date(f.lastSuccessfulScanAt!).getTime()) || [];
  const latest = lastScan.length ? new Date(Math.max(...lastScan)) : null;

  let health: { label: string; color: string; icon: typeof ShieldCheckIcon } = { label: 'Healthy', color: 'emerald', icon: ShieldCheckIcon };
  if (failedScans > 3 || staleFiles > 5 || unused > totalComps * 0.5) {
    health = { label: 'Critical', color: 'rose', icon: ShieldXIcon };
  } else if (failedScans > 0 || staleFiles > 0 || unused > totalComps * 0.2) {
    health = { label: 'Needs Attention', color: 'amber', icon: ShieldAlertIcon };
  }
  const HealthIcon = health.icon;
  const hc: Record<string, string> = { emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500', amber: 'border-amber-500/20 bg-amber-500/5 text-amber-500', rose: 'border-rose-500/20 bg-rose-500/5 text-rose-500' };

  return (
    <WidgetCard layout={layout} title="Design System Health">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 border rounded-xl p-4 ${hc[health.color]} flex flex-col items-center gap-1`}>
          <HealthIcon className="size-6" />
          <span className="text-[10px] font-semibold">{health.label}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 flex-1">
          <div className="border border-border rounded-md p-2 bg-muted/5 text-center">
            <p className="text-lg font-bold font-mono tabular-nums">{totalInstances}</p>
            <p className="text-[10px] text-muted-foreground">Instances</p>
          </div>
          <div className="border border-border rounded-md p-2 bg-muted/5 text-center">
            <p className="text-lg font-bold font-mono tabular-nums">{usedComps}/{totalComps}</p>
            <p className="text-[10px] text-muted-foreground">Components Used</p>
          </div>
          <div className="border border-border rounded-md p-2 bg-muted/5 text-center">
            <p className="text-lg font-bold font-mono tabular-nums">{activeFiles}</p>
            <p className="text-[10px] text-muted-foreground">Tracked Files</p>
          </div>
          <div className="border border-border rounded-md p-2 bg-muted/5 text-center">
            <p className="text-[11px] font-semibold font-mono tabular-nums">{latest ? latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">Latest Scan</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40 flex-wrap">
        {unused > 0 && <Badge className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20"><AlertTriangleIcon className="size-3 mr-0.5" />{unused} unused</Badge>}
        {lowUsage > 0 && <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20"><TrendingDownIcon className="size-3 mr-0.5" />{lowUsage} low usage</Badge>}
        {staleFiles > 0 && <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><ClockIcon className="size-3 mr-0.5" />{staleFiles} stale</Badge>}
        {failedScans > 0 && <Badge className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20"><ZapIcon className="size-3 mr-0.5" />{failedScans} failed</Badge>}
        {unused === 0 && lowUsage === 0 && staleFiles === 0 && failedScans === 0 && (
          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2Icon className="size-3 mr-0.5" />All clear</Badge>
        )}
      </div>
    </WidgetCard>
  );
};

const colorByPct = (pct: number) => pct >= 50 ? '#10b981' : pct >= 20 ? '#f59e0b' : '#ef4444';

export const AdoptionCoverageWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: components } = useComponents();
  const total = components?.length || 0;
  const used = (components || []).filter(c => (c as unknown as { totalInstances: number }).totalInstances > 0).length;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <WidgetCard layout={layout} title="Adoption Coverage">
      <div className="py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{used} / {total} components used</span>
          <span className="text-sm font-bold font-mono tabular-nums" style={{ color: colorByPct(pct) }}>{pct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colorByPct(pct) }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Used: {used}</span>
          <span>Unused: {total - used}</span>
        </div>
      </div>
    </WidgetCard>
  );
};

export const NextActionsWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: files } = useRegisteredFiles();
  const { data: insights } = useInsights();
  const { data: components } = useComponents();
  const actions: Array<{ label: string; desc: string; icon: typeof AlertTriangleIcon; color: string }> = [];
  const unused = insights?.unusedComponents?.length || 0;
  const lowUsage = insights?.lowUsageComponents?.length || 0;
  const failed = insights?.failedScansCount || 0;
  const staleFilesCount = insights?.staleFiles?.length || 0;
  const zeroUsageFiles = (files || []).filter(f => f.status === 'zero_usage' && f.trackingEnabled).length;
  const totalComps = components?.length || 0;
  const unscannedFiles = (files || []).filter(f => f.status === 'not_scanned' && f.trackingEnabled).length;

  if (unused > 0) actions.push({ label: `Review ${unused} unused components`, desc: 'Components with zero instances', icon: AlertTriangleIcon, color: 'amber' });
  if (zeroUsageFiles > 0) actions.push({ label: `Inspect ${zeroUsageFiles} zero-usage files`, desc: 'Registered files with no DS components', icon: FileTextIcon, color: 'muted' });
  if (failed > 0) actions.push({ label: `Retry ${failed} failed scans`, desc: 'Files that failed during last scan', icon: ZapIcon, color: 'rose' });
  if (lowUsage > 0) actions.push({ label: `Review ${lowUsage} low-usage components`, desc: 'Components below adoption threshold', icon: TrendingDownIcon, color: 'violet' });
  if (staleFilesCount > 0) actions.push({ label: `Re-scan ${staleFilesCount} stale files`, desc: 'Files not scanned within threshold', icon: ClockIcon, color: 'yellow' });
  if (unscannedFiles > 0) actions.push({ label: `Scan ${unscannedFiles} new files`, desc: 'Consumer files not yet scanned', icon: RefreshCwIcon, color: 'sky' });
  if (actions.length === 0) {
    actions.push({ label: 'Run another scan', desc: 'Keep adoption data fresh', icon: RefreshCwIcon, color: 'sky' });
    actions.push({ label: 'View component inventory', desc: 'Browse source UI Kit components', icon: EyeIcon, color: 'violet' });
  }
  return (
    <WidgetCard layout={layout} title="Recommended Next Actions">
      <div className="space-y-2">
        {actions.map((a, i) => {
          const Icon = a.icon;
          const cmap: Record<string, string> = { amber: 'text-amber-500 bg-amber-500/10', rose: 'text-rose-500 bg-rose-500/10', violet: 'text-violet-500 bg-violet-500/10', yellow: 'text-yellow-500 bg-yellow-500/10', sky: 'text-sky-500 bg-sky-500/10', muted: 'text-muted-foreground bg-muted' };
          return (
            <div key={i} className="flex items-center gap-3 border border-border/60 rounded-md p-2.5 bg-muted/5 hover:bg-muted/10 cursor-pointer transition-colors">
              <div className={`p-1.5 rounded-md shrink-0 ${cmap[a.color]}`}><Icon className="size-3.5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{a.label}</p>
                <p className="text-[10px] text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowRightIcon className="size-3 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
};

export const ScanReliabilityWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: batches } = useScanBatches();
  const total = batches?.length || 0;
  if (total === 0) {
    return <WidgetCard layout={layout} title="Scan Reliability"><div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-1"><CheckCircle2Icon className="size-6 mb-1 opacity-30" /><p className="text-xs font-semibold text-foreground/60">No scans yet</p><p className="text-[10px]">Run a scan to see reliability data.</p></div></WidgetCard>;
  }
  const success = batches?.filter(b => b.status === 'success').length || 0;
  const partial = batches?.filter(b => b.status === 'partial_success').length || 0;
  const failed = batches?.filter(b => b.status === 'failed').length || 0;
  const cancelled = batches?.filter(b => b.status === 'cancelled').length || 0;
  const items = [
    { label: 'Success', count: success, color: '#10b981' },
    { label: 'Partial', count: partial, color: '#f59e0b' },
    { label: 'Failed', count: failed, color: '#ef4444' },
    { label: 'Cancelled', count: cancelled, color: '#6b7280' },
  ];
  return (
    <WidgetCard layout={layout} title="Scan Reliability">
      <div className="space-y-2">
        {items.filter(i => i.count > 0).map(i => (
          <div key={i.label} className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: i.color }} />
            <span className="flex-1 text-muted-foreground">{i.label}</span>
            <span className="font-mono font-bold tabular-nums">{i.count}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{total} total batches</span>
        <span>{Math.round(((success + partial) / total) * 100)}% reliable</span>
      </div>
    </WidgetCard>
  );
};
