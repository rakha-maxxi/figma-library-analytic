import React from 'react';
import { 
  useRegisteredFiles, 
  useRecentChanges, 
  useComponents,
  useAdoptionTrend
} from '../hooks/useTracker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  LayersIcon, 
  FileTextIcon, 
  TrendingUpIcon, 
  ActivityIcon,
  TrendingDownIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowRightLeftIcon,
  RotateCwIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { parseFigmaComponentName } from '../lib/utils';

export const OverviewPage: React.FC = () => {
  const { data: files } = useRegisteredFiles();
  const { data: changes } = useRecentChanges();
  const { data: components } = useComponents();
  const { data: trendData } = useAdoptionTrend();

  // Aggregate stats
  const activeFilesCount = files?.filter(f => f.trackingEnabled).length || 0;
  
  // Total tracked instances
  const totalInstances = files?.reduce((acc, f) => acc + (f.trackingEnabled ? f.totalInstances : 0), 0) || 0;
  

  // Last successful scan
  const successfulScans = files?.filter(f => f.lastSuccessfulScanAt).map(f => new Date(f.lastSuccessfulScanAt!).getTime()) || [];
  const latestScanTime = successfulScans.length > 0 ? new Date(Math.max(...successfulScans)) : null;

  // Build chart data from real adoption trend
  const chartData = trendData && trendData.length > 0
    ? trendData.map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        instances: d.instances,
        files: d.files,
      }))
    : [];

  // Map change type to badges
  const renderChangeBadge = (type: string) => {
    switch (type) {
      case 'newly_used':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
            <PlusCircleIcon className="size-3" /> Newly Used
          </span>
        );
      case 'increased':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-400 font-semibold px-2 py-0.5 rounded border border-sky-500/20">
            <TrendingUpIcon className="size-3" /> Increased
          </span>
        );
      case 'decreased':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/20">
            <TrendingDownIcon className="size-3" /> Decreased
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 font-semibold px-2 py-0.5 rounded border border-rose-500/20">
            <MinusCircleIcon className="size-3" /> Removed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded border border-border">
            <ArrowRightLeftIcon className="size-3" /> No Change
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Total Instances Tracked</span>
            <LayersIcon className="size-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">{totalInstances}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Across all registered consumer files</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Active Components</span>
            <ActivityIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">{components?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Imported from source UI Kit file</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Tracked Consumer Files</span>
            <FileTextIcon className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">{activeFilesCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Files currently selected for scan</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Latest Scan freshness</span>
            <RotateCwIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold text-foreground mt-1 truncate">
              {latestScanTime ? latestScanTime.toLocaleString() : 'No successful scans yet'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Latest crawler snapshot timestamp</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Graph + Recent changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Card */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Total Component Adoption Trend</CardTitle>
            <span className="text-xs text-muted-foreground">Total instances detected across scans</span>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'oklch(0.205 0 0)', borderColor: 'oklch(1 0 0 / 10%)', borderRadius: '6px' }} 
                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="instances" 
                    stroke="oklch(0.488 0.243 264.376)" 
                    strokeWidth={2} 
                    dot={{ r: 4, strokeWidth: 1, fill: 'oklch(0.145 0 0)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : chartData.length === 1 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-1.5">
                <span className="text-xs font-semibold text-foreground/80">Single scan point detected</span>
                <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                  Adoption trends require at least 2 scan snapshots. Run another scan after updating your consumer files to view usage delta.
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-1.5">
                <span className="text-xs font-semibold text-foreground/80">No scan history yet</span>
                <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                  Initiate your first crawl scan on registered files to construct a baseline adoption trend chart.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Changes Card */}
        <Card className="border-border bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Usage Changes</CardTitle>
            <span className="text-xs text-muted-foreground">Modifications detected in latest scans</span>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-2.5 h-full justify-center">
              {changes && changes.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {changes.slice(0, 5).map((ch) => {
                    const parsed = parseFigmaComponentName(ch.componentName, ch.componentSetName || null);
                    return (
                      <div key={ch.id} className="border border-border/60 bg-muted/20 rounded-md p-3 flex flex-col gap-2 transition-colors hover:bg-muted/30" title={ch.componentName}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                              {parsed.baseName}
                            </span>
                            {parsed.formattedProperties && (
                              <span className="text-[9px] text-muted-foreground/60 truncate font-mono mt-0.5 max-w-[140px]">
                                {parsed.formattedProperties}
                              </span>
                            )}
                          </div>
                          {renderChangeBadge(ch.changeType)}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-1.5">
                          <span className="truncate max-w-[120px]" title={ch.fileName}>{ch.fileName}</span>
                          <span className="font-mono">
                            {ch.previousCount} → <strong className="text-foreground">{ch.currentCount}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-1">
                  <span className="text-xs font-semibold text-foreground/70">No scan changes detected</span>
                  <span className="text-[10px] max-w-[200px] text-muted-foreground/70 leading-relaxed">
                    Once component count changes are detected during file scans, they will be listed here.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
