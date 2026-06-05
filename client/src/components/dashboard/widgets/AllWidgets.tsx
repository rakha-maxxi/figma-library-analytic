import React from 'react';
import { WidgetCard } from '../WidgetCard';
import type { WidgetProps } from '../../../lib/widget-registry';
import { useRegisteredFiles, useRecentChanges, useComponents, useAdoptionTrend, useInsights, useScanBatches } from '../../../hooks/useTracker';
import { Badge } from '../../ui/badge';
import {
  LayersIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon,
  PlusCircleIcon, MinusCircleIcon, CheckCircle2Icon,
  ClockIcon, FileTextIcon, ActivityIcon, ZapIcon,
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
                <p className="font-medium truncate">{ch.componentName}</p>
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
                <span className="truncate">{c.componentName}</span>
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
  return (
    <WidgetCard layout={layout} title="Files Needing Attention">
      {failing.length > 0 ? (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {failing.map(f => (
            <div key={f.id} className="flex items-center justify-between text-xs border rounded-md p-2.5 bg-muted/10">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{f.figmaFileKey}</p>
              </div>
              <Badge className={`text-[9px] shrink-0 ml-2 ${f.status === 'failed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : f.status === 'stale' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-muted text-muted-foreground'}`}>
                {f.status === 'failed' ? 'Failed' : f.status === 'stale' ? 'Stale' : 'Zero Usage'}
              </Badge>
            </div>
          ))}
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
  return (
    <WidgetCard layout={layout} title="Governance Health">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-amber-500/20 rounded-lg p-4 bg-amber-500/5 text-center">
          <AlertTriangleIcon className="size-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-amber-500 tabular-nums">{unusedCount}</p>
          <p className="text-[10px] text-amber-400/70 font-medium mt-0.5">Unused</p>
        </div>
        <div className="border border-violet-500/20 rounded-lg p-4 bg-violet-500/5 text-center">
          <TrendingDownIcon className="size-5 text-violet-500 mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-violet-500 tabular-nums">{lowUsageCount}</p>
          <p className="text-[10px] text-violet-400/70 font-medium mt-0.5">Low Usage</p>
        </div>
        <div className="border border-rose-500/20 rounded-lg p-4 bg-rose-500/5 text-center">
          <ClockIcon className="size-5 text-rose-500 mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-rose-500 tabular-nums">{staleCount}</p>
          <p className="text-[10px] text-rose-400/70 font-medium mt-0.5">Stale Files</p>
        </div>
      </div>
      {insights?.failedScansCount ? (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
          <Badge className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
            <AlertTriangleIcon className="size-3 mr-0.5" />
            {insights.failedScansCount} failed scan{insights.failedScansCount > 1 ? 's' : ''}
          </Badge>
        </div>
      ) : null}
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
