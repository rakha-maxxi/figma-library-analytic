import React from 'react';
import { SIZE_COLS, type WidgetLayoutItem } from '../../lib/dashboard-types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface Props {
  layout: WidgetLayoutItem;
  title: string;
  children: React.ReactNode;
}

export const WidgetCard: React.FC<Props> = ({ layout, title, children }) => {
  const colClass = SIZE_COLS[layout.size] || 'col-span-2';
  return (
    <Card className={`${colClass} flex flex-col overflow-hidden h-full ring-1 ring-foreground/10`} size="sm">
      <CardHeader className="border-b border-border bg-muted/10 py-2.5">
        <CardTitle className="text-xs font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">{children}</CardContent>
    </Card>
  );
};
