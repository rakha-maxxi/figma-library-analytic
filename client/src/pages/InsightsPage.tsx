import React from 'react';
import { useInsights, useStartScan, useConnection, useSourceFile } from '../hooks/useTracker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangleIcon, 
  Trash2Icon, 
  InfoIcon, 
  SparklesIcon, 
  CalendarIcon, 
  CheckCircle2Icon,
  RefreshCwIcon,
  ExternalLinkIcon,
  DownloadIcon,
  ShieldAlertIcon,
  ArrowRightIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { parseFigmaComponentName } from '../lib/utils';

export const InsightsPage: React.FC = () => {
  const { data: connection } = useConnection();
  const { data: insights, isLoading } = useInsights();
  const { data: sourceFile } = useSourceFile();
  const { mutate: startScan } = useStartScan();

  const handleRescanStale = () => {
    if (!connection?.connected) {
      toast.error('Connect Figma token in settings first.');
      return;
    }
    toast.info('Starting refresh scan...');
    startScan(undefined, {
      onSuccess: () => {
        toast.success('Scan job queued for stale files.');
      }
    });
  };

  const handleExportCSV = () => {
    if (!insights || insights.unusedComponents.length === 0) {
      toast.error('No unused components available to export.');
      return;
    }
    
    // Headers for CSV
    const headers = ['Component Name', 'Component Set', 'Figma Node ID', 'Page Location', 'Status', 'Description'];
    
    // Format rows
    const rows = insights.unusedComponents.map(comp => [
      `"${comp.componentName.replace(/"/g, '""')}"`,
      `"${(comp.componentSetName || '').replace(/"/g, '""')}"`,
      `"${comp.componentNodeId}"`,
      `"${(comp.pageName || '').replace(/"/g, '""')}"`,
      `"${comp.status || 'active'}"`,
      `"${(comp.description || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `unused_components_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV export completed.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground select-none">
        <RefreshCwIcon className="size-4 animate-spin mr-2" /> Calculating insights and adoption metrics...
      </div>
    );
  }

  const unusedCount = insights?.unusedComponents.length || 0;
  const lowUsageCount = insights?.lowUsageComponents.length || 0;
  const staleCount = insights?.staleFiles.length || 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Governance & Health Insights</h2>
        <p className="text-xs text-muted-foreground">Actionable cleanup candidates and adoption audit alerts.</p>
      </div>

      {/* Critical Action Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Unused card */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Unused Components</span>
                <span className="text-2xl font-bold font-mono text-amber-500 tabular-nums">{unusedCount}</span>
              </div>
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-lg border border-amber-500/20">
                <AlertTriangleIcon className="size-4" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Components in the source UI Kit with 0 instances detected in registered design files.
            </p>
          </CardContent>
        </Card>

        {/* Low Adoption card */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Low Usage Items</span>
                <span className="text-2xl font-bold font-mono text-violet-500 tabular-nums">{lowUsageCount}</span>
              </div>
              <div className="bg-violet-500/10 text-violet-500 p-2.5 rounded-lg border border-violet-500/20">
                <InfoIcon className="size-4" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Components used less than 5 times overall. Reconsider their inclusion in the core library.
            </p>
          </CardContent>
        </Card>

        {/* Stale files card */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Stale Files</span>
                <span className="text-2xl font-bold font-mono text-rose-500 tabular-nums">{staleCount}</span>
              </div>
              <div className="bg-rose-500/10 text-rose-500 p-2.5 rounded-lg border border-rose-500/20">
                <CalendarIcon className="size-4" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Registered consumer files that have not been successfully scanned in the last 7 days.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs view */}
      <Tabs defaultValue="cleanup" className="flex-1 flex flex-col mt-4">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-3 bg-muted text-muted-foreground p-1 rounded-md w-full sm:max-w-2xl gap-1 sm:gap-0">
          <TabsTrigger value="cleanup" className="text-xs font-semibold leading-none rounded whitespace-nowrap active:scale-[0.98]">
            Unused in tracked files ({unusedCount})
          </TabsTrigger>
          <TabsTrigger value="lowusage" className="text-xs font-semibold leading-none rounded whitespace-nowrap active:scale-[0.98]">
            Low Usage ({lowUsageCount})
          </TabsTrigger>
          <TabsTrigger value="stale" className="text-xs font-semibold leading-none rounded whitespace-nowrap active:scale-[0.98]">
            Stale Files ({staleCount})
          </TabsTrigger>
        </TabsList>

        {/* Unused in tracked files content */}
        <TabsContent value="cleanup" className="mt-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trash2Icon className="size-4 text-amber-500" />
                  Unused in Tracked Files
                </CardTitle>
                <CardDescription className="text-xs">
                  These components were not detected in registered consumer files and are deprecation candidates.
                </CardDescription>
              </div>
              {unusedCount > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleExportCSV} 
                  className="text-xs gap-1.5 h-8 active:scale-[0.97] shrink-0"
                >
                  <DownloadIcon className="size-3.5" /> Export Candidates (CSV)
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {insights && insights.unusedComponents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.unusedComponents.map((comp) => {
                    const parsed = parseFigmaComponentName(comp.componentName, comp.componentSetName);
                    const isDeprecated = comp.status === 'deprecated';
                    return (
                      <div key={comp.id} className="border border-border/80 bg-muted/10 rounded-xl p-4 flex flex-col gap-3 justify-between" title={comp.componentName}>
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-foreground truncate">{parsed.baseName}</h4>
                              <Badge className={`text-[8px] px-1.5 py-0 border ${
                                isDeprecated 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {isDeprecated ? 'High Risk' : 'Medium Risk'}
                              </Badge>
                            </div>
                            {(parsed.formattedProperties || parsed.subLabel) && (
                              <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-0.5">
                                {parsed.formattedProperties || parsed.subLabel}
                              </p>
                            )}
                            <span className="text-[9px] text-muted-foreground/40 font-mono block mt-1">{comp.componentNodeId}</span>
                          </div>
                          <a 
                            href={`https://figma.com/file/${sourceFile?.figmaFileKey || ''}?node-id=${comp.componentNodeId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-sky-500 hover:text-sky-400 font-semibold inline-flex items-center gap-0.5 active:scale-[0.92] shrink-0"
                          >
                            Figma <ExternalLinkIcon className="size-3" />
                          </a>
                        </div>
                        
                        {/* Risk & Recommendation Panel */}
                        <div className="bg-card border border-border/60 rounded-lg p-2.5 mt-1 text-[10px] flex flex-col gap-1.5 font-sans">
                          <p className="font-semibold text-foreground flex items-center gap-1 text-[10px]">
                            <ShieldAlertIcon className="size-3.5 text-amber-500" />
                            {isDeprecated ? 'High Bloat Risk (Deprecated)' : 'Unused Candidate'}
                          </p>
                          <p className="text-muted-foreground leading-normal text-[9px]">
                            {isDeprecated 
                              ? 'This component is marked as deprecated in Figma and has zero instances. Delete from Figma UI Kit to clean up design system bloat.' 
                              : 'Recommended Action: Mark as deprecated in Figma first, then notify design teams. Plan removal in next minor release.'}
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-[10px] border-t border-border/40 pt-2 text-muted-foreground mt-2 font-mono">
                          <span>Set: {comp.componentSetName || 'General'}</span>
                          <span>Location: {comp.pageName || 'Default'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/5 border border-border/40 rounded-lg p-6 gap-1.5">
                  <CheckCircle2Icon className="size-8 text-emerald-500 mb-1 animate-in zoom-in-50 duration-300" />
                  <span className="text-xs font-semibold text-foreground">Zero unused components in tracked files</span>
                  <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                    Every component in your UI Kit is adopted by at least one registered file.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Usage content */}
        <TabsContent value="lowusage" className="mt-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <SparklesIcon className="size-4 text-violet-500" />
                Underutilized Core Components
              </CardTitle>
              <CardDescription className="text-xs">
                These components are used, but very rarely. Check if they can be combined or simplified to reduce system surface.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {insights && insights.lowUsageComponents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.lowUsageComponents.map(({ component, count }) => {
                    const parsed = parseFigmaComponentName(component.componentName, component.componentSetName);
                    return (
                      <div key={component.id} className="border border-border/80 bg-muted/10 rounded-xl p-4 flex flex-col gap-3 justify-between" title={component.componentName}>
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-foreground truncate">{parsed.baseName}</h4>
                              <Badge className="text-[8px] px-1.5 py-0 border bg-violet-500/10 text-violet-400 border-violet-500/20">
                                Low Risk
                              </Badge>
                            </div>
                            {(parsed.formattedProperties || parsed.subLabel) && (
                              <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-0.5">
                                {parsed.formattedProperties || parsed.subLabel}
                              </p>
                            )}
                            <span className="text-[9px] text-muted-foreground/40 font-mono mt-1">Set: {component.componentSetName || 'General'}</span>
                          </div>
                          <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className="text-xs font-mono font-bold text-foreground tabular-nums">{count}</span>
                            <span className="text-[9px] text-muted-foreground">usages</span>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-card border border-border/60 rounded-lg p-2.5 text-[9px] text-muted-foreground flex flex-col gap-1 font-sans">
                          <p className="font-semibold text-foreground flex items-center gap-1 text-[10px]">
                            <ArrowRightIcon className="size-3 text-violet-500" />
                            Underutilization Recommendation
                          </p>
                          <p className="leading-normal">
                            Consider merging this variant with main component sets or removing variant bloat to reduce designer overhead in Figma.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/5 border border-border/40 rounded-lg p-6 gap-1.5">
                  <CheckCircle2Icon className="size-8 text-emerald-500 mb-1 animate-in zoom-in-50 duration-300" />
                  <span className="text-xs font-semibold text-foreground">No low usage components</span>
                  <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                    Every active adopted component meets the design system's adoption threshold metrics.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stale Files content */}
        <TabsContent value="stale" className="mt-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarIcon className="size-4 text-rose-500" />
                Outdated Scan Data Reports
              </CardTitle>
              <CardDescription className="text-xs">
                These files have not been updated recently. Run a manual scan to refresh their component numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {insights && insights.staleFiles.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {insights.staleFiles.map((file) => {
                    const diffDays = file.lastSuccessfulScanAt 
                      ? Math.floor((Date.now() - new Date(file.lastSuccessfulScanAt).getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div key={file.id} className="border border-border/80 bg-muted/10 rounded-xl p-4 flex items-center justify-between hover:bg-muted/20 animate-in fade-in duration-200">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground">{file.name}</h4>
                          <p className="text-[10px] text-rose-400 mt-0.5 flex items-center gap-1">
                            <AlertTriangleIcon className="size-3" /> Last scanned {diffDays} days ago
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleRescanStale}
                          className="text-xs gap-1.5 h-8 active:scale-[0.95]"
                        >
                          <RefreshCwIcon className="size-3" /> Rescan File
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/5 border border-border/40 rounded-lg p-6 gap-1.5">
                  <CheckCircle2Icon className="size-8 text-emerald-500 mb-1 animate-in zoom-in-50 duration-300" />
                  <span className="text-xs font-semibold text-foreground">All files up to date</span>
                  <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                    Every tracked file has been successfully scanned within the freshness threshold.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
