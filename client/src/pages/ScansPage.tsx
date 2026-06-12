import React, { useState } from 'react';
import { 
  useScanBatches, 
  useScanJobs, 
  useStartScan, 
  useRegisteredFiles,
  useConnection 
} from '../hooks/useTracker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlayIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  CalendarIcon,
  ClockIcon,
  SquareIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export const ScansPage: React.FC = () => {
  const { data: connection } = useConnection();
  const { data: batches } = useScanBatches();
  const { data: files } = useRegisteredFiles();
  const { mutate: startScan, isPending: isStarting } = useStartScan();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Fetch jobs for selected batch or fallback to first batch
  const activeBatchId = selectedBatchId || (batches && batches.length > 0 ? batches[0].id : undefined);
  const { data: jobs } = useScanJobs(activeBatchId);

  const activeBatch = batches?.find(b => b.id === activeBatchId);

  const handleScanAll = () => {
    if (!connection?.connected) {
      toast.error('Connect Figma Access Token in settings first.');
      return;
    }
    startScan(undefined, {
      onSuccess: () => {
        toast.success('Sequential scan batch started successfully.');
      },
      onError: (err) => {
        toast.error(`Scan could not be started: ${(err as Error).message}`);
      }
    });
  };

  const handleStopBatch = async (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
      await fetch(`${BASE}/api/scans/batches/${batchId}/stop`, { method: 'POST' });
      toast.success('Scan batch stopped.');
    } catch {
      toast.error('Failed to stop batch.');
    }
  };

  const navigateToTab = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('change-tab', { detail: tabId }));
  };

  const renderBatchStatus = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Success</Badge>;
      case 'partial_success':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Partial Success</Badge>;
      case 'running':
        return (
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] gap-1 animate-pulse">
            <Loader2Icon className="size-3 animate-spin" /> Running
          </Badge>
        );
      case 'failed':
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">Failed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Pending</Badge>;
    }
  };

  const renderJobStatus = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />;
      case 'failed':
        return <XCircleIcon className="size-4 text-rose-500 shrink-0" />;
      case 'running':
        return <Loader2Icon className="size-4 text-sky-500 animate-spin shrink-0" />;
      default:
        return <AlertCircleIcon className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
      {/* Batches History List */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground m-0">Scan Batches</h2>
          <Button 
            size="sm" 
            onClick={handleScanAll} 
            disabled={isStarting || activeBatch?.status === 'running'}
            className="text-[10px] px-2.5 h-7 gap-1 active:scale-[0.96]"
          >
            <PlayIcon className="size-2.5 fill-current" /> Scan Now
          </Button>
        </div>

        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
          {batches && batches.length > 0 ? (
            batches.map((batch) => {
              const isSelected = batch.id === activeBatchId;
              const dateStr = batch.createdAt ? new Date(batch.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '—';
              
              return (
                <div 
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`border rounded-xl p-4 cursor-pointer flex flex-col gap-2 transition-all duration-150 active:scale-[0.98] ${
                    isSelected 
                      ? 'bg-secondary/40 border-violet-500/40 shadow-sm' 
                      : 'border-border bg-card hover:bg-muted/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[120px] font-mono">
                      {batch.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {batch.status === 'running' && (
                        <button
                          onClick={(e) => handleStopBatch(batch.id, e)}
                          className="text-rose-500 hover:text-rose-400 p-0.5 rounded active:scale-90 transition-all"
                          title="Force stop"
                        >
                          <SquareIcon className="size-3.5" />
                        </button>
                      )}
                      {renderBatchStatus(batch.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-sans">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <span>Files: {batch.completedFiles}/{batch.totalFiles}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-1.5 border border-border bg-card rounded-lg p-6 bg-muted/5">
              <span className="text-xs font-semibold text-foreground/70">No scan history</span>
              <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                Click "Scan Now" above to trigger your first crawler scan on registered files.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Batch Details */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {activeBatch ? (
          <>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground m-0">
                Batch Details: <span className="font-mono text-muted-foreground">{activeBatch.id}</span>
              </h2>
              <p className="text-xs text-muted-foreground">Crawler queue jobs execution status.</p>
            </div>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold">
                    Progress summary
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <ClockIcon className="size-3" />
                  <span>
                    Started: {activeBatch.startedAt ? new Date(activeBatch.startedAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-6">
                
                {/* Progress bar and estimation */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      {activeBatch.status === 'running' && (
                        <span className="inline-block size-2 rounded-full bg-sky-400 animate-pulse" />
                      )}
                      Batch Completion: {activeBatch.completedFiles + activeBatch.failedFiles} of {activeBatch.totalFiles} files completed
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {activeBatch.totalFiles > 0 ? Math.round(((activeBatch.completedFiles + activeBatch.failedFiles) / activeBatch.totalFiles) * 100) : 0}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={activeBatch.totalFiles > 0 ? ((activeBatch.completedFiles + activeBatch.failedFiles) / activeBatch.totalFiles) * 100 : 0} 
                    className="h-2 w-full flex-col items-stretch"
                  />
                  
                  {activeBatch.status === 'running' && (
                    <div className="flex justify-between text-[10px] text-muted-foreground/80 mt-1 font-mono">
                      <span>Completed: {activeBatch.completedFiles} · Failed: {activeBatch.failedFiles}</span>
                      <span>
                        Estimated remaining: {Math.max(0, (activeBatch.totalFiles - activeBatch.completedFiles - activeBatch.failedFiles) * 8)}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Job Items List */}
                <div className="flex flex-col gap-3">
                  {jobs && jobs.length > 0 ? (
                    jobs.map((job) => {
                      const file = files?.find(f => f.id === job.registeredFileId);
                      const filename = file ? file.name : 'Unknown File';

                      return (
                        <div key={job.id} className="border border-border/80 rounded-xl p-4 flex flex-col gap-3 hover:bg-muted/5 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {renderJobStatus(job.status)}
                              <span className="text-xs font-semibold text-foreground truncate">{filename}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {job.status === 'success' ? '100%' : job.status === 'running' ? '' : '0%'}
                            </span>
                          </div>

                          {job.status === 'running' && (
                            <div className="flex items-center gap-2 text-[10px] text-sky-400 bg-sky-500/5 border border-sky-500/20 rounded-lg p-2.5 animate-pulse">
                              <Loader2Icon className="size-3.5 animate-spin shrink-0" />
                              <span>{job.scanPhase || 'Initializing Figma node parser...'}</span>
                            </div>
                          )}

                          {job.status === 'success' && (
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2.5 font-mono">
                              <span>Duration: {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '—'}</span>
                              <span>Detected: {job.totalInstances} instances ({job.uniqueComponentsUsed} components)</span>
                            </div>
                          )}

                          {job.status === 'failed' && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-col gap-2.5 text-[10px] text-rose-400 animate-in fade-in duration-200">
                              <div className="font-semibold flex items-center gap-1.5 text-xs text-rose-500">
                                <AlertCircleIcon className="size-3.5 shrink-0" /> Error: {job.errorCode || 'UNKNOWN_ERROR'}
                              </div>
                              <p className="font-mono bg-rose-950/20 p-2.5 rounded border border-rose-500/10 leading-normal text-rose-300/90">
                                {job.errorMessage || 'An unexpected error occurred during Figma crawler execution.'}
                              </p>
                              
                              {/* Diagnostics guide */}
                              <div className="border-t border-rose-500/15 pt-2.5 mt-1">
                                <p className="font-semibold text-foreground/80 mb-1">Troubleshooting Suggestion:</p>
                                <ul className="list-disc pl-4 space-y-1 text-[9px] text-muted-foreground leading-normal font-sans">
                                  {job.errorCode === 'FIGMA_429' || job.errorMessage?.toLowerCase().includes('rate limit') ? (
                                    <>
                                      <li>Figma API rate limit hit. The crawler automatically retries after a short backoff period.</li>
                                      <li>To reduce hits, avoid running multiple scans in parallel.</li>
                                      <li>If this persists, wait 60 seconds before initiating another crawl.</li>
                                    </>
                                  ) : job.errorCode === 'FIGMA_403' || job.errorMessage?.toLowerCase().includes('forbidden') ? (
                                    <>
                                      <li>Figma permissions error. Ensure your Personal Access Token (PAT) is active and has access to this file.</li>
                                      <li>Check that your PAT has the required <strong className="text-foreground">File Content</strong> read scope enabled.</li>
                                      <li><span onClick={() => navigateToTab('settings')} className="text-sky-400 underline cursor-pointer hover:text-sky-300">Click here</span> to verify PAT settings.</li>
                                    </>
                                  ) : job.errorCode === 'FIGMA_401' || job.errorMessage?.toLowerCase().includes('unauthorized') ? (
                                    <>
                                      <li>Figma authentication failure. Your PAT may have expired or is invalid.</li>
                                      <li>Go to Figma Settings page, generate a new token, and update it in Design Ops Settings.</li>
                                      <li><span onClick={() => navigateToTab('settings')} className="text-sky-400 underline cursor-pointer hover:text-sky-300">Update Figma PAT</span> in Settings.</li>
                                    </>
                                  ) : job.errorCode === 'FIGMA_404' || job.errorMessage?.toLowerCase().includes('not found') ? (
                                    <>
                                      <li>Figma file not found. Double check that the file key in the registered file URL is valid.</li>
                                      <li>Ensure the file was not deleted, moved, or renamed in a way that revokes access.</li>
                                      <li>Verify that the URL follows: <code className="text-foreground">https://www.figma.com/design/KEY/...</code></li>
                                    </>
                                  ) : (
                                    <>
                                      <li>Check Figma API status and your local network connection.</li>
                                      <li>Verify that the Personal Access Token is valid in <span onClick={() => navigateToTab('settings')} className="text-sky-400 underline cursor-pointer hover:text-sky-300">Settings</span>.</li>
                                      <li>Ensure the file is shared with the account associated with the token.</li>
                                    </>
                                  )}
                                </ul>
                              </div>

                              <div className="mt-1 flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={handleScanAll}
                                  className="text-[9px] h-6.5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 active:scale-[0.95]"
                                >
                                  Retry Scanners
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-muted-foreground py-8 text-center">
                      No jobs running inside this batch.
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border border-border bg-card rounded-lg h-full p-8 bg-muted/5 gap-1.5">
            <span className="text-xs font-semibold text-foreground/70">No batch selected</span>
            <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
              Select an execution batch from the history panel on the left to review logs.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
