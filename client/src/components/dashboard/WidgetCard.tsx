import React from 'react';
import { SIZE_COLS, type WidgetLayoutItem } from '../../lib/dashboard-types';

interface Props {
  layout: WidgetLayoutItem;
  title: string;
  children: React.ReactNode;
}

export const WidgetCard: React.FC<Props> = ({ layout, title, children }) => {
  const colClass = SIZE_COLS[layout.size] || 'col-span-2';
  return (
    <div className={`${colClass} border border-border bg-card rounded-lg flex flex-col overflow-hidden`}>
      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
};
