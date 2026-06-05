import React from 'react';
import type { WidgetDefinition, WidgetLayoutItem } from '../lib/dashboard-types';

export interface WidgetProps {
  layout: WidgetLayoutItem;
}

type WidgetComponent = React.FC<WidgetProps>;

const widgetMap = new Map<string, { def: WidgetDefinition; component: WidgetComponent }>();

export function registerWidget(def: WidgetDefinition, component: WidgetComponent) {
  widgetMap.set(def.widgetId, { def, component });
}

export function getWidgetDef(id: string): WidgetDefinition | undefined {
  return widgetMap.get(id)?.def;
}

export function getWidgetComponent(id: string): WidgetComponent | undefined {
  return widgetMap.get(id)?.component;
}

export function getAllWidgetDefs(): WidgetDefinition[] {
  return Array.from(widgetMap.values()).map(v => v.def);
}
