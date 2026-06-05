import React, { useState, useMemo } from 'react';
import {
  useRegisteredFiles,
  useAddRegisteredFile,
  useRemoveRegisteredFile,
  useToggleFileTracking,
  useFileDetail,
  useScanSingleFile,
  useConnection,
  useComponentDetail,
  useScanJobs,
  useFileInstances,
} from '../hooks/useTracker';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  LayersIcon,
  FileSpreadsheetIcon,
  LineChartIcon,
  CalendarIcon,
  ExternalLinkIcon,
  SearchIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  EyeIcon,
  InfoIcon,
  ClockIcon,
} from 'lucide-react';
import { parseFigmaComponentName } from '../lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const fileStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy':
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Healthy</Badge>;
    case 'zero_usage':
      return <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Zero Usage</Badge>;
    case 'failed':
      return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">Failed</Badge>;
    case 'stale':
      return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px]">Stale</Badge>;
    case 'disabled':
      return <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Disabled</Badge>;
    default:
      return <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">Not Scanned</Badge>;
  }
};

export const FilesPage: React.FC = () => {
  const { data: connection } = useConnection();
  const { data: files } = useRegisteredFiles();
  const { mutate: addFile, isPending: isAdding } = useAddRegisteredFile();
  const { mutate: removeFile } = useRemoveRegisteredFile();
  const { mutate: toggleTracking } = useToggleFileTracking();
  const { mutate: scanSingleFile } = useScanSingleFile();

  const [search, setSearch] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [showComponentSheet, setShowComponentSheet] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [scannedFileId, setScannedFileId] = useState<string | null>(null);

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  const { data: fileDetail, isLoading: isDetailLoading } = useFileDetail(selectedFileId);
  const { data: scanJobs } = useScanJobs();
  const { data: componentDetail } = useComponentDetail(selectedCompId);
  const { data: fileInstances } = useFileInstances(selectedFileId);

  const activeScanFileIds = useMemo(() => {
    if (!scanJobs) return new Set<string>();
    return new Set(
      scanJobs
        .filter(j => j.status === 'running' || j.status === 'pending')
        .map(j => j.registeredFileId)
    );
  }, [scanJobs]);

  const scanQueueOrder = useMemo(() => {
    if (!scanJobs) return new Map<string, number>();
    const active = scanJobs
      .filter(j => j.status === 'running' || j.status === 'pending')
      .sort((a, b) => {
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (b.status === 'running' && a.status !== 'running') return 1;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
    return new Map(active.map((j, i) => [j.registeredFileId, i + 1]));
  }, [scanJobs]);

  const currentScanJob = useMemo(() => {
    if (!selectedFileId || !scanJobs) return null;
    return scanJobs.find(j => j.registeredFileId === selectedFileId && (j.status === 'running' || j.status === 'pending'));
  }, [selectedFileId, scanJobs]);

  const fileScanHistory = useMemo(() => {
    if (!selectedFileId || !scanJobs) return [];
    return scanJobs
      .filter(j => j.registeredFileId === selectedFileId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 20);
  }, [selectedFileId, scanJobs]);

  const filteredFiles = useMemo(() => {
    if (!files) return [];
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.figmaFileKey.toLowerCase().includes(q)
    );
  }, [files, search]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newName) {
      toast.error('File name and URL are required.');
      return;
    }
    if (!newUrl.includes('/file/') && !newUrl.includes('/design/')) {
      toast.error('Invalid Figma file link.');
      return;
    }
    addFile({ url: newUrl, name: newName }, {
      onSuccess: (data: unknown) => {
        toast.success('File registered for tracking.');
        setNewUrl('');
        setNewName('');
        setShowRegisterSheet(false);
        const added = (data as { id: string })?.id;
        if (added) setSelectedFileId(added);
      },
      onError: (err: unknown) => {
        toast.error(`Add failed: ${(err as Error).message}`);
      }
    });
  };

  const handleScanFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connection?.connected) {
      toast.error('Figma token not connected.');
      return;
    }
    if (!selectedFileId) return;
    setScannedFileId(selectedFileId);
    scanSingleFile(selectedFileId, {
      onSuccess: () => toast.success('File scan queued.'),
      onError: (err: unknown) => toast.error(`Scan failed: ${(err as Error).message}`),
      onSettled: () => setScannedFileId(null),
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this file? All usage history will be permanently deleted.')) {
      removeFile(id, {
        onSuccess: () => {
          if (selectedFileId === id) setSelectedFileId(null);
          toast.success('File removed.');
        }
      });
    }
  };

  const openComponent = (compId: string) => {
    setSelectedCompId(compId);
    setShowComponentSheet(true);
  };

  const lastJob = fileScanHistory[0];
  const isUnscanned = fileDetail?.file.status === 'not_scanned';
  const isFailed = fileDetail?.file.status === 'failed';

  return (
    <div className="flex gap-0 -mx-8 -my-8 h-[calc(100%+4rem)]">
      {/* Middle Panel — File List */}
      <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col h-full">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Files</h3>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => setShowRegisterSheet(true)}>
              <PlusIcon className="size-3.5" /> Register
            </Button>
          </div>
          <div className="relative">
            <SearchIcon className="size-3.5 text-muted-foreground absolute left-2.5 top-2" />
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="text-xs pl-7 h-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground gap-2">
              <span className="text-xs">{files && files.length > 0 ? 'No matching files' : 'No registered files'}</span>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowRegisterSheet(true)}>
                <PlusIcon className="size-3" /> Register First File
              </Button>
            </div>
          ) : (
            filteredFiles.map(file => (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`px-4 py-3 cursor-pointer border-b border-border/50 transition-colors group ${
                  selectedFileId === file.id
                    ? 'bg-secondary/60 border-l-2 border-l-primary'
                    : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{file.figmaFileKey}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDelete(file.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 p-0.5 rounded active:scale-90 transition-all"
                      title="Remove"
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {activeScanFileIds.has(file.id) ? (
                    <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] animate-pulse">
                      {scannedFileId === file.id ? 'Scanning...' : `#${scanQueueOrder.get(file.id) || '?'} Queued`}
                    </Badge>
                  ) : file.status === 'failed' ? (
                    <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">Failed</Badge>
                  ) : file.status === 'healthy' ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Healthy</Badge>
                  ) : file.status === 'zero_usage' ? (
                    <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Zero Usage</Badge>
                  ) : file.status === 'stale' ? (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px]">Stale</Badge>
                  ) : (
                    <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">Not Scanned</Badge>
                  )}
                  {file.trackingEnabled && !activeScanFileIds.has(file.id) ? (
                    <span className="text-[10px] text-muted-foreground">
                      {file.totalInstances > 0 ? `${file.totalInstances} inst · ${file.uniqueComponentsUsed} comps` : ''}
                    </span>
                  ) : !file.trackingEnabled ? (
                    <span className="text-[10px] text-muted-foreground italic">Paused</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel — File Detail */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedFileId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3 max-w-xs text-center">
              <div className="bg-muted p-4 rounded-full">
                <FileSpreadsheetIcon className="size-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/60">Select a file</p>
                <p className="text-xs text-muted-foreground mt-1">Choose a registered file from the list to view its scan results and component usage.</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowRegisterSheet(true)}>
                <PlusIcon className="size-3.5" /> Register a file
              </Button>
            </div>
          </div>
        ) : isDetailLoading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">Loading file details...</div>
        ) : !fileDetail ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">File not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {/* File Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">{fileDetail.file.name}</h2>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{fileDetail.file.figmaFileKey}</p>
                <div className="flex items-center gap-2 mt-2">
                  {fileStatusBadge(fileDetail.file.status)}
                  {fileDetail.file.trackingEnabled ? null : (
                    <Badge className="bg-muted text-muted-foreground text-[10px]">Paused</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleScanFile}
                  disabled={!fileDetail.file.trackingEnabled}
                  className="text-xs h-8 gap-1.5"
                >
                  <RefreshCwIcon className="size-3.5" /> Scan File
                </Button>
                {!fileDetail.file.trackingEnabled && (
                  <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => toggleTracking(fileDetail.file.id)}>
                    Resume Tracking
                  </Button>
                )}
              </div>
            </div>

            {/* Scan in progress banner */}
            {currentScanJob && (
              <div className="border border-sky-500/20 bg-sky-500/5 rounded-lg p-4 mb-6 flex items-start gap-3">
                <div className="relative flex size-5 items-center justify-center shrink-0 mt-0.5">
                  <RefreshCwIcon className="size-4 text-sky-400 animate-spin" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sky-400">Scan in progress</p>
                  <p className="text-[11px] text-sky-400/80 mt-0.5">
                    {currentScanJob.status === 'pending'
                      ? 'Queued — waiting to start...'
                      : 'Scanning file — detecting component instances...'}
                  </p>
                  {fileDetail.file.lastSuccessfulScanAt && (
                    <p className="text-[10px] text-sky-400/60 mt-1">
                      Previous scan data shown below. Results will update when complete.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Direct Instances</p>
                <p className="text-lg font-bold font-mono text-foreground tabular-nums">{fileDetail.file.totalInstances}</p>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Unique Components</p>
                <p className="text-lg font-bold font-mono text-foreground tabular-nums">{fileDetail.file.uniqueComponentsUsed}</p>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Last Scan</p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {fileDetail.file.lastSuccessfulScanAt
                    ? new Date(fileDetail.file.lastSuccessfulScanAt).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Scan Duration</p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {lastJob?.durationMs ? `${(lastJob.durationMs / 1000).toFixed(1)}s` : '—'}
                </p>
              </div>
            </div>

            {/* Failure message */}
            {isFailed && lastJob?.errorMessage && (
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangleIcon className="size-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-rose-400">Last scan failed</p>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">{lastJob.errorMessage}</p>
                  {lastJob.errorCode && <p className="text-[10px] text-rose-400/60 font-mono mt-0.5">Code: {lastJob.errorCode}</p>}
                </div>
              </div>
            )}

            {/* Unscanned prompt */}
            {isUnscanned && (
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-6 mb-6 flex flex-col items-center text-center gap-3">
                <div className="bg-amber-500/10 p-3 rounded-full">
                  <InfoIcon className="size-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">File not yet scanned</p>
                  <p className="text-xs text-muted-foreground mt-1">Scan this file to detect design system component instances.</p>
                </div>
                <Button size="sm" onClick={handleScanFile} className="text-xs gap-1.5">
                  <RefreshCwIcon className="size-3.5" /> Scan This File
                </Button>
              </div>
            )}

            {/* Tabs */}
            {!isUnscanned && (
              <Tabs defaultValue="components" className="flex-1 flex flex-col">
                <TabsList className="flex bg-muted text-muted-foreground p-1 rounded-md">
                  <TabsTrigger value="components" className="text-xs font-semibold px-4 py-1.5 rounded whitespace-nowrap">
                    Components Used
                  </TabsTrigger>
                  <TabsTrigger value="instances" className="text-xs font-semibold px-4 py-1.5 rounded whitespace-nowrap">
                    Instances
                  </TabsTrigger>
                  <TabsTrigger value="scans" className="text-xs font-semibold px-4 py-1.5 rounded whitespace-nowrap">
                    Scan History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="components" className="mt-4">
                  {fileDetail.components.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {fileDetail.components.map(({ component, count }) => {
                        const parsed = parseFigmaComponentName(component.componentName, component.componentSetName);
                        return (
                          <div
                            key={component.id}
                            onClick={() => openComponent(component.id)}
                            className="border border-border/80 rounded-lg p-3 bg-muted/10 flex items-center justify-between hover:bg-muted/20 cursor-pointer active:scale-[0.98] transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="bg-violet-500/10 text-violet-400 p-2 rounded-md shrink-0">
                                <LayersIcon className="size-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{parsed.baseName}</p>
                                {(parsed.formattedProperties || parsed.subLabel) && (
                                  <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-0.5">
                                    {parsed.formattedProperties || parsed.subLabel}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                              <span className="text-xs font-mono font-bold text-foreground tabular-nums">{count}</span>
                              <EyeIcon className="size-3 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 min-h-[300px] text-center text-muted-foreground gap-1.5 border border-border/40 rounded-lg bg-muted/5">
                      <CheckCircle2Icon className="size-10 text-emerald-500/40 mb-1" />
                      <p className="text-xs font-semibold text-foreground/60">Zero source components detected</p>
                      <p className="text-[10px] max-w-xs text-muted-foreground/60">This file does not use any design system components.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="instances" className="mt-4">
                  {fileInstances && fileInstances.length > 0 ? (
                    <div className="space-y-2">
                      {fileInstances.map(inst => (
                        <div key={inst.id} className="border border-border/60 rounded-lg p-3 bg-muted/10 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground truncate">{inst.componentName}</p>
                              {inst.usageDepth === 'nested' && (
                                <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">Nested</Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5 text-[10px] text-muted-foreground">
                              {inst.pageName && <span>Page: {inst.pageName}</span>}
                              {inst.frameName && <span>Frame: {inst.frameName}</span>}
                              {inst.instanceName && <span className="font-mono">Name: {inst.instanceName}</span>}
                              {inst.instanceNodeId && <span className="font-mono">ID: {inst.instanceNodeId}</span>}
                            </div>
                          </div>
                          <a
                            href={inst.figmaNodeUrl || `https://www.figma.com/design/${fileDetail.file.figmaFileKey}?node-id=${inst.instanceNodeId.replace(/:/g, '-')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-500 hover:text-sky-400 text-[10px] font-semibold flex items-center gap-1 shrink-0 ml-3 active:scale-[0.95]"
                          >
                            Open <ExternalLinkIcon className="size-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 min-h-[300px] text-center text-muted-foreground gap-1.5 border border-border/40 rounded-lg bg-muted/5">
                      <LayersIcon className="size-10 text-muted-foreground/30 mb-1" />
                      <p className="text-xs font-semibold text-foreground/60">No instance data</p>
                      <p className="text-[10px] max-w-xs text-muted-foreground/60">Run a scan to populate instance-level placement data.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scans" className="mt-4">
                  {fileScanHistory.length > 0 ? (
                    <div className="space-y-2">
                      {fileScanHistory.map(job => (
                        <div key={job.id} className="border border-border/60 rounded-lg p-3 bg-muted/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {job.status === 'success' ? (
                              <CheckCircle2Icon className="size-4 text-emerald-500" />
                            ) : job.status === 'failed' ? (
                              <AlertTriangleIcon className="size-4 text-rose-500" />
                            ) : (
                              <ClockIcon className="size-4 text-amber-500" />
                            )}
                            <div>
                              <p className="text-xs font-medium text-foreground capitalize">{job.status}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-muted-foreground tabular-nums">
                              {job.totalInstances} instances
                            </p>
                            {job.durationMs && (
                              <p className="text-[10px] text-muted-foreground">{(job.durationMs / 1000).toFixed(1)}s</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 min-h-[300px] text-center text-muted-foreground gap-1.5 border border-border/40 rounded-lg bg-muted/5">
                      <ClockIcon className="size-10 text-muted-foreground/30 mb-1" />
                      <p className="text-xs font-semibold text-foreground/60">No scan history</p>
                      <p className="text-[10px] max-w-xs text-muted-foreground/60">Run a scan to see results here.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>

      {/* Register File Sheet */}
      <Sheet open={showRegisterSheet} onOpenChange={setShowRegisterSheet}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold flex items-center gap-2">
              <PlusIcon className="size-4 text-emerald-500" />
              Register Consumer File
            </SheetTitle>
            <SheetDescription className="text-xs">
              Add a Figma file to track design system component usage.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rfName" className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                id="rfName"
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                placeholder="e.g. Checkout Redesign"
                className="text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rfUrl" className="text-xs text-muted-foreground">Figma File URL</Label>
              <Input
                id="rfUrl"
                value={newUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)}
                placeholder="https://www.figma.com/design/KEY/..."
                className="text-xs"
              />
            </div>
            <Button type="submit" disabled={isAdding} className="w-full text-xs mt-2">
              {isAdding ? 'Registering...' : 'Register File'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Component Detail Sheet */}
      <Sheet open={showComponentSheet} onOpenChange={setShowComponentSheet}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {componentDetail && (() => {
            const parsed = parseFigmaComponentName(componentDetail.component.componentName, componentDetail.component.componentSetName);
            return (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-violet-500 font-semibold tracking-wider">
                      {componentDetail.component.componentSetName || 'Component'}
                    </span>
                    <Badge variant={componentDetail.component.status === 'deprecated' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {componentDetail.component.status}
                    </Badge>
                  </div>
                  <SheetTitle className="text-base font-bold mt-2">{parsed.baseName}</SheetTitle>
                  {parsed.formattedProperties && (
                    <p className="text-[10px] text-muted-foreground/70 font-mono">{parsed.formattedProperties}</p>
                  )}
                </SheetHeader>

                <div className="grid grid-cols-2 gap-3 border border-border p-3 rounded-lg bg-muted/20 mt-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Total Instances</span>
                    <p className="text-lg font-bold font-mono tabular-nums">{componentDetail.files.reduce((s, f) => s + f.count, 0)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Files Used</span>
                    <p className="text-lg font-bold font-mono tabular-nums">{componentDetail.files.length}</p>
                  </div>
                </div>

                <Tabs defaultValue="files" className="flex-1 flex flex-col mt-4">
                  <TabsList className="flex bg-muted text-muted-foreground p-1 rounded-md">
                    <TabsTrigger value="files" className="text-[11px] font-semibold px-3 py-1 rounded">Files</TabsTrigger>
                    <TabsTrigger value="nodes" className="text-[11px] font-semibold px-3 py-1 rounded">Nodes</TabsTrigger>
                    <TabsTrigger value="trend" className="text-[11px] font-semibold px-3 py-1 rounded">Trend</TabsTrigger>
                    <TabsTrigger value="meta" className="text-[11px] font-semibold px-3 py-1 rounded">Meta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="files" className="mt-3 space-y-2">
                    {componentDetail.files.map(({ file, count, lastSeen }) => (
                      <div key={file.id} className="border border-border/80 rounded-md p-3 flex justify-between">
                        <div>
                          <p className="text-xs font-semibold">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(lastSeen).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{count} inst</span>
                          <a href={file.figmaUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLinkIcon className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="nodes" className="mt-3 space-y-2">
                    {componentDetail.instances.length > 0 ? componentDetail.instances.map(inst => (
                      <div key={inst.id} className="border border-border/80 rounded-md p-3 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">{inst.frameName || inst.componentName}</span>
                          <a
                            href={`https://www.figma.com/design/${inst.registeredFileId}?node-id=${inst.figmaNodeId.replace(/:/g, '-')}`}
                            target="_blank" rel="noreferrer"
                            className="text-sky-500 hover:text-sky-400 text-[10px] font-semibold flex items-center gap-1 shrink-0 ml-2"
                          >
                            Open <ExternalLinkIcon className="size-3" />
                          </a>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-muted-foreground">
                          {inst.pageName && <span>Page: {inst.pageName}</span>}
                          {inst.fileName && <span>File: {inst.fileName}</span>}
                          <span className="font-mono">ID: {inst.figmaNodeId}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-muted-foreground text-center py-8">No instance data available.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="trend" className="mt-3 h-[200px]">
                    {componentDetail.trend.length >= 2 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={componentDetail.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" opacity={0.3} />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'oklch(0.205 0 0)', borderColor: 'oklch(1 0 0 / 10%)', borderRadius: '6px' }} labelStyle={{ color: '#fff', fontSize: '9px' }} />
                          <Area type="monotone" dataKey="count" stroke="oklch(0.488 0.243 264.376)" fill="url(#cfTrend)" strokeWidth={2} />
                          <defs>
                            <linearGradient id="cfTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <p className="text-xs text-muted-foreground text-center py-8">Need at least 2 scans for trend data.</p>}
                  </TabsContent>

                  <TabsContent value="meta" className="mt-3 space-y-3 text-xs">
                    <div><span className="text-[10px] text-muted-foreground">Component Key</span><p className="font-mono">{componentDetail.component.componentKey || '—'}</p></div>
                    <div><span className="text-[10px] text-muted-foreground">Node ID</span><p className="font-mono">{componentDetail.component.componentNodeId}</p></div>
                    <div><span className="text-[10px] text-muted-foreground">Source File</span><p className="font-mono">{componentDetail.component.sourceFileId}</p></div>
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};
