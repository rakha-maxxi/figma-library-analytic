import React from 'react';
import { 
  LayoutGridIcon, 
  LayersIcon, 
  FileTextIcon, 
  RotateCwIcon, 
  LightbulbIcon, 
  SettingsIcon, 
  LinkIcon, 
  InfoIcon,
  PlayIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollTextIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnection, useStartScan, useScanBatches } from '../hooks/useTracker';
import { toast } from 'sonner';

interface AppLayoutProps {
  currentTab: string;
  setTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, setTab, children }) => {
  const { data: connection } = useConnection();
  const { data: batches } = useScanBatches();
  const { mutate: startScan, isPending: isScanning } = useStartScan();

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isScanRunning = batches?.some(b => b.status === 'running') || isScanning;

  const handleScanAll = () => {
    if (isScanRunning) return;
    startScan(undefined, {
      onSuccess: () => {
        toast.success('Sequential scan started successfully.');
      },
      onError: (err) => {
        toast.error(`Scan failed to start: ${(err as Error).message}`);
      }
    });
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGridIcon },
    { id: 'components', label: 'Components', icon: LayersIcon },
    { id: 'files', label: 'Consumer Files', icon: FileTextIcon },
    { id: 'scans', label: 'Scan Jobs', icon: RotateCwIcon, badge: isScanRunning ? 'active' : undefined },
    { id: 'insights', label: 'Insights & Health', icon: LightbulbIcon },
    { id: 'activity-log', label: 'Activity Log', icon: ScrollTextIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="dark flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className={`border-r border-border bg-card flex flex-col justify-between select-none transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className={`flex flex-col gap-6 ${isCollapsed ? 'p-3' : 'p-6'}`}>
          {/* Logo / Header */}
          <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between gap-3'}`}>
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground size-8 rounded-lg flex items-center justify-center font-bold tracking-tight text-lg shadow-sm shrink-0">
                ∑
              </div>
              {!isCollapsed && (
                <div className="animate-in fade-in duration-200">
                  <h1 className="text-sm font-semibold tracking-tight text-foreground m-0 p-0 leading-none">Design Ops</h1>
                  <span className="text-xs text-muted-foreground">Component Tracker</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-md transition-colors active:scale-[0.93] shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              if (isCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex items-center justify-center p-2.5 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                      isActive 
                        ? 'bg-secondary text-secondary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    title={item.label}
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon className="size-4" />
                      {item.badge === 'active' && (
                        <span className="absolute -top-1 -right-1 flex size-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full size-1.5 bg-sky-500"></span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                    isActive 
                      ? 'bg-secondary text-secondary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge === 'active' && (
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-sky-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Connection Status */}
        <div className={`p-4 border-t border-border bg-muted/30 flex flex-col gap-3 transition-all duration-300 ${isCollapsed ? 'items-center p-3' : ''}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div 
                className="relative cursor-pointer flex items-center justify-center" 
                title={connection?.connected ? `Connected as ${connection.userName} (${connection.userEmail})` : 'Figma Connection: Offline'}
              >
                <span className={`block size-2.5 rounded-full ${connection?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              
              {!connection?.connected && (
                <button 
                  onClick={() => setTab('settings')}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center size-8 rounded hover:bg-muted transition-colors active:scale-[0.92]"
                  title="Connect Figma PAT"
                >
                  <LinkIcon className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Figma Connection</span>
                <div className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${connection?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-medium text-foreground">{connection?.connected ? 'Connected' : 'Offline'}</span>
                </div>
              </div>
              
              {connection?.connected && (
                <div className="flex flex-col gap-0.5 max-w-full">
                  <span className="text-xs font-medium text-foreground truncate">{connection.userName}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{connection.userEmail}</span>
                </div>
              )}

              {!connection?.connected && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTab('settings')}
                  className="w-full text-xs gap-1.5"
                >
                  <LinkIcon className="size-3" /> Connect PAT
                </Button>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-8 select-none">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground capitalize m-0">
              {currentTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Button
              size="sm"
              disabled={isScanRunning || !connection?.connected}
              onClick={handleScanAll}
              className="text-xs gap-1.5 active:scale-[0.97] transition-transform"
            >
              <PlayIcon className="size-3 fill-current" />
              {isScanRunning ? 'Scan Running...' : 'Scan All Files'}
            </Button>
          </div>
        </header>

        {/* Boundary disclaimer banner */}
        <div className="bg-muted/50 border-b border-border px-8 py-2 flex items-center gap-2.5 text-xs text-muted-foreground font-normal">
          <InfoIcon className="size-4 shrink-0 text-muted-foreground/80" />
          <span>
            Analytics are based on registered consumer files and latest successful scans.
          </span>
        </div>

        {/* Dynamic page mount */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-8 pb-16">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
