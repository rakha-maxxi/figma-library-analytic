import React, { useState, useMemo, useEffect } from 'react';
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
  useDetachedCandidates,
} from '../hooks/useTracker';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { api } from '../lib/api';
import {
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  LayersIcon,
  FileSpreadsheetIcon,
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
  const { data: detachedCandidates } = useDetachedCandidates(selectedFileId);

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

  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!fileDetail?.file.scanIntervalMinutes) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      if (activeScanFileIds.has(fileDetail!.file.id)) {
        setCountdown('Scanning...');
        return;
      }
      const last = fileDetail.file.lastScanAttemptAt || fileDetail.file.lastSuccessfulScanAt;
      if (!last) { setCountdown('Next scan: pending...'); return; }
      const intervalMs = fileDetail.file.scanIntervalMinutes! * 60 * 1000;
      const remaining = Math.max(0, new Date(last).getTime() + intervalMs - Date.now());
      if (remaining <= 0) { setCountdown('Next scan: pending...'); return; }
      const s = Math.floor(remaining / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const min = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      const parts: string[] = [];
      if (d > 0) parts.push(`${d}d`);
      if (h > 0 || d > 0) parts.push(`${h}h`);
      if (min > 0 || h > 0 || d > 0) parts.push(`${min}m`);
      parts.push(`${sec}s`);
      setCountdown(`Next scan in ${parts.join(' ')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [fileDetail?.file.scanIntervalMinutes, fileDetail?.file.lastScanAttemptAt, fileDetail?.file.lastSuccessfulScanAt]);

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
        <div className="flex-1 min-h-0 overflow-y-auto">

          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground gap-3 border border-dashed border-border/60 rounded-xl m-4 bg-muted/5 animate-in fade-in duration-300">
              <FileSpreadsheetIcon className="size-8 opacity-30 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold text-foreground/70">
                  {files && files.length > 0 ? 'No matching files' : 'No registered files'}
                </p>
                {!(files && files.length > 0) && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 leading-normal max-w-[180px] mx-auto">
                    Add Figma design files where components from your library are used.
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1 active:scale-[0.96]" onClick={() => setShowRegisterSheet(true)}>
                <PlusIcon className="size-3" /> Register File
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
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-4 max-w-xs text-center">
              <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                <FileSpreadsheetIcon className="size-10 text-primary/40" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Select a file</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Choose a registered file from the sidebar to inspect its components usage, instance locations, and detached candidate elements.
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1 active:scale-[0.97]" onClick={() => setShowRegisterSheet(true)}>
                <PlusIcon className="size-3.5" /> Register new file
              </Button>
            </div>
          </div>
        ) : isDetailLoading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">Loading file details...</div>
        ) : !fileDetail ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">File not found.</div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
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
                  {countdown && (
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] font-mono">{countdown}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={fileDetail.file.scanIntervalMinutes ? String(fileDetail.file.scanIntervalMinutes) : 'off'}
                  onValueChange={async (v: string | null) => {
                    const mins = (!v || v === 'off') ? null : parseInt(v, 10);
                    await api.patch(`/api/registered-files/${fileDetail.file.id}`, { scanIntervalMinutes: mins });
                    toast.success(mins ? `Auto-scan every ${mins}m` : 'Auto-scan disabled');
                  }}
                >
                  <SelectTrigger className="h-8 text-[10px] w-[110px]">
                    <SelectValue placeholder="Auto-scan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off" className="text-[10px]">Off</SelectItem>
                    <SelectItem value="5" className="text-[10px]">Every 5m</SelectItem>
                    <SelectItem value="15" className="text-[10px]">Every 15m</SelectItem>
                    <SelectItem value="30" className="text-[10px]">Every 30m</SelectItem>
                    <SelectItem value="60" className="text-[10px]">Every 1h</SelectItem>
                    <SelectItem value="360" className="text-[10px]">Every 6h</SelectItem>
                    <SelectItem value="1440" className="text-[10px]">Every 24h</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="border border-sky-500/20 bg-sky-500/5 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in duration-200">
                <div className="relative flex size-5 items-center justify-center shrink-0 mt-0.5">
                  <RefreshCwIcon className="size-4 text-sky-400 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sky-400">Scan in progress</p>
                  <div className="mt-1 flex flex-col gap-1">
                    <p className="text-[11px] text-foreground font-medium flex items-center gap-1.5">
                      <span className="inline-block size-1.5 rounded-full bg-sky-400 animate-pulse" />
                      {currentScanJob.status === 'pending'
                        ? 'Queued in scanner queue — waiting to start...'
                        : (currentScanJob as { scanPhase?: string }).scanPhase || 'Analyzing Figma node tree...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Running on Figma API. This will automatically update when complete.
                    </p>
                  </div>
                  {fileDetail.file.lastSuccessfulScanAt && (
                    <p className="text-[9px] text-muted-foreground/60 mt-2 border-t border-sky-500/10 pt-2">
                      Previous scan snapshot from {new Date(fileDetail.file.lastSuccessfulScanAt).toLocaleString()} is shown below.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Direct Instances</p>
                <p className="text-lg font-bold font-mono text-foreground tabular-nums">{fileDetail.file.totalInstances}</p>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Unique Components</p>
                <p className="text-lg font-bold font-mono text-foreground tabular-nums">{fileDetail.file.uniqueComponentsUsed}</p>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">Suspected Detached</p>
                <p className="text-lg font-bold font-mono text-amber-500 tabular-nums">{detachedCandidates?.filter(c => c.status === 'open').length || 0}</p>
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
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in duration-200">
                <AlertTriangleIcon className="size-4 text-rose-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rose-400">Last scan failed (Error: {lastJob.errorCode || 'UNKNOWN_ERROR'})</p>
                  <p className="text-[11px] text-rose-400/90 font-mono mt-1 bg-rose-950/20 p-2 rounded border border-rose-500/10 leading-normal">
                    {lastJob.errorMessage}
                  </p>
                  <div className="border-t border-rose-500/15 pt-2.5 mt-2.5">
                    <p className="text-[10px] font-semibold text-foreground/80 mb-1">Troubleshooting Suggestion:</p>
                    <ul className="list-disc pl-4 space-y-1 text-[9px] text-muted-foreground font-sans">
                      {lastJob.errorCode === 'FIGMA_429' || lastJob.errorMessage.toLowerCase().includes('rate limit') ? (
                        <>
                          <li>Figma API rate limit hit. The scanner will back off and retry.</li>
                          <li>Wait 60 seconds before triggering manual scans on this file.</li>
                        </>
                      ) : lastJob.errorCode === 'FIGMA_403' || lastJob.errorMessage.toLowerCase().includes('forbidden') ? (
                        <>
                          <li>Verify that your Figma Personal Access Token has access to this file.</li>
                          <li>Ensure the token has the <span className="font-semibold text-foreground">File Content</span> read scope.</li>
                        </>
                      ) : (
                        <>
                          <li>Ensure the file URL or key is valid and not deleted.</li>
                          <li>Check your Personal Access Token in Settings.</li>
                        </>
                      )}
                    </ul>
                  </div>
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
                  <TabsTrigger value="detached" className="text-xs font-semibold px-4 py-1.5 rounded whitespace-nowrap">
                    Detached
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

                <TabsContent value="detached" className="mt-4">
                  {detachedCandidates && detachedCandidates.length > 0 ? (
                    <div className="space-y-3">
                      {detachedCandidates.map(c => {
                        const confidenceBadge = () => {
                          switch (c.detectionType) {
                            case 'confirmed_detached': return <Badge className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/20">Confirmed</Badge>;
                            case 'suspected_by_name': return <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">Name Match</Badge>;
                            case 'suspected_by_structure': return <Badge className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20">Structure</Badge>;
                            case 'suspected_by_visual_signature': return <Badge className="text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20">Visual</Badge>;
                            default: return <Badge className="text-[9px]">Unknown</Badge>;
                          }
                        };
                        const levelColor = c.confidenceLevel === 'high' ? 'bg-emerald-500' : c.confidenceLevel === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground/50';
                        return (
                          <div key={c.id} className="border border-border/60 rounded-lg p-3 bg-muted/10">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-semibold text-foreground">{c.sourceComponentName || c.candidateNodeName}</p>
                                  {c.sourceComponentName && c.candidateNodeName !== c.sourceComponentName && (
                                    <span className="text-[10px] text-muted-foreground font-mono">({c.candidateNodeName})</span>
                                  )}
                                  {confidenceBadge()}
                                  {c.status === 'reviewed' && <Badge className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Reviewed</Badge>}
                                  {c.status === 'ignored' && <Badge className="text-[9px] bg-muted text-muted-foreground">Ignored</Badge>}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                  <span>Confidence: <span className="font-mono font-bold">{Math.round(c.confidenceScore * 100)}%</span></span>
                                  <span className="flex items-center gap-1"><span className={`size-1.5 rounded-full ${levelColor}`} />{c.confidenceLevel}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
                                {c.pageName && <p className="text-[10px] text-muted-foreground/60 mt-0.5">Page: {c.pageName}{c.frameName ? ` · Frame: ${c.frameName}` : ''}</p>}
                                {c.matchedSignals.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                    {c.matchedSignals.map(s => (
                                      <Badge key={s} className="text-[8px] bg-muted text-muted-foreground border-border/30 px-1.5 py-0">{s}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {c.figmaNodeUrl && (
                                  <a href={c.figmaNodeUrl} target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-400 text-[10px] font-semibold flex items-center gap-0.5 px-2 py-1 rounded hover:bg-sky-500/5 active:scale-[0.95]">
                                    Open <ExternalLinkIcon className="size-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                              <button className="text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-500/5 active:scale-[0.95]" onClick={() => toast.success('Marked as reviewed')}>Review</button>
                              <button className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted active:scale-[0.95]" onClick={() => toast.success('Marked as ignored')}>Ignore</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 min-h-[300px] text-center text-muted-foreground gap-1.5 border border-border/40 rounded-lg bg-muted/5">
                      <CheckCircle2Icon className="size-10 text-emerald-500/30 mb-1" />
                      <p className="text-xs font-semibold text-foreground/60">No detached components detected</p>
                      <p className="text-[10px] max-w-xs text-muted-foreground/60">Suspected detached usage will appear here after scanning.</p>
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
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
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

                <div className="mt-4 pt-3 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Suspected Detached Usage</p>
                  <p className="text-[10px] text-muted-foreground/60">Detached detection runs during file scanning. Check the Detached tab in file detail for candidates.</p>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};
