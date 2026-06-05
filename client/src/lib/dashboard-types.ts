export interface WidgetLayoutItem {
  widgetId: string;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface WidgetDefinition {
  widgetId: string;
  title: string;
  description: string;
  category: 'Usage' | 'Components' | 'Files' | 'Scans' | 'Governance' | 'Activity';
  defaultSize: 'small' | 'medium' | 'large' | 'full';
  supportedSizes: Array<'small' | 'medium' | 'large' | 'full'>;
}

export const SIZE_COLS: Record<string, string> = {
  small: 'col-span-1 md:col-span-1',
  medium: 'col-span-1 md:col-span-3',
  large: 'col-span-1 md:col-span-4',
  full: 'col-span-1 md:col-span-6',
};

const STORAGE_KEY = 'ds_tracker_dashboard_layout';

export function loadLocalLayout(): WidgetLayoutItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveLocalLayout(layout: WidgetLayoutItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
}
