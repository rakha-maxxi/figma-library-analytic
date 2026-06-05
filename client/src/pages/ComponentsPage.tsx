import React, { useState, useMemo } from 'react';
import { 
  useComponents, 
  useComponentDetail 
} from '../hooks/useTracker';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  SearchIcon, 
  SlidersHorizontalIcon, 
  ExternalLinkIcon,
  LayersIcon,
  FileSpreadsheetIcon,
  LineChartIcon,
  CalendarIcon,
  EyeIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { parseFigmaComponentName } from '../lib/utils';

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

export const ComponentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [setFilter, setSetFilter] = useState('all');
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // Fetch components based on filters
  const { data: components, isLoading } = useComponents({ search, status, set: setFilter });
  const { data: detail } = useComponentDetail(selectedCompId);

  const allUsage = useMemo(() => {
    const comps = components || [];
    return comps.map(c => ({
      ...c,
      totalInstances: c.totalInstances || 0,
      filesUsed: c.filesUsed || 0,
    }));
  }, [components]);

  const componentSets = useMemo(() => {
    // To populate the list of component sets, fetch all without setFilter or status filters to list options
    const comps = components || [];
    const sets = new Set<string>();
    comps.forEach(c => {
      if (c.componentSetName) sets.add(c.componentSetName);
    });
    return Array.from(sets);
  }, [components]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Source Components</h2>
        <p className="text-xs text-muted-foreground">Inventory of design system components imported from your source UI Kit.</p>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border border-border bg-card p-4 rounded-lg">
        <div className="relative w-full md:w-80">
          <SearchIcon className="size-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search component name or set..." 
            className="text-xs pl-9"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <SlidersHorizontalIcon className="size-4 text-muted-foreground shrink-0 hidden md:block" />
          
          <Select value={status} onValueChange={(val) => setStatus(val || 'all')}>
            <SelectTrigger className="w-full md:w-44 text-xs h-9 bg-background">
              <SelectValue placeholder="Usage Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="Used" className="text-xs">Used</SelectItem>
              <SelectItem value="Low Usage" className="text-xs">Low Usage</SelectItem>
              <SelectItem value="Unused" className="text-xs">Unused</SelectItem>
              <SelectItem value="Not Scanned" className="text-xs">Not Scanned</SelectItem>
              <SelectItem value="Deprecated Candidate" className="text-xs">Deprecated Candidate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={setFilter} onValueChange={(val) => setSetFilter(val || 'all')}>
            <SelectTrigger className="w-full md:w-44 text-xs h-9 bg-background">
              <SelectValue placeholder="Component Set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Component Sets</SelectItem>
              {componentSets.map(set => (
                <SelectItem key={set} value={set} className="text-xs">{set}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border bg-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">
            Loading components inventory...
          </div>
        ) : allUsage.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs">Component Name / Variants</TableHead>
                <TableHead className="text-xs">Component Set / Group</TableHead>
                <TableHead className="text-xs text-right">Total Instances</TableHead>
                <TableHead className="text-xs text-right">Consumer Files</TableHead>
                <TableHead className="text-xs">Usage Status</TableHead>
                <TableHead className="text-xs">Figma Node</TableHead>
                <TableHead className="text-xs text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsage.map((comp) => {
                const parsed = parseFigmaComponentName(comp.componentName, comp.componentSetName);
                return (
                  <TableRow 
                    key={comp.id} 
                    onClick={() => setSelectedCompId(comp.id)}
                    className="cursor-pointer hover:bg-muted/30 active:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-xs font-semibold text-foreground max-w-[220px]" title={comp.componentName}>
                      <span className="truncate block">
                        {parsed.baseName}
                      </span>
                      {parsed.subLabel && (
                        <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-normal truncate">
                          {parsed.subLabel}
                        </div>
                      )}
                      {parsed.formattedProperties && (
                        <div className="text-[10px] text-muted-foreground/50 mt-0.5 font-normal truncate font-mono">
                          {parsed.formattedProperties}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{comp.componentSetName || '—'}</TableCell>
                    <TableCell className="text-xs text-right font-mono tabular-nums">{comp.totalInstances}</TableCell>
                    <TableCell className="text-xs text-right font-mono tabular-nums">{comp.filesUsed}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(comp.usageStatus)}
                        {comp.status === 'deprecated' && (
                          <span className="text-[9px] text-rose-400 font-medium">Deprecated in Kit</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{comp.componentNodeId}</TableCell>
                    <TableCell className="text-xs text-right">
                      <button className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center size-8 rounded hover:bg-muted transition-colors active:scale-[0.95]">
                        <EyeIcon className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <span className="text-xs">No components found matching filters.</span>
            <span className="text-[10px] text-muted-foreground/60">Try updating your filters or refresh the UI Kit in settings.</span>
          </div>
        )}
      </div>

      {/* Component Detail Sheet Drawer */}
      <Sheet open={!!selectedCompId} onOpenChange={(open: boolean) => { if (!open) setSelectedCompId(null); }}>
        <SheetContent className="w-[500px] sm:max-w-[500px] border-l border-border bg-card flex flex-col gap-6 overflow-y-auto">
          {detail && (() => {
            const drawerParsed = parseFigmaComponentName(detail.component.componentName, detail.component.componentSetName);
            return (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-violet-500 font-semibold tracking-wider">
                      {detail.component.componentSetName || 'Independent Component'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(detail.component.usageStatus || '')}
                      {detail.component.status === 'deprecated' && (
                        <Badge variant="destructive" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                          Deprecated
                        </Badge>
                      )}
                    </div>
                  </div>
                  <SheetTitle className="text-lg font-bold text-foreground mt-2" title={detail.component.componentName}>
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
                    {detail.component.description || 'No description provided.'}
                  </SheetDescription>
                </SheetHeader>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-lg bg-muted/20">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Total Instances</span>
                    <span className="text-lg font-bold font-mono text-foreground tabular-nums">
                      {detail.files.reduce((sum, f) => sum + f.count, 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Files Adopted</span>
                    <span className="text-lg font-bold font-mono text-foreground tabular-nums">{detail.files.length}</span>
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
                      {detail.files.length > 0 ? (
                        detail.files.map(({ file, count, lastSeen }) => (
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
                      {detail.instances.length > 0 ? (
                        detail.instances.map((inst) => (
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
                    {detail.trend.length >= 2 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={detail.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorInstances" x1="0" y1="0" x2="0" y2="1">
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
                            fill="url(#colorInstances)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : detail.trend.length === 1 ? (
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
                          Initiate your first crawl scan on registered files to construct a baseline adoption trend chart.
                        </span>
                      </div>
                    )}
                  </TabsContent>

                  {/* Meta Tab */}
                  <TabsContent value="meta" className="mt-4 flex-1 flex flex-col gap-4 text-xs">
                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Original Component Name</span>
                      <span className="font-mono text-foreground break-all">{detail.component.componentName}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Figma Component Key</span>
                      <span className="font-mono text-foreground">{detail.component.componentKey || '—'}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Source Node ID</span>
                      <span className="font-mono text-foreground">{detail.component.componentNodeId}</span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border pb-3">
                      <span className="text-[10px] text-muted-foreground">Source File Key</span>
                      <span className="font-mono text-foreground">{detail.component.sourceFileId}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">Design Playground Node Location</span>
                      <span className="text-foreground">{detail.component.pageName} page</span>
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
