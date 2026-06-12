import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ComponentsPage } from './pages/ComponentsPage';
import { FilesPage } from './pages/FilesPage';
import { ScansPage } from './pages/ScansPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { useConnection, useSourceFile, useConnectFigma, useRegisterSourceFile, useAddRegisteredFile, useStartScan } from './hooks/useTracker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { toast } from 'sonner';
import { 
  KeyIcon, 
  Link2Icon, 
  FilesIcon, 
  PlayCircleIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon,
  InfoIcon
} from 'lucide-react';

const getSavedTab = () => {
  try { return localStorage.getItem('ds_tracker_tab') || 'overview'; } catch { return 'overview'; }
};

const App: React.FC = () => {
  const [tab, setTabState] = useState(getSavedTab);
  const setTab = (t: string) => { setTabState(t); try { localStorage.setItem('ds_tracker_tab', t); } catch { /* ignore */ } };
  const { data: connection, isLoading: isConnLoading } = useConnection();
  const { data: sourceFile, isLoading: isSourceLoading } = useSourceFile();

  // Onboarding wizard states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [pat, setPat] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [consumerUrl, setConsumerUrl] = useState('');
  const [consumerName, setConsumerName] = useState('');

  const { mutate: connectFigma, isPending: isConnecting } = useConnectFigma();
  const { mutate: registerSource, isPending: isRegisteringSource } = useRegisterSourceFile();
  const { mutate: addConsumer, isPending: isAddingConsumer } = useAddRegisteredFile();
  const { mutate: startScan, isPending: isScanning } = useStartScan();

  // Handle OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    const tabParam = params.get('tab');
    if (tabParam === 'settings') setTab('settings');
    if (oauthStatus === 'success') {
      toast.success('Connected with Figma OAuth');
      window.history.replaceState({}, '', '/');
    } else if (oauthStatus === 'error') {
      toast.error('OAuth connection failed. Please try again.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Handle custom programmatic tab switching
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setTab(customEvent.detail);
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  const handleConnectToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat) {
      toast.error('Token is required.');
      return;
    }
    connectFigma({ pat, name: 'Onboarding Connection' }, {
      onSuccess: () => {
        toast.success('Figma Token linked successfully.');
        setOnboardingStep(2);
      },
      onError: (err) => {
        toast.error(`Connection failed: ${(err as Error).message}`);
      }
    });
  };

  const handleRegisterSourceFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !sourceName) {
      toast.error('UI Kit Name and URL are required.');
      return;
    }
    if (!sourceUrl.includes('/file/') && !sourceUrl.includes('/design/')) {
      toast.error('Invalid Figma file link. Expected format: https://www.figma.com/design/KEY/...');
      return;
    }
    registerSource({ url: sourceUrl, name: sourceName }, {
      onSuccess: () => {
        toast.success('Source UI Kit registered.');
        setOnboardingStep(3);
      },
      onError: (err) => {
        toast.error(`Import failed: ${(err as Error).message}`);
      }
    });
  };

  const handleRegisterConsumer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerUrl || !consumerName) {
      toast.error('Consumer File Name and URL are required.');
      return;
    }
    if (!consumerUrl.includes('/file/') && !consumerUrl.includes('/design/')) {
      toast.error('Invalid Figma file link. Expected format: https://www.figma.com/design/KEY/...');
      return;
    }
    addConsumer({ url: consumerUrl, name: consumerName }, {
      onSuccess: () => {
        toast.success('Consumer file registered for tracking.');
        setOnboardingStep(4);
      },
      onError: (err) => {
        toast.error(`Add failed: ${(err as Error).message}`);
      }
    });
  };

  const handleRunInitialScan = () => {
    toast.info('Starting initial crawler job...');
    startScan(undefined, {
      onSuccess: () => {
        toast.success('Initial scan successful! Welcome to the dashboard.');
      }
    });
  };

  const renderActivePage = () => {
    switch (tab) {
      case 'overview':
        return <OverviewPage />;
      case 'components':
        return <ComponentsPage />;
      case 'files':
        return <FilesPage />;
      case 'scans':
        return <ScansPage />;
      case 'insights':
        return <InsightsPage />;
      case 'activity-log':
        return <ActivityLogPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  if (isConnLoading || isSourceLoading) {
    return (
      <div className="dark bg-background text-foreground h-screen w-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 select-none">
          <div className="bg-primary size-10 rounded-xl flex items-center justify-center font-bold tracking-tight text-xl text-primary-foreground shadow-md animate-pulse">
            ∑
          </div>
          <span className="text-xs text-muted-foreground">Loading environment...</span>
        </div>
      </div>
    );
  }

  const isOnboarded = connection?.connected && sourceFile;

  if (!isOnboarded) {
    return (
      <div className="dark bg-background text-foreground h-screen w-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full flex flex-col gap-6 select-none">
          {/* Logo / Onboarding Header */}
          <div className="flex items-center gap-3 justify-center mb-2">
            <div className="bg-primary text-primary-foreground size-8 rounded-lg flex items-center justify-center font-bold tracking-tight text-lg shadow-sm">
              ∑
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground m-0 p-0 leading-none">Design Ops</h1>
              <span className="text-xs text-muted-foreground">First-Time Onboarding</span>
            </div>
          </div>

          {/* Onboarding disclaimer banner */}
          <div className="bg-muted/50 border border-border px-4 py-3 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground leading-normal">
            <InfoIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground/80" />
            <span>
              Usage data is based only on registered consumer files and latest successful scan snapshots, not real-time Figma activity or organization-wide analytics.
            </span>
          </div>

          {/* Onboarding steps progress indicator */}
          <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-muted-foreground">
            <span className={onboardingStep === 1 ? 'text-primary' : ''}>1. Authenticate</span>
            <ArrowRightIcon className="size-3" />
            <span className={onboardingStep === 2 ? 'text-primary' : ''}>2. Source UI Kit</span>
            <ArrowRightIcon className="size-3" />
            <span className={onboardingStep === 3 ? 'text-primary' : ''}>3. Add File</span>
            <ArrowRightIcon className="size-3" />
            <span className={onboardingStep === 4 ? 'text-primary' : ''}>4. Initial Scan</span>
          </div>

          {/* Step 1: Connect token */}
          {onboardingStep === 1 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <KeyIcon className="size-4 text-sky-500" />
                  Connect Figma Account
                </CardTitle>
                <CardDescription className="text-xs">
                  Authorize via OAuth (recommended) or use a Personal Access Token.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button
                  className="w-full text-xs gap-2 h-10"
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/figma/oauth/start`;
                  }}
                >
                  <ShieldCheckIcon className="size-4" />
                  Connect with Figma OAuth
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-[10px]"><span className="bg-card px-2 text-muted-foreground">or use PAT</span></div>
                </div>
                <form onSubmit={handleConnectToken}>
                  <div className="flex flex-col gap-2">
                    <Input id="patInput" type="password" value={pat} onChange={(e) => setPat(e.target.value)} placeholder="fig_pat_..." className="text-xs font-mono" />
                  </div>
                  <CardFooter className="px-0 pb-0 pt-3">
                    <Button type="submit" disabled={isConnecting} className="w-full text-xs active:scale-[0.98]">
                      {isConnecting ? 'Connecting...' : 'Connect via PAT & Next'}
                    </Button>
                  </CardFooter>
              </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Register Source File */}
          {onboardingStep === 2 && (
            <Card className="border-border bg-card animate-in fade-in duration-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Link2Icon className="size-4 text-violet-500" />
                  Register Source UI Kit
                </CardTitle>
                <CardDescription className="text-xs">
                  Register the Figma Library file containing the master component inventory to track.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegisterSourceFile}>
                <CardContent className="flex flex-col gap-4 pb-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sName" className="text-xs text-muted-foreground">UI Kit Library Name</Label>
                    <Input 
                      id="sName"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. Core Design System" 
                      className="text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sUrl" className="text-xs text-muted-foreground">Figma File URL</Label>
                    <Input 
                      id="sUrl"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://www.figma.com/design/KEY/..." 
                      className="text-xs"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" disabled={isRegisteringSource} className="w-full text-xs active:scale-[0.98] mt-2">
                    {isRegisteringSource ? 'Importing Components...' : 'Register Library & Next'}
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => setOnboardingStep(1)}
                    className="text-[10px] text-muted-foreground hover:text-foreground active:scale-[0.95]"
                  >
                    Go Back
                  </button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Step 3: Register First Consumer File */}
          {onboardingStep === 3 && (
            <Card className="border-border bg-card animate-in fade-in duration-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FilesIcon className="size-4 text-emerald-500" />
                  Register First Consumer File
                </CardTitle>
                <CardDescription className="text-xs">
                  Paste the URL of an active design/product file where UI components are adopted.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegisterConsumer}>
                <CardContent className="flex flex-col gap-4 pb-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cName" className="text-xs text-muted-foreground">Consumer File Name</Label>
                    <Input 
                      id="cName"
                      value={consumerName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumerName(e.target.value)}
                      placeholder="e.g. Web Admin Console" 
                      className="text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cUrl" className="text-xs text-muted-foreground">Figma File URL</Label>
                    <Input 
                      id="cUrl"
                      value={consumerUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumerUrl(e.target.value)}
                      placeholder="https://www.figma.com/design/KEY/..." 
                      className="text-xs"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" disabled={isAddingConsumer} className="w-full text-xs active:scale-[0.98] mt-2">
                    {isAddingConsumer ? 'Adding File...' : 'Add File & Next'}
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => setOnboardingStep(2)}
                    className="text-[10px] text-muted-foreground hover:text-foreground active:scale-[0.95]"
                  >
                    Go Back
                  </button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Step 4: Run Initial Scan */}
          {onboardingStep === 4 && (
            <Card className="border-border bg-card animate-in fade-in duration-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PlayCircleIcon className="size-4 text-sky-500" />
                  Run Initial Scan
                </CardTitle>
                <CardDescription className="text-xs">
                  We are ready to fetch and parse the file node trees. Start the local scanner process.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-4 flex items-center gap-3">
                  <ShieldCheckIcon className="size-5 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Configuration Set</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Figma credentials, source UI Kit, and first consumer files have been mapped.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  onClick={handleRunInitialScan}
                  disabled={isScanning}
                  className="w-full text-xs active:scale-[0.98]"
                >
                  {isScanning ? 'Scanning Node Tree...' : 'Start Initial Crawl & Finish'}
                </Button>
                <button 
                  type="button" 
                  onClick={() => setOnboardingStep(3)}
                  className="text-[10px] text-muted-foreground hover:text-foreground active:scale-[0.95]"
                >
                  Go Back
                </button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout currentTab={tab} setTab={setTab}>
      {renderActivePage()}
    </AppLayout>
  );
};

export default App;
