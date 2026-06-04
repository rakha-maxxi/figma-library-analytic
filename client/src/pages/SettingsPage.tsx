import React, { useState } from 'react';
import { 
  useConnection, 
  useConnectFigma, 
  useDisconnectFigma,
  useSourceFile,
  useRegisterSourceFile,
  useRemoveSourceFile,
  useAppSettings,
  useUpdateAppSettings
} from '../hooks/useTracker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  KeyRoundIcon, 
  LinkIcon, 
  ShieldCheckIcon, 
  Settings2Icon, 
  AlertTriangleIcon,
  Trash2Icon,
  RefreshCwIcon
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { data: connection } = useConnection();
  const { mutate: connectFigma, isPending: isConnecting } = useConnectFigma();
  const { mutate: disconnectFigma } = useDisconnectFigma();

  const { data: sourceFile } = useSourceFile();
  const { mutate: registerSourceFile, isPending: isRegisteringSource } = useRegisterSourceFile();
  const { mutate: removeSourceFile } = useRemoveSourceFile();

  const { data: appSettings } = useAppSettings();
  const { mutate: updateAppSettings } = useUpdateAppSettings();

  const [pat, setPat] = useState('');
  const [connName, setConnName] = useState('Default Figma Connection');
  
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');

  const [lowUsageThreshold, setLowUsageThreshold] = useState<number | undefined>(undefined);
  const [staleThreshold, setStaleThreshold] = useState<number | undefined>(undefined);

  const currentLowUsage = lowUsageThreshold !== undefined ? lowUsageThreshold : (appSettings?.lowUsageInstanceThreshold ?? 5);
  const currentStale = staleThreshold !== undefined ? staleThreshold : (appSettings?.staleFileDaysThreshold ?? 14);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat) {
      toast.error('Personal Access Token is required.');
      return;
    }
    connectFigma({ pat, name: connName }, {
      onSuccess: () => {
        toast.success('Figma Personal Access Token connected.');
        setPat('');
      },
      onError: (err) => {
        toast.error(`Connection failed: ${(err as Error).message}`);
      }
    });
  };

  const handleRegisterSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !sourceName) {
      toast.error('Source URL and UI Kit Name are required.');
      return;
    }
    if (!sourceUrl.includes('/file/') && !sourceUrl.includes('/design/')) {
      toast.error('Invalid Figma file link. Expected format: https://www.figma.com/design/KEY/...');
      return;
    }
    registerSourceFile({ url: sourceUrl, name: sourceName }, {
      onSuccess: () => {
        toast.success('Source UI Kit registered and components imported.');
        setSourceUrl('');
        setSourceName('');
      },
      onError: (err) => {
        toast.error(`Registration failed: ${(err as Error).message}`);
      }
    });
  };

  const handleSaveThresholds = () => {
    updateAppSettings(
      {
        lowUsageInstanceThreshold: currentLowUsage,
        staleFileDaysThreshold: currentStale,
      },
      {
        onSuccess: () => {
          toast.success('Governance threshold values updated successfully.');
        },
        onError: (err) => {
          toast.error(`Failed to update thresholds: ${(err as Error).message}`);
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Settings</h2>
          <p className="text-xs text-muted-foreground">Manage Figma credentials and crawler parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Figma Connection */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <KeyRoundIcon className="size-4 text-sky-500" />
              Figma Personal Access Token
            </CardTitle>
            <CardDescription className="text-xs">
              Establish connection using a secure personal access token. The token is never exposed to the client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connection?.connected ? (
              <div className="flex flex-col gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-4 flex items-center gap-3">
                  <ShieldCheckIcon className="size-5 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Secure Connection Active</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Authenticated as {connection.userName} ({connection.userEmail})
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Connection Display Name</span>
                  <span className="text-xs font-medium text-foreground">{connection.name}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="flex flex-col gap-4 pb-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="connName" className="text-xs text-muted-foreground">Connection Name</Label>
                  <Input 
                    id="connName" 
                    value={connName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConnName(e.target.value)}
                    placeholder="e.g. Default Connection" 
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="pat" className="text-xs text-muted-foreground">Personal Access Token (PAT)</Label>
                  <Input 
                    id="pat" 
                    type="password"
                    value={pat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPat(e.target.value)}
                    placeholder="fig_pat_..." 
                    className="text-xs"
                  />
                </div>
                
                <Button type="submit" disabled={isConnecting} className="w-full text-xs active:scale-[0.98] mt-2">
                  {isConnecting ? 'Connecting...' : 'Connect Token'}
                </Button>
              </form>
            )}
          </CardContent>
          {connection?.connected && (
            <CardFooter className="border-t border-border pt-4">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => disconnectFigma()}
                className="w-full text-xs gap-1.5 active:scale-[0.98]"
              >
                Disconnect Token
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Source UI Kit */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <LinkIcon className="size-4 text-violet-500" />
              Source Design System UI Kit
            </CardTitle>
            <CardDescription className="text-xs">
              Register the primary Figma library file containing the components you wish to track.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sourceFile ? (
              <div className="flex flex-col gap-4">
                <div className="border border-border rounded-md p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{sourceFile.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{sourceFile.figmaFileKey}</p>
                    </div>
                    <span className="text-[10px] bg-violet-500/10 text-violet-500 font-medium px-2 py-0.5 rounded-full border border-violet-500/20">
                      Active Kit
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>Last refreshed inventory:</span>
                    <span>{sourceFile.lastComponentRefreshAt ? new Date(sourceFile.lastComponentRefreshAt).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSource} className="flex flex-col gap-4 pb-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sourceName" className="text-xs text-muted-foreground">UI Kit Name</Label>
                  <Input 
                    id="sourceName" 
                    value={sourceName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceName(e.target.value)}
                    placeholder="e.g. Core UI Library" 
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="sourceUrl" className="text-xs text-muted-foreground">Figma File Link</Label>
                  <Input 
                    id="sourceUrl" 
                    value={sourceUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceUrl(e.target.value)}
                    placeholder="https://www.figma.com/design/KEY/..." 
                    className="text-xs"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isRegisteringSource || !connection?.connected} 
                  className="w-full text-xs active:scale-[0.98] mt-2"
                >
                  {isRegisteringSource ? 'Importing Components...' : 'Register UI Kit'}
                </Button>
                {!connection?.connected && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertTriangleIcon className="size-3 shrink-0" />
                    Must connect Figma token before registering files.
                  </p>
                )}
              </form>
            )}
          </CardContent>
          {sourceFile && (
            <CardFooter className="border-t border-border pt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  toast.info('Refreshing component list from Figma...');
                  registerSourceFile({ url: sourceFile.figmaUrl, name: sourceFile.name });
                }}
                className="flex-1 text-xs gap-1.5 active:scale-[0.98]"
              >
                <RefreshCwIcon className="size-3" /> Refresh List
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => removeSourceFile()}
                className="text-xs gap-1.5 active:scale-[0.98]"
              >
                <Trash2Icon className="size-3" /> Remove
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Threshold Configuration */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2Icon className="size-4 text-amber-500" />
            Governance Thresholds
          </CardTitle>
          <CardDescription className="text-xs">
            Configure default settings that power active component alerts and insights flags.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lowUsage" className="text-xs text-muted-foreground">Low Usage Threshold (instances)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="lowUsage" 
                type="number"
                value={currentLowUsage ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLowUsageThreshold(parseInt(e.target.value) || 0)}
                className="text-xs font-mono w-24"
              />
              <span className="text-xs text-muted-foreground">Components with total usage below this will flag as Low Usage candidates.</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="staleLimit" className="text-xs text-muted-foreground">Stale Scan Period (days)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="staleLimit" 
                type="number"
                value={currentStale ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaleThreshold(parseInt(e.target.value) || 0)}
                className="text-xs font-mono w-24"
              />
              <span className="text-xs text-muted-foreground">Files that have not been successfully scanned for longer than this flag as Stale.</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-4">
          <Button onClick={handleSaveThresholds} className="text-xs active:scale-[0.98] transition-transform">
            Save Threshold Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
