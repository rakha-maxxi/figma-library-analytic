import React, { useState } from 'react';
import { useActivityLogs } from '../hooks/useTracker';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  KeyRoundIcon,
  LayersIcon,
  FileCodeIcon,
  RefreshCwIcon,
  SettingsIcon,
  SearchIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanIcon,
  SlidersHorizontalIcon
} from 'lucide-react';

export const ActivityLogPage: React.FC = () => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Derive server-side category if eventTypeFilter isn't 'all'
  // But wait, the backend getActivityLogs filters by exact eventType if set.
  // Let's pass the eventTypeFilter if it is not 'all'. But since we have groups,
  // we can either map groups on the frontend or filter them. Wait! If the user filters
  // by group, e.g. "auth", it's better to fetch and filter locally or map group names.
  // Wait, let's look at the backend filter again:
  // if (filters.eventType) { where.eventType = filters.eventType; }
  // Since the backend filters by exact eventType, if we want group filtering,
  // we could either fetch all and filter on the frontend (if data is small) OR just query with
  // the exact event type. Wait, fetching with page/limit is fast. To support categories, let's keep it simple:
  // we can map the dropdown values to specific eventTypes, OR support actual exact eventTypes in the dropdown:
  // - "all": All Events
  // - "figma.connected": Figma Connected
  // - "figma.disconnected": Figma Disconnected
  // - "source.registered": Source Registered
  // - "source.components.imported": Source Imported
  // - "source.removed": Source Removed
  // - "file.registered": File Registered
  // - "file.removed": File Removed
  // - "file.tracking.toggled": File Tracking Toggled
  // - "scan.batch.started": Scan Batch Started
  // - "scan.batch.completed": Scan Batch Completed
  // - "scan.job.success": Scan Job Success
  // - "scan.job.failed": Scan Job Failed
  // - "scan.job.rate_limited": Scan Rate Limited
  // - "settings.updated": Settings Updated
  // This is super clean and direct! Let's do that.

  const { data, isLoading } = useActivityLogs({
    eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    search: searchQuery || undefined,
    page,
    limit,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;
  const totalLogs = data?.total || 0;

  const getEventIcon = (eventType: string) => {
    if (eventType.startsWith('figma.')) {
      return <KeyRoundIcon className="size-4 text-sky-400" />;
    }
    if (eventType.startsWith('source.')) {
      return <LayersIcon className="size-4 text-indigo-400" />;
    }
    if (eventType.startsWith('file.')) {
      return <FileCodeIcon className="size-4 text-emerald-400" />;
    }
    if (eventType.startsWith('scan.')) {
      return <RefreshCwIcon className="size-4 text-amber-400" />;
    }
    if (eventType.startsWith('settings.')) {
      return <SettingsIcon className="size-4 text-pink-400" />;
    }
    return <InfoIcon className="size-4 text-muted-foreground" />;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-medium py-0 px-2 h-5">
            Success
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-medium py-0 px-2 h-5">
            Warning
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-medium py-0 px-2 h-5">
            Error
          </Badge>
        );
      case 'info':
      default:
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-medium py-0 px-2 h-5">
            Info
          </Badge>
        );
    }
  };

  const getSeverityDotClass = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-emerald-500 ring-emerald-500/20';
      case 'warning':
        return 'bg-amber-500 ring-amber-500/20';
      case 'error':
        return 'bg-rose-500 ring-rose-500/20';
      case 'info':
      default:
        return 'bg-blue-500 ring-blue-500/20';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Prevent showing future times if clock skew exists
    const safeDiffMs = Math.max(0, diffMs);
    const diffMins = Math.floor(safeDiffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  const handleResetFilters = () => {
    setEventTypeFilter('all');
    setSeverityFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground m-0">Activity Log</h2>
        <p className="text-xs text-muted-foreground">
          Chronological audit trail of system events, Figma connections, and scanning operations.
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border border-border bg-card p-4 rounded-lg">
        <div className="relative w-full md:w-80">
          <SearchIcon className="size-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            placeholder="Search title or description..."
            className="text-xs pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <SlidersHorizontalIcon className="size-4 text-muted-foreground shrink-0 hidden md:block" />

          {/* Event Type Filter */}
          <Select
            value={eventTypeFilter}
            onValueChange={(val) => {
              setEventTypeFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-44 text-xs h-9 bg-background">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Events</SelectItem>
              <SelectItem value="figma.connected" className="text-xs">Figma Connected</SelectItem>
              <SelectItem value="figma.disconnected" className="text-xs">Figma Disconnected</SelectItem>
              <SelectItem value="source.registered" className="text-xs">Source Kit Registered</SelectItem>
              <SelectItem value="source.components.imported" className="text-xs">Source Kit Refreshed</SelectItem>
              <SelectItem value="source.removed" className="text-xs">Source Kit Removed</SelectItem>
              <SelectItem value="file.registered" className="text-xs">Consumer File Registered</SelectItem>
              <SelectItem value="file.removed" className="text-xs">Consumer File Removed</SelectItem>
              <SelectItem value="file.tracking.toggled" className="text-xs">File Tracking Toggled</SelectItem>
              <SelectItem value="scan.batch.started" className="text-xs">Scan Batch Started</SelectItem>
              <SelectItem value="scan.batch.completed" className="text-xs">Scan Batch Completed</SelectItem>
              <SelectItem value="scan.job.success" className="text-xs">Scan Job Success</SelectItem>
              <SelectItem value="scan.job.failed" className="text-xs">Scan Job Failed</SelectItem>
              <SelectItem value="scan.job.rate_limited" className="text-xs">Scan Rate Limited</SelectItem>
              <SelectItem value="settings.updated" className="text-xs">Settings Updated</SelectItem>
            </SelectContent>
          </Select>

          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onValueChange={(val) => {
              setSeverityFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-44 text-xs h-9 bg-background">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Severities</SelectItem>
              <SelectItem value="success" className="text-xs">Success</SelectItem>
              <SelectItem value="info" className="text-xs">Info</SelectItem>
              <SelectItem value="warning" className="text-xs">Warning</SelectItem>
              <SelectItem value="error" className="text-xs">Error</SelectItem>
            </SelectContent>
          </Select>

          {(eventTypeFilter !== 'all' || severityFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Timeline Section */}
      <div className="relative">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="size-3 rounded-full bg-border" />
                  <div className="w-[2px] flex-1 bg-border/40 min-h-[60px]" />
                </div>
                <div className="flex-1 bg-card/30 border border-border/40 p-4 rounded-lg h-20" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="border border-dashed border-border bg-card/25">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-10 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <BanIcon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm text-foreground">No events found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                No activity logs match your filters. Try clearing them or performing some actions first.
              </p>
              {(eventTypeFilter !== 'all' || severityFilter !== 'all' || searchQuery) && (
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 text-xs h-8">
                  Reset Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-5">
            {/* Timeline Vertical Spine Line */}
            <div className="absolute left-[9px] sm:left-[13px] top-3 bottom-3 w-[2px] bg-border/40" />

            {logs.map((log) => (
              <div key={log.id} className="relative flex gap-4 group">
                {/* Bullet circle dot indicator */}
                <div className="absolute -left-[22px] sm:-left-[26px] top-[14px] flex items-center justify-center">
                  <div className={`size-3 rounded-full ring-4 ${getSeverityDotClass(log.severity)}`} />
                </div>

                {/* Log item details card */}
                <div className="flex-1 bg-card/30 hover:bg-card/65 border border-border/50 hover:border-border/80 p-4 rounded-lg transition-all duration-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Icon + Title + Severity */}
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-md bg-muted/40 flex items-center justify-center border border-border/30">
                        {getEventIcon(log.eventType)}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground tracking-wide leading-none">{log.title}</h4>
                        {log.description && (
                          <p className="text-xs text-muted-foreground/90 mt-1.5 leading-relaxed">{log.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges & Timing */}
                    <div className="flex items-center gap-2.5 self-start sm:self-center ml-9 sm:ml-0">
                      {getSeverityBadge(log.severity)}
                      <span
                        className="text-[10px] text-muted-foreground/80 whitespace-nowrap cursor-help border-b border-dotted border-muted-foreground/35 pb-[1px]"
                        title={new Date(log.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata JSON chips */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30 ml-9">
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                        >
                          <span className="text-muted-foreground/60">{key}:</span>
                          <span className="font-semibold text-foreground/90">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium text-foreground">
              {Math.min(page * limit, totalLogs)}
            </span>{' '}
            of <span className="font-medium text-foreground">{totalLogs}</span> events
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="text-xs gap-1 h-8 px-2"
            >
              <ChevronLeftIcon className="size-4" /> Previous
            </Button>
            <span className="text-xs font-medium text-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="text-xs gap-1 h-8 px-2"
            >
              Next <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
