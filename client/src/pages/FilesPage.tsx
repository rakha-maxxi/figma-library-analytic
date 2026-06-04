import React, { useState } from 'react';
import { 
  useRegisteredFiles, 
  useAddRegisteredFile, 
  useRemoveRegisteredFile, 
  useToggleFileTracking,
  useFileDetail,
  useStartScan,
  useConnection,
  useComponentDetail
} from '../hooks/useTracker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '../components/ui/table';
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
  ExternalLinkIcon
} from 'lucide-react';
import { parseFigmaComponentName } from '../lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Used':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          Used
        </Badge>
      );
    case 'Low Usage':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border-sky-500/20">
          Low Usage
        </Badge>
      );
    case 'Unused':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50 text-muted-foreground border-border">
          Unused
        </Badge>
      );
    case 'Not Scanned':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/10 text-amber-500/90 border-amber-500/20">
          Not Scanned
        </Badge>
      );
    case 'Deprecated Candidate':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 border-rose-500/20">
          Deprecated Candidate
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-semibold">
          {status}
        </Badge>
      );
  }
};

export const FilesPage: React.FC = () => {
  const { data: connection } = useConnection();
  const { data: files } = useRegisteredFiles();
  const { mutate: addFile, isPending: isAdding } = useAddRegisteredFile();
  const { mutate: removeFile } = useRemoveRegisteredFile();
  const { mutate: toggleTracking } = useToggleFileTracking();
  const { mutate: startScan } = useStartScan();

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  const { data: fileDetail } = useFileDetail(selectedFileId);
  const { data: componentDetail } = useComponentDetail(selectedCompId);

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newName) {
      toast.error('File name and URL are required.');
      return;
    }
    if (!newUrl.includes('/file/') && !newUrl.includes('/design/')) {
      toast.error('Invalid Figma file link. Expected format: https://www.figma.com/design/KEY/...');
      return;
    }

    addFile({ url: newUrl, name: newName }, {
      onSuccess: () => {
        toast.success('Consumer file registered for tracking.');
        setNewUrl('');
        setNewName('');
      },
      onError: (err) => {
        toast.error(`Add failed: ${(err as Error).message}`);
      }
    });
  };

  const handleRescanSingle = (_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connection?.connected) {
      toast.error('Figma token not connected.');
      return;
    }
    toast.info('Starting file scan...');
    startScan(undefined, {
      onSuccess: () => {
        toast.success('Scan job queued for file.');
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this file? All usage history for this file will be permanently deleted.')) {
      removeFile(id);
      if (selectedFileId === id) {
        setSelectedFileId(null);
      }
      toast.success('File removed from tracking.');
    }
  };

  const renderFileStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Healthy</Badge>;
      case 'zero_usage':
        return <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Zero Usage</Badge>;
      case 'low_adoption':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">Low Adoption</Badge>;
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

  return (
    <div className="flex flex-col gap-8">
      {/* Upper Grid: Table + Register form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Files list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Registered Files</h2>
            <p className="text-xs text-muted-foreground">List of Figma design files scanned for design system adoption.</p>
          </div>

          <div className="border border-border bg-card rounded-lg overflow-hidden">
            {files && files.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs">File Name</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Unique Components</TableHead>
                    <TableHead className="text-xs text-right">Total Instances</TableHead>
                    <TableHead className="text-xs">Track</TableHead>
                    <TableHead className="text-xs text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow 
                      key={file.id}
                      onClick={() => setSelectedFileId(selectedFileId === file.id ? null : file.id)}
                      className={`cursor-pointer transition-colors ${selectedFileId === file.id ? 'bg-secondary/40' : 'hover:bg-muted/20'}`}
                    >
                      <TableCell className="text-xs font-semibold text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span>{file.name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{file.figmaFileKey}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {renderFileStatus(file.status)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono tabular-nums">{file.uniqueComponentsUsed}</TableCell>
                      <TableCell className="text-xs text-right font-mono tabular-nums">{file.totalInstances}</TableCell>
                      <TableCell className="text-xs" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Switch 
                          checked={file.trackingEnabled}
                          onCheckedChange={() => toggleTracking(file.id)}
                          className="scale-90"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            disabled={!file.trackingEnabled}
                            onClick={(e) => handleRescanSingle(file.id, e)}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center size-8 rounded hover:bg-muted transition-colors active:scale-[0.92] disabled:opacity-40"
                            title="Rescan file"
                          >
                            <RefreshCwIcon className="size-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(file.id, e)}
                            className="text-muted-foreground hover:text-rose-500 inline-flex items-center justify-center size-8 rounded hover:bg-rose-500/10 transition-colors active:scale-[0.92]"
                            title="Remove file"
                          >
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-1.5 p-6 bg-muted/5">
                <span className="text-xs font-semibold text-foreground/70">No registered files found</span>
                <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                  Enter a Figma file URL on the right to start tracking component adoption.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Register form */}
        <Card className="border-border bg-card h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PlusIcon className="size-4 text-emerald-500" />
              Register New File
            </CardTitle>
            <CardDescription className="text-xs">
              Add a consumer Figma design file key to track and count component adoptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFile} className="flex flex-col gap-4 pb-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fileName" className="text-xs text-muted-foreground">File Display Name</Label>
                <Input 
                  id="fileName" 
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                  placeholder="e.g. Workspace Explorations" 
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="fileUrl" className="text-xs text-muted-foreground">Figma File Link</Label>
                <Input 
                  id="fileUrl" 
                  value={newUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/KEY/..." 
                  className="text-xs"
                />
              </div>

              <Button type="submit" disabled={isAdding} className="w-full text-xs active:scale-[0.98] mt-2">
                {isAdding ? 'Registering...' : 'Register File'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down Detail View */}
      {selectedFileId && fileDetail && (
        <Card className="border-border bg-card animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LayersIcon className="size-4 text-violet-500" />
                Components Used in: {fileDetail.file.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of design system components detected inside this consumer file.
              </CardDescription>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Last Scan: {fileDetail.file.lastSuccessfulScanAt ? new Date(fileDetail.file.lastSuccessfulScanAt).toLocaleString() : 'Never'}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {fileDetail.components.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fileDetail.components.map(({ component, count }) => {
                  const parsed = parseFigmaComponentName(component.componentName, component.componentSetName);
                  return (
                    <div 
                      key={component.id} 
                      onClick={() => setSelectedCompId(component.id)}
                      className="border border-border/80 rounded-lg p-4 bg-muted/10 flex items-center justify-between hover:bg-muted/20 cursor-pointer active:scale-[0.98] transition-all" 
                      title={component.componentName}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-violet-500/10 text-violet-400 p-2 rounded-md shrink-0">
                          <LayersIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-foreground truncate">{parsed.baseName}</h4>
                          {(parsed.formattedProperties || parsed.subLabel) && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                              {parsed.formattedProperties || parsed.subLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 pl-2">
                        <span className="text-xs font-mono font-bold text-foreground tabular-nums">{count}</span>
                        <span className="text-[9px] text-muted-foreground">instances</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-10">
                {fileDetail.file.status === 'not_scanned' 
                  ? 'File has not been scanned yet. Run a scan to fetch components list.' 
                  : 'Zero design system components detected inside this file.'
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Component Detail Sheet Drawer */}
      <Sheet open={!!selectedCompId} onOpenChange={(open: boolean) => { if (!open) setSelectedCompId(null); }}>
        <SheetContent className="w-[500px] sm:max-w-[500px] border-l border-border bg-card p-6 flex flex-col gap-6 overflow-y-auto">
          {componentDetail && (() => {
            const drawerParsed = parseFigmaComponentName(componentDetail.component.componentName, componentDetail.component.componentSetName);
            return (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-violet-500 font-semibold tracking-wider">
                      {componentDetail.component.componentSetName || 'Independent Component'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(componentDetail.component.usageStatus || '')}
                      {componentDetail.component.status === 'deprecated' && (
                        <Badge variant="destructive" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                          Deprecated
                        </Badge>
                      )}
                    </div>
                  </div>
                  <SheetTitle className="text-lg font-bold text-foreground mt-2" title={componentDetail.component.componentName}>
                    {drawerParsed.baseName}
                  </SheetTitle>
                  
                  {drawerParsed.subLabel && (
                    <div className="text-xs text-muted-foreground mt-0.5 italic">
                      {drawerParsed.subLabel}
                    </div>
                  )}

                  {drawerParsed.formattedProperties && (
                    <div className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                      {drawerParsed.formattedProperties}
                    </div>
                  )}

                  <SheetDescription className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    {componentDetail.component.description || 'No description provided.'}
                  </SheetDescription>
                </SheetHeader>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-lg bg-muted/20">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Total Instances</span>
                    <span className="text-lg font-bold font-mono text-foreground tabular-nums">
                      {componentDetail.files.reduce((sum, f) => sum + f.count, 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Files Adopted</span>
                    <span className="text-lg font-bold font-mono text-foreground tabular-nums">{componentDetail.files.length}</span>
                  </div>
                </div>

                {/* Tabs for Drawer */}
                <Tabs defaultValue="files" className="flex-1 flex flex-col">
                  <TabsList className="flex flex-col sm:grid sm:grid-cols-4 bg-muted text-muted-foreground p-1 rounded-md w-full gap-1 sm:gap-0">
                    <TabsTrigger value="files" className="text-[11px] font-semibold leading-none rounded flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <FileSpreadsheetIcon className="size-3" /> Files
                    </TabsTrigger>
                    <TabsTrigger value="instances" className="text-[11px] font-semibold leading-none rounded flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <LayersIcon className="size-3" /> Nodes
                    </TabsTrigger>
                    <TabsTrigger value="trend" className="text-[11px] font-semibold leading-none rounded flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <LineChartIcon className="size-3" /> Trend
                    </TabsTrigger>
                    <TabsTrigger value="meta" className="text-[11px] font-semibold leading-none rounded flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <CalendarIcon className="size-3" /> Meta
                    </TabsTrigger>
                  </TabsList>

                  {/* Files Tab */}
                  <TabsContent value="files" className="mt-4 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                      {componentDetail.files.length > 0 ? (
                        componentDetail.files.map(({ file, count, lastSeen }) => (
                          <div key={file.id} className="border border-border/80 rounded-md p-3 flex items-center justify-between hover:bg-muted/10">
                            <div>
                              <h4 className="text-xs font-semibold text-foreground truncate max-w-[200px]">{file.name}</h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Seen: {new Date(lastSeen).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-foreground tabular-nums">{count} instances</span>
                              <a 
                                href={file.figmaUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-foreground shrink-0 active:scale-[0.92]"
                              >
                                <ExternalLinkIcon className="size-3.5" />
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-1.5 bg-muted/5 border border-border/40 rounded-lg p-6">
                          <span className="text-xs font-semibold text-foreground/70">No file usage detected</span>
                          <span className="text-[10px] max-w-xs text-muted-foreground/70 leading-relaxed">
                            This component is not adopted in any of your registered consumer files.
                          </span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Nodes Instances Tab */}
                  <TabsContent value="instances" className="mt-4 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                      {componentDetail.instances.length > 0 ? (
                        componentDetail.instances.map((inst) => (
                          <div key={inst.id} className="border border-border/80 rounded-md p-3 flex flex-col gap-1.5 hover:bg-muted/10">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-xs font-semibold text-foreground">{inst.frameName}</h4>
                                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[240px]">
                                  Page: {inst.pageName}
                                </p>
                              </div>
                              <a 
                                href={`https://figma.com/file/${inst.registeredFileId}?node-id=${inst.figmaNodeId}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-sky-500 hover:text-sky-400 text-[10px] font-semibold flex items-center gap-1 shrink-0 active:scale-[0.92]"
                              >
                                Figma Node <ExternalLinkIcon className="size-3" />
                              </a>
                            </div>
                            <div className="text-[9px] text-muted-foreground flex justify-between border-t border-border/30 pt-1.5 font-mono">
                              <span>File: {inst.fileName}</span>
                              <span>Node ID: {inst.figmaNodeId}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-1.5 bg-muted/5 border border-border/40 rounded-lg p-6">
                          <span className="text-xs font-semibold text-foreground/70">No instances found</span>
                          <span className="text-[10px] max-w-xs text-muted-foreground/70 leading-relaxed">
                            No individual node-level placements have been mapped. Run a scan to fetch component instances.
                          </span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Trend Tab */}
                  <TabsContent value="trend" className="mt-4 flex-1 h-[200px] flex items-center justify-center">
                    {componentDetail.trend.length >= 2 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={componentDetail.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorInstancesFiles" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" opacity={0.3} />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'oklch(0.205 0 0)', borderColor: 'oklch(1 0 0 / 10%)', borderRadius: '6px' }}
                            labelStyle={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#a78bfa', fontSize: '10px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="oklch(0.488 0.243 264.376)" 
                            fillOpacity={1} 
                            fill="url(#colorInstancesFiles)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : componentDetail.trend.length === 1 ? (
                      <div className="flex flex-col items-center justify-center text-center p-6 h-full text-muted-foreground gap-1.5 bg-muted/5 border border-border/40 rounded-lg">
                        <span className="text-xs font-semibold text-foreground/80">Single scan point detected</span>
                        <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                          Adoption trends require at least 2 scan snapshots. Run another scan after updating your consumer files to view usage delta.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 h-full text-muted-foreground gap-1.5 bg-muted/5 border border-border/40 rounded-lg">
                        <span className="text-xs font-semibold text-foreground/80">No scan history yet</span>
                        <span className="text-[10px] max-w-xs text-muted-foreground/75 leading-relaxed">
                          Initiate your first crawl scan on registered files to construct a adoption trend chart.
                        </span>
                      </div>
                    )}
                  </TabsContent>

                  {/* Meta Tab */}
                  <TabsContent value="meta" className="mt-4 flex-1 flex flex-col gap-4 text-xs">
                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Original Component Name</span>
                      <span className="font-mono text-foreground break-all">{componentDetail.component.componentName}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Figma Component Key</span>
                      <span className="font-mono text-foreground">{componentDetail.component.componentKey || '—'}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Source Node ID</span>
                      <span className="font-mono text-foreground">{componentDetail.component.componentNodeId}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Source File Key</span>
                      <span className="font-mono text-foreground">{componentDetail.component.sourceFileId}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">Design Playground Node Location</span>
                      <span className="text-foreground">{componentDetail.component.pageName} page</span>
                    </div>
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
