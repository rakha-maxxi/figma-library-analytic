import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { getAllWidgetDefs } from '../../lib/widget-registry';
import type { WidgetLayoutItem } from '../../lib/dashboard-types';
import { PlusIcon, Trash2Icon, ChevronUpIcon, ChevronDownIcon, Settings2Icon, RotateCcwIcon } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  layout: WidgetLayoutItem[];
  onLayoutChange: (layout: WidgetLayoutItem[]) => void;
  onReset: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

const CATEGORIES = ['Usage', 'Components', 'Files', 'Scans', 'Governance', 'Activity'] as const;

export const CustomizeSheet: React.FC<Props> = ({ open, onClose, layout, onLayoutChange, onReset, onSave, isSaving }) => {
  const activeIds = new Set(layout.map(l => l.widgetId));
  const defs = getAllWidgetDefs();
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    widgets: defs.filter(d => d.category === cat && !activeIds.has(d.widgetId)),
  })).filter(g => g.widgets.length > 0);

  const addWidget = (widgetId: string) => {
    const def = defs.find(d => d.widgetId === widgetId);
    if (!def) return;
    const nextOrder = Math.max(0, ...layout.map(l => l.order)) + 1;
    onLayoutChange([...layout, { widgetId, order: nextOrder, size: def.defaultSize, visible: true, settings: {} }]);
  };

  const removeWidget = (widgetId: string) => {
    onLayoutChange(layout.filter(l => l.widgetId !== widgetId));
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const sorted = [...layout].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(l => l.widgetId === widgetId);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
      [sorted[idx - 1].order, sorted[idx].order] = [sorted[idx].order, sorted[idx - 1].order];
    } else if (direction === 'down' && idx < sorted.length - 1) {
      [sorted[idx + 1].order, sorted[idx].order] = [sorted[idx].order, sorted[idx + 1].order];
    }
    onLayoutChange(sorted);
  };

  const changeSize = (widgetId: string, size: WidgetLayoutItem['size']) => {
    onLayoutChange(layout.map(l => l.widgetId === widgetId ? { ...l, size } : l));
  };

  const sorted = [...layout].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[450px] sm:max-w-[450px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2Icon className="size-4" /> Customize Dashboard
          </SheetTitle>
          <SheetDescription className="text-xs">Add, remove, reorder, and resize widgets.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          {sorted.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Widgets</p>
              <div className="space-y-1.5">
                {sorted.map(item => {
                  const def = defs.find(d => d.widgetId === item.widgetId);
                  return (
                    <div key={item.widgetId} className="border border-border/60 rounded-md p-2.5 bg-muted/10 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{def?.title || item.widgetId}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {def?.supportedSizes.map(s => (
                            <button
                              key={s}
                              onClick={() => changeSize(item.widgetId, s)}
                              className={`text-[9px] px-1.5 py-0.5 rounded border ${item.size === s ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => moveWidget(item.widgetId, 'up')} className="p-1 hover:text-foreground text-muted-foreground"><ChevronUpIcon className="size-3" /></button>
                        <button onClick={() => moveWidget(item.widgetId, 'down')} className="p-1 hover:text-foreground text-muted-foreground"><ChevronDownIcon className="size-3" /></button>
                        <button onClick={() => removeWidget(item.widgetId)} className="p-1 hover:text-rose-500 text-muted-foreground"><Trash2Icon className="size-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {grouped.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Widgets</p>
              {grouped.map(g => (
                <div key={g.category} className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1.5">{g.category}</p>
                  <div className="space-y-1">
                    {g.widgets.map(def => (
                      <div key={def.widgetId} className="flex items-center justify-between text-xs border border-border/40 rounded p-2 bg-muted/5">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{def.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{def.description}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 text-xs shrink-0 ml-2" onClick={() => addWidget(def.widgetId)}>
                          <PlusIcon className="size-3" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3 mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="text-xs flex-1" onClick={onReset}><RotateCcwIcon className="size-3 mr-1" /> Reset</Button>
          <Button size="sm" className="text-xs flex-1" onClick={onSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Layout'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
