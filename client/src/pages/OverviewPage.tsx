import React, { useState, useCallback } from 'react';
import { useDashboardLayout, useSaveDashboardLayout, useResetDashboardLayout } from '../hooks/useDashboard';
import { getWidgetComponent, getWidgetDef } from '../lib/widget-registry';
import { CustomizeSheet } from '../components/dashboard/CustomizeSheet';
import { Button } from '../components/ui/button';
import { Settings2Icon, AlertCircleIcon, PlusCircleIcon, PlayIcon, FileTextIcon, RefreshCwIcon } from 'lucide-react';
import type { WidgetLayoutItem } from '../lib/dashboard-types';
import { toast } from 'sonner';
import '../lib/init-widgets';
import { useRegisteredFiles, useScanBatches, useStartScan } from '../hooks/useTracker';
import { Card } from '../components/ui/card';

const WidgetErrorBoundary: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <div className="border border-border bg-card rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground gap-1">
        <AlertCircleIcon className="size-8 text-rose-500/30 mb-1" />
        <p className="text-xs font-semibold text-foreground/60">Widget error</p>
        <p className="text-[10px]">{title} failed to load.</p>
      </div>
    );
  }
  try {
    return <React.Fragment>{children}</React.Fragment>;
  } catch {
    setHasError(true);
    return null;
  }
};

export const OverviewPage: React.FC = () => {
  const { data: layout, isLoading: isLayoutLoading } = useDashboardLayout();
  const { mutate: saveLayout, isPending: isSaving } = useSaveDashboardLayout();
  const { mutate: resetLayout } = useResetDashboardLayout();
  const [showCustomize, setShowCustomize] = useState(false);
  const [localLayout, setLocalLayout] = useState<WidgetLayoutItem[] | null>(null);

  const { data: files, isLoading: isFilesLoading } = useRegisteredFiles();
  const { data: batches, isLoading: isBatchesLoading } = useScanBatches();
  const { mutate: startScan, isPending: isScanning } = useStartScan();

  const activeLayout = (localLayout || layout || []).filter(l => l.visible).sort((a, b) => a.order - b.order);

  const handleOpenCustomize = useCallback(() => {
    setLocalLayout(JSON.parse(JSON.stringify(layout || [])));
    setShowCustomize(true);
  }, [layout]);

  const handleCloseCustomize = useCallback(() => {
    setShowCustomize(false);
    setLocalLayout(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!localLayout) return;
    saveLayout(localLayout, {
      onSuccess: () => {
        setLocalLayout(null);
        setShowCustomize(false);
        toast.success('Dashboard layout saved.');
      },
      onError: (err) => {
        toast.error(`Failed to save: ${(err as Error).message}`);
      },
    });
  }, [localLayout, saveLayout]);

  const handleReset = useCallback(() => {
    resetLayout(undefined, {
      onSuccess: (data) => {
        setLocalLayout(data);
        toast.success('Layout reset to default.');
      },
    });
  }, [resetLayout]);

  const handleRunFirstScan = useCallback(() => {
    startScan(undefined, {
      onSuccess: () => {
        toast.success('Initial scan started successfully.');
      },
      onError: (err) => {
        toast.error(`Scan failed: ${(err as Error).message}`);
      }
    });
  }, [startScan]);

  const isLoading = isLayoutLoading || isFilesLoading || isBatchesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground select-none">
        <RefreshCwIcon className="size-4 animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Overview</h2>
        <p className="text-xs text-muted-foreground">
          Usage is based on registered consumer files and latest successful scans.
        </p>
      </div>
      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleOpenCustomize}>
        <Settings2Icon className="size-3.5" /> Customize Dashboard
      </Button>
    </div>
  );

  const hasFiles = files && files.length > 0;
  const hasScans = batches && batches.length > 0;

  if (!hasFiles) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {renderHeader()}
        <Card className="border border-border bg-card/40 backdrop-blur-sm p-8 flex flex-col items-center text-center max-w-md mx-auto gap-4 mt-8">
          <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20">
            <FileTextIcon className="size-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Track Component Usage</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Register your Figma design files (consumer files) to track component usage and monitor design system adoption.
            </p>
          </div>
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'files' }))} 
            className="text-xs gap-1.5 active:scale-[0.97] transition-all"
          >
            <PlusCircleIcon className="size-4" /> Add Consumer File
          </Button>
        </Card>
      </div>
    );
  }

  if (!hasScans) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {renderHeader()}
        <Card className="border border-border bg-card/40 backdrop-blur-sm p-8 flex flex-col items-center text-center max-w-md mx-auto gap-4 mt-8">
          <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20">
            <PlayIcon className="size-8 fill-current text-primary ml-1 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Run Your First Scan</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              You have registered files, but no scan has run yet. Start the crawler to fetch and parse component instances from Figma.
            </p>
          </div>
          <Button 
            onClick={handleRunFirstScan} 
            disabled={isScanning}
            className="text-xs gap-1.5 active:scale-[0.97] transition-all"
          >
            <RefreshCwIcon className={`size-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Figma Nodes...' : 'Start Initial Crawl'}
          </Button>
        </Card>
      </div>
    );
  }

  // Segment widgets for the Command Center layout
  const summaryItem = activeLayout.find(item => item.widgetId === 'summary_metrics');
  const sidebarItems = activeLayout.filter(
    item => item.widgetId === 'next_actions' || 
            item.widgetId === 'scan_reliability' || 
            item.widgetId === 'failed_scans' || 
            item.widgetId === 'stale_files'
  );
  const mainItems = activeLayout.filter(
    item => item.widgetId !== 'summary_metrics' && !sidebarItems.some(si => si.widgetId === item.widgetId)
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {renderHeader()}

      {/* 1. Top Summary metrics card (full width) */}
      {summaryItem && (
        <div className="w-full">
          {(() => {
            const WidgetComponent = getWidgetComponent(summaryItem.widgetId);
            const def = getWidgetDef(summaryItem.widgetId);
            if (!WidgetComponent) return null;
            return (
              <WidgetErrorBoundary key={summaryItem.widgetId} title={def?.title || summaryItem.widgetId}>
                <WidgetComponent layout={summaryItem} />
              </WidgetErrorBoundary>
            );
          })()}
        </div>
      )}

      {/* 2. Main content area (split screen: Left for main indicators, Right for sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3 width) - Main widgets */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-min">
          {mainItems.map(item => {
            const WidgetComponent = getWidgetComponent(item.widgetId);
            const def = getWidgetDef(item.widgetId);
            if (!WidgetComponent) return null;
            return (
              <WidgetErrorBoundary key={item.widgetId} title={def?.title || item.widgetId}>
                <WidgetComponent layout={item} />
              </WidgetErrorBoundary>
            );
          })}
          {mainItems.length === 0 && (
            <div className="col-span-6 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1.5">
              No main widgets visible. Click "Customize Dashboard" to configure.
            </div>
          )}
        </div>

        {/* Right Column (1/3 width) - Sidebar widgets */}
        <div className="flex flex-col gap-4">
          {sidebarItems.map(item => {
            const WidgetComponent = getWidgetComponent(item.widgetId);
            const def = getWidgetDef(item.widgetId);
            if (!WidgetComponent) return null;
            // Force sidebar widgets to full-width relative to the sidebar container
            const sidebarLayout = { ...item, size: 'full' as const };
            return (
              <WidgetErrorBoundary key={item.widgetId} title={def?.title || item.widgetId}>
                <WidgetComponent layout={sidebarLayout} />
              </WidgetErrorBoundary>
            );
          })}
        </div>
      </div>

      {activeLayout.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Settings2Icon className="size-10 opacity-20" />
          <p className="text-sm font-semibold text-foreground/60">No widgets configured</p>
          <p className="text-xs">Click "Customize Dashboard" to add widgets to your overview.</p>
          <Button size="sm" variant="outline" className="text-xs mt-2" onClick={handleOpenCustomize}>
            <Settings2Icon className="size-3.5 mr-1" /> Customize Dashboard
          </Button>
        </div>
      )}

      <CustomizeSheet
        open={showCustomize}
        onClose={handleCloseCustomize}
        layout={localLayout || []}
        onLayoutChange={setLocalLayout}
        onReset={handleReset}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};
