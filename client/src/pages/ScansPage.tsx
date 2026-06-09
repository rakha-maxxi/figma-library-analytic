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

  const renderBatchStatus = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Success</Badge>;
      case 'partial_success':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Partial Success</Badge>;
      case 'running':
        return (
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] gap-1">
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
        return <CheckCircle2Icon className="size-4 text-emerald-500" />;
      case 'failed':
        return <XCircleIcon className="size-4 text-rose-500" />;
      case 'running':
        return <Loader2Icon className="size-4 text-sky-500 animate-spin" />;
      default:
        return <AlertCircleIcon className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Batches History List */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground m-0">Scan Batches</h2>
          <Button 
            size="sm" 
            onClick={handleScanAll} 
            disabled={isStarting || activeBatch?.status === 'running'}
            className="text-[10px] px-2.5 h-7 gap-1"
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
                  className={`border rounded-lg p-4 cursor-pointer flex flex-col gap-2 transition-all duration-150 ${
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

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
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

            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold">
                    Progress summary ({activeBatch.completedFiles + activeBatch.failedFiles} of {activeBatch.totalFiles} files completed)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ClockIcon className="size-3" />
                  <span>
                    Started: {activeBatch.startedAt ? new Date(activeBatch.startedAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-6">
                
                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <Progress 
                    value={activeBatch.totalFiles > 0 ? ((activeBatch.completedFiles + activeBatch.failedFiles) / activeBatch.totalFiles) * 100 : 0} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Job Items List */}
                <div className="flex flex-col gap-3">
                  {jobs && jobs.length > 0 ? (
                    jobs.map((job) => {
                      // Lookup file name
                      const file = files?.find(f => f.id === job.registeredFileId);
                      const filename = file ? file.name : 'Unknown File';

                      return (
                        <div key={job.id} className="border border-border/80 rounded-md p-3.5 flex flex-col gap-3 hover:bg-muted/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderJobStatus(job.status)}
                              <span className="text-xs font-semibold text-foreground">{filename}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {job.status === 'success' ? '100%' : job.status === 'running' ? '' : '0%'}
                            </span>
                          </div>

                          {job.status === 'running' && (
                            <div className="flex items-center gap-2 text-[10px] text-sky-400 bg-sky-500/5 border border-sky-500/20 rounded p-2">
                              <Loader2Icon className="size-3 animate-spin shrink-0" />
                              <span>{job.scanPhase || 'Scanning...'}</span>
                            </div>
                          )}

                          {job.status === 'success' && (
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2 font-mono">
                              <span>Duration: {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '—'}</span>
                              <span>Detected: {job.totalInstances} instances ({job.uniqueComponentsUsed} components)</span>
                            </div>
                          )}

                          {job.status === 'failed' && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded p-2.5 flex flex-col gap-1 text-[10px] text-rose-400">
                              <div className="font-semibold flex items-center gap-1.5">
                                <AlertCircleIcon className="size-3.5 shrink-0" /> Error: {job.errorCode}
                              </div>
                              <p className="mt-0.5">{job.errorMessage}</p>
                              {job.registeredFileId === 'rf-4' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={handleScanAll}
                                  className="mt-2 text-[9px] h-6 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 active:scale-[0.95]"
                                >
                                  Retry Scanners
                                </Button>
                              )}
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
