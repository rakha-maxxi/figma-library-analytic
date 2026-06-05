import React, { useState, useCallback } from 'react';
import { useDashboardLayout, useSaveDashboardLayout, useResetDashboardLayout } from '../hooks/useDashboard';
import { getWidgetComponent, getWidgetDef } from '../lib/widget-registry';
import { CustomizeSheet } from '../components/dashboard/CustomizeSheet';
import { Button } from '../components/ui/button';
import { Settings2Icon, AlertCircleIcon } from 'lucide-react';
import type { WidgetLayoutItem } from '../lib/dashboard-types';
import { toast } from 'sonner';
import '../lib/init-widgets';

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
  const { data: layout, isLoading } = useDashboardLayout();
  const { mutate: saveLayout, isPending: isSaving } = useSaveDashboardLayout();
  const { mutate: resetLayout } = useResetDashboardLayout();
  const [showCustomize, setShowCustomize] = useState(false);
  const [localLayout, setLocalLayout] = useState<WidgetLayoutItem[] | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">Loading dashboard...</div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-min">
        {activeLayout.map(item => {
          const WidgetComponent = getWidgetComponent(item.widgetId);
          const def = getWidgetDef(item.widgetId);
          if (!WidgetComponent) return null;
          return (
            <WidgetErrorBoundary key={item.widgetId} title={def?.title || item.widgetId}>
              <WidgetComponent layout={item} />
            </WidgetErrorBoundary>
          );
        })}
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
