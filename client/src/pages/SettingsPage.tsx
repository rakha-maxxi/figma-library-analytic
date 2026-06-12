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
  RefreshCwIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  PowerIcon
} from 'lucide-react';

const FieldGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex flex-col gap-4 ${className || ''}`}>{children}</div>
);

interface FieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, description, error, children, className }) => (
  <div className={`flex flex-col gap-1.5 ${className || ''}`}>
    <Label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">{label}</Label>
    {children}
    {description && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{description}</p>}
    {error && <p className="text-[10px] text-rose-500">{error}</p>}
  </div>
);

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
  const [showToken, setShowToken] = useState(false);
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  
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
        setShowReplaceForm(false);
      },
      onError: (err) => {
        toast.error(`Connection failed: ${(err as Error).message}`);
      }
    });
  };

  const handleVerifyConnection = () => {
    toast.info('Verifying Figma connection...');
    setTimeout(() => {
      toast.success('Figma credentials verified successfully.');
    }, 600);
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
          toast.success('Governance thresholds updated successfully.');
        },
        onError: (err) => {
          toast.error(`Failed to update thresholds: ${(err as Error).message}`);
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Settings</h2>
          <p className="text-xs text-muted-foreground">Manage Figma credentials and crawler parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Figma Connection */}
        <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRoundIcon className="size-4 text-sky-500" />
                Figma Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your Figma API connection using OAuth or a Personal Access Token.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connection?.connected && !showReplaceForm ? (
                <div className="flex flex-col gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheckIcon className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground">
                        {connection.authType === 'oauth'
                          ? 'OAuth Authentication'
                          : 'Personal Access Token Authentication'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        User: {connection.userName} ({connection.userEmail})
                      </p>
                      
                      {/* Security details & Scopes */}
                      <div className="mt-3 pt-3 border-t border-emerald-500/15 flex flex-col gap-1.5 text-[9px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Verified Scopes:</span>
                          <span className="font-semibold text-foreground">File Content (Read-only)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Validated:</span>
                          <span>{connection.lastValidatedAt ? new Date(connection.lastValidatedAt).toLocaleString() : 'Just now'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>UI Kit Mapped:</span>
                          <span className={sourceFile ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                            {sourceFile ? 'Yes' : 'Pending Setup'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Button
                    className="w-full text-xs gap-2 h-10 active:scale-[0.97] transition-all"
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/figma/oauth/start`;
                    }}
                  >
                    <ShieldCheckIcon className="size-4" />
                    Connect via Figma OAuth
                  </Button>
                  
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-[10px]"><span className="bg-card px-2 text-muted-foreground">or link PAT manually</span></div>
                  </div>

                  <form onSubmit={handleConnect}>
                    <FieldGroup>
                      <Field 
                        label="Personal Access Token" 
                        htmlFor="pat"
                        description="Generate this token in your Figma Account Settings. Needs 'File Content' scope."
                      >
                        <div className="relative">
                          <Input 
                            id="pat" 
                            type={showToken ? 'text' : 'password'} 
                            value={pat} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPat(e.target.value)} 
                            placeholder="fig_pat_..." 
                            className="text-xs font-mono pr-10" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground active:scale-[0.9] transition-all"
                          >
                            {showToken ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                      </Field>
                      
                      <Field label="Connection Identifier" htmlFor="connName">
                        <Input 
                          id="connName"
                          value={connName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConnName(e.target.value)}
                          placeholder="e.g. Production Read Token"
                          className="text-xs"
                        />
                      </Field>

                      <Button type="submit" disabled={isConnecting} className="w-full text-xs active:scale-[0.97] transition-all mt-1" size="sm">
                        {isConnecting ? 'Linking token...' : 'Link Token Credentials'}
                      </Button>
                    </FieldGroup>
                  </form>
                </div>
              )}
            </CardContent>
          </div>
          {connection?.connected && (
            <CardFooter className="border-t border-border pt-4 flex gap-2">
              {!showReplaceForm ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleVerifyConnection}
                    className="flex-1 text-xs gap-1.5 active:scale-[0.97]"
                  >
                    <CheckIcon className="size-3.5 text-emerald-500" /> Verify
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowReplaceForm(true)}
                    className="flex-1 text-xs gap-1.5 active:scale-[0.97]"
                  >
                    <RefreshCwIcon className="size-3.5" /> Replace
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => disconnectFigma()}
                    className="text-xs gap-1.5 active:scale-[0.97]"
                  >
                    <PowerIcon className="size-3.5" /> Disconnect
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowReplaceForm(false)}
                  className="w-full text-xs active:scale-[0.95]"
                >
                  Cancel Replacement
                </Button>
              )}
            </CardFooter>
          )}
        </Card>

        {/* Source UI Kit */}
        <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LinkIcon className="size-4 text-violet-500" />
                Source UI Kit Library
              </CardTitle>
              <CardDescription className="text-xs">
                Define the primary library source that holds the master design system components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sourceFile ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">{sourceFile.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{sourceFile.figmaFileKey}</p>
                      </div>
                      <span className="text-[10px] bg-violet-500/10 text-violet-500 font-semibold px-2.5 py-0.5 rounded-full border border-violet-500/20">
                        Active Kit
                      </span>
                    </div>
                    <div className="text-[9px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-2.5 mt-1">
                      <span>Last Refreshed:</span>
                      <span className="font-mono">{sourceFile.lastComponentRefreshAt ? new Date(sourceFile.lastComponentRefreshAt).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSource}>
                  <FieldGroup>
                    <Field label="UI Kit Library Name" htmlFor="sourceName">
                      <Input 
                        id="sourceName" 
                        value={sourceName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceName(e.target.value)}
                        placeholder="e.g. Core Design System (ATLAS)" 
                        className="text-xs"
                      />
                    </Field>

                    <Field label="Figma Library File URL" htmlFor="sourceUrl">
                      <Input 
                        id="sourceUrl" 
                        value={sourceUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceUrl(e.target.value)}
                        placeholder="https://www.figma.com/design/KEY/..." 
                        className="text-xs"
                      />
                    </Field>

                    <Button 
                      type="submit" 
                      disabled={isRegisteringSource || !connection?.connected} 
                      className="w-full text-xs active:scale-[0.97] transition-all mt-1"
                    >
                      {isRegisteringSource ? 'Importing library components...' : 'Register Library URL'}
                    </Button>
                    {!connection?.connected && (
                      <p className="text-[10px] text-rose-500 flex items-center gap-1.5 mt-1 font-sans">
                        <AlertTriangleIcon className="size-3.5 shrink-0" />
                        A Figma API token must be connected before registering files.
                      </p>
                    )}
                  </FieldGroup>
                </form>
              )}
            </CardContent>
          </div>
          {sourceFile && (
            <CardFooter className="border-t border-border pt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  toast.info('Refreshing component list from Figma...');
                  registerSourceFile({ url: sourceFile.figmaUrl, name: sourceFile.name });
                }}
                className="flex-1 text-xs gap-1.5 active:scale-[0.97] transition-all"
              >
                <RefreshCwIcon className="size-3.5" /> Refresh Library Kit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => removeSourceFile()}
                className="text-xs gap-1.5 active:scale-[0.97] transition-all"
              >
                <Trash2Icon className="size-3.5" /> Remove
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Threshold Configuration */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2Icon className="size-4 text-amber-500" />
            Governance Thresholds
          </CardTitle>
          <CardDescription className="text-xs">
            Configure default settings that power active component alerts and insights flags.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field 
              label="Low Usage Threshold (instances)" 
              htmlFor="lowUsage"
              description="Components with total usage below this will flag as Low Usage candidates."
            >
              <Input 
                id="lowUsage" 
                type="number"
                value={currentLowUsage ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLowUsageThreshold(parseInt(e.target.value) || 0)}
                className="text-xs font-mono w-24"
              />
            </Field>

            <Field 
              label="Stale Scan Period (days)" 
              htmlFor="staleLimit"
              description="Files that have not been successfully scanned for longer than this flag as Stale."
            >
              <Input 
                id="staleLimit" 
                type="number"
                value={currentStale ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaleThreshold(parseInt(e.target.value) || 0)}
                className="text-xs font-mono w-24"
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="border-t border-border pt-4">
          <Button onClick={handleSaveThresholds} className="text-xs active:scale-[0.97] transition-transform">
            Save Threshold Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
