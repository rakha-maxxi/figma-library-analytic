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
  ArrowRightIcon,
  RefreshCwIcon, EyeIcon,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Progress, ProgressLabel, ProgressValue } from '../../ui/progress';

export const SummaryMetricsWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: components } = useComponents();
  const { data: batches } = useScanBatches();

  const totalComps = components?.length || 0;
  const usedComps = (components || []).filter(c => (c as unknown as { totalInstances: number }).totalInstances > 0).length;
  const unusedComps = totalComps - usedComps;
  const adoptionRate = totalComps > 0 ? Math.round((usedComps / totalComps) * 100) : 0;

  const latestBatch = batches?.[0];
  const lastScanStatus = latestBatch ? latestBatch.status : 'no_scans';

  const statusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return { label: 'Sync Success', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'failed':
        return { label: 'Sync Failed', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'running':
        return { label: 'Scanning...', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse' };
      case 'partial_success':
        return { label: 'Partial Success', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      default:
        return { label: 'No Scans Run', cls: 'bg-muted text-muted-foreground' };
    }
  };

  const status = statusLabel(lastScanStatus);

  return (
    <WidgetCard layout={layout} title="Summary Metrics">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-border/60 rounded-xl p-3 bg-muted/5 flex flex-col items-center justify-between text-center min-h-[90px]">
          <LayersIcon className="size-4.5 text-violet-500 mb-1" />
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight tabular-nums">{totalComps}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Total Components</p>
          </div>
        </div>
        <div className="border border-border/60 rounded-xl p-3 bg-muted/5 flex flex-col items-center justify-between text-center min-h-[90px]">
          <ShieldCheckIcon className="size-4.5 text-emerald-500 mb-1" />
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight tabular-nums">{usedComps}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Used Components</p>
          </div>
        </div>
        <div className="border border-border/60 rounded-xl p-3 bg-muted/5 flex flex-col items-center justify-between text-center min-h-[90px]">
          <AlertTriangleIcon className="size-4.5 text-amber-500 mb-1" />
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight tabular-nums">{unusedComps}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Unused Components</p>
          </div>
        </div>
        <div className="border border-border/60 rounded-xl p-3 bg-muted/5 flex flex-col items-center justify-between text-center min-h-[90px]">
          <TrendingUpIcon className="size-4.5 text-sky-500 mb-1" />
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight tabular-nums">{adoptionRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Adoption Rate</p>
          </div>
        </div>
        <div className="border border-border/60 rounded-xl p-3 bg-muted/5 flex flex-col items-center justify-between text-center min-h-[90px] col-span-2 sm:col-span-1">
          <ClockIcon className="size-4.5 text-rose-500 mb-1" />
          <div className="flex flex-col items-center">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${status.cls}`}>
              {status.label}
            </span>
            <p className="text-[9px] text-muted-foreground mt-1.5 font-mono">
              {latestBatch?.finishedAt ? new Date(latestBatch.finishedAt).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
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
  const { data: batches } = useScanBatches();
  const { data: insights } = useInsights();
  
  const failingFiles = (files || []).filter(f => f.status === 'failed' || f.status === 'stale' || (f.status === 'zero_usage' && f.trackingEnabled));
  const failedBatches = (batches || []).filter(b => b.failedFiles > 0).slice(0, 3);
  const staleCount = insights?.staleFiles?.length || 0;
  const unusedCount = insights?.unusedComponents?.length || 0;
  
  const hasIssues = failingFiles.length > 0 || failedBatches.length > 0 || staleCount > 0;

  return (
    <WidgetCard layout={layout} title="Needs Attention">
      {hasIssues ? (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {/* Failed Scan Batches */}
          {failedBatches.map(b => (
            <div key={b.id} className="border border-rose-500/20 rounded-lg p-3 bg-rose-500/5 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <ShieldXIcon className="size-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Scan Batch Failure</p>
                  <p className="text-[10px] text-muted-foreground">
                    {b.failedFiles} of {b.totalFiles} files failed to scan on {b.finishedAt ? new Date(b.finishedAt).toLocaleDateString() : 'recent run'}.
                  </p>
                </div>
              </div>
              <Badge className="text-[9px] bg-rose-500/10 text-rose-400 shrink-0">Batch Error</Badge>
            </div>
          ))}

          {/* Failing or Stale Files */}
          {failingFiles.map(f => (
            <div key={f.id} className="border border-border rounded-lg p-3 bg-muted/5 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2 min-w-0">
                {f.status === 'failed' ? (
                  <AlertTriangleIcon className="size-4 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <ClockIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{f.figmaFileKey}</p>
                </div>
              </div>
              <Badge className={`text-[9px] shrink-0 ${f.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {f.status === 'failed' ? 'Scan Failed' : 'Stale Scan'}
              </Badge>
            </div>
          ))}

          {/* Unused Components Warning */}
          {unusedCount > 10 && (
            <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
              <AlertTriangleIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">High Number of Unused Components</p>
                <p className="text-[10px] text-muted-foreground">
                  {unusedCount} components in the source library are completely unused. Go to Insights to clean them up.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <CheckCircle2Icon className="size-8 text-emerald-500/40" />
          <p className="text-xs font-semibold text-foreground/60">All systems operational</p>
          <p className="text-[10px]">Your Figma libraries and consumer design files are fully synced and healthy.</p>
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

export const AdoptionCoverageWidget: React.FC<WidgetProps> = ({ layout }) => {
  const { data: components } = useComponents();
  const total = components?.length || 0;
  const used = (components || []).filter(c => (c as unknown as { totalInstances: number }).totalInstances > 0).length;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <WidgetCard layout={layout} title="Adoption Coverage">
      <div className="py-2 flex flex-col gap-3">
        <Progress value={pct} className="w-full flex-col items-stretch gap-2">
          <div className="flex items-center justify-between text-xs w-full">
            <ProgressLabel className="text-muted-foreground font-normal">Component adoption rate</ProgressLabel>
            <ProgressValue className="font-mono font-bold text-foreground" />
          </div>
        </Progress>
        <div className="flex justify-between text-[10px] text-muted-foreground/85 mt-1 border-t border-border/35 pt-2 font-mono">
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

  const actions: Array<{ label: string; desc: string; icon: typeof AlertTriangleIcon; color: string; tab: string }> = [];
  const unused = insights?.unusedComponents?.length || 0;
  const lowUsage = insights?.lowUsageComponents?.length || 0;
  const failed = insights?.failedScansCount || 0;
  const staleFilesCount = insights?.staleFiles?.length || 0;
  const zeroUsageFiles = (files || []).filter(f => f.status === 'zero_usage' && f.trackingEnabled).length;
  const unscannedFiles = (files || []).filter(f => f.status === 'not_scanned' && f.trackingEnabled).length;

  if (failed > 0) {
    actions.push({ 
      label: `Inspect ${failed} failed scans`, 
      desc: 'crawler jobs with rate or scope issues', 
      icon: ShieldXIcon, 
      color: 'rose', 
      tab: 'scans' 
    });
  }
  if (unscannedFiles > 0) {
    actions.push({ 
      label: `Scan ${unscannedFiles} new files`, 
      desc: 'consumer files not yet analyzed', 
      icon: RefreshCwIcon, 
      color: 'sky', 
      tab: 'scans' 
    });
  }
  if (staleFilesCount > 0) {
    actions.push({ 
      label: `Re-scan ${staleFilesCount} stale files`, 
      desc: 'freshness threshold exceeded', 
      icon: ClockIcon, 
      color: 'yellow', 
      tab: 'scans' 
    });
  }
  if (unused > 0) {
    actions.push({ 
      label: `Review ${unused} unused components`, 
      desc: 'source elements with zero usage', 
      icon: AlertTriangleIcon, 
      color: 'amber', 
      tab: 'insights' 
    });
  }
  if (lowUsage > 0) {
    actions.push({ 
      label: `Review ${lowUsage} low-usage elements`, 
      desc: 'components below adoption goal', 
      icon: TrendingDownIcon, 
      color: 'violet', 
      tab: 'insights' 
    });
  }
  if (zeroUsageFiles > 0) {
    actions.push({ 
      label: `Check ${zeroUsageFiles} zero-usage files`, 
      desc: 'files without design system elements', 
      icon: FileTextIcon, 
      color: 'muted', 
      tab: 'files' 
    });
  }

  if (actions.length === 0) {
    actions.push({ 
      label: 'Run new scan batch', 
      desc: 'keep design system metrics fresh', 
      icon: RefreshCwIcon, 
      color: 'sky', 
      tab: 'scans' 
    });
    actions.push({ 
      label: 'Browse component inventory', 
      desc: 'view source component metadata', 
      icon: EyeIcon, 
      color: 'violet', 
      tab: 'components' 
    });
  }

  const navigateToTab = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('change-tab', { detail: tabId }));
  };

  return (
    <WidgetCard layout={layout} title="Recommended Next Actions">
      <div className="space-y-2">
        {actions.slice(0, 4).map((a, i) => {
          const Icon = a.icon;
          const cmap: Record<string, string> = { 
            amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20', 
            rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20', 
            violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20', 
            yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', 
            sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20', 
            muted: 'text-muted-foreground bg-muted border-border' 
          };
          return (
            <button
              key={i}
              onClick={() => navigateToTab(a.tab)}
              className="w-full text-left flex items-center gap-3 border border-border/50 rounded-xl p-3 bg-card hover:bg-muted/10 active:scale-[0.97] transition-all cursor-pointer shadow-sm group select-none"
            >
              <div className={`p-2 rounded-lg shrink-0 border ${cmap[a.color]}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{a.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
              <ArrowRightIcon className="size-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
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
