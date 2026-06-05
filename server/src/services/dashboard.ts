import { prisma } from '../config/prisma.js';

const DEFAULT_LAYOUT = [
  { widgetId: 'summary_metrics', order: 1, size: 'full', visible: true, settings: {} },
  { widgetId: 'direct_instances_trend', order: 2, size: 'large', visible: true, settings: {} },
  { widgetId: 'recent_usage_changes', order: 3, size: 'medium', visible: true, settings: {} },
  { widgetId: 'top_used_components', order: 4, size: 'medium', visible: true, settings: {} },
  { widgetId: 'files_needing_attention', order: 5, size: 'large', visible: true, settings: {} },
  { widgetId: 'governance_health', order: 6, size: 'full', visible: true, settings: {} },
  { widgetId: 'scan_success_rate', order: 7, size: 'small', visible: false, settings: {} },
  { widgetId: 'unused_in_tracked_files', order: 8, size: 'medium', visible: false, settings: {} },
  { widgetId: 'low_usage_components', order: 9, size: 'medium', visible: false, settings: {} },
];

export async function getLayout() {
  let pref = await prisma.dashboardPreference.findFirst({
    where: { isDefault: true },
  });

  if (!pref) {
    pref = await prisma.dashboardPreference.create({
      data: {
        name: 'Default Layout',
        isDefault: true,
        layoutJson: JSON.stringify(DEFAULT_LAYOUT),
      },
    });
  }

  return {
    id: pref.id,
    name: pref.name,
    layout: JSON.parse(pref.layoutJson),
    updatedAt: pref.updatedAt.toISOString(),
  };
}

export async function saveLayout(layout: Array<{
  widgetId: string;
  order: number;
  size: string;
  visible: boolean;
  settings: Record<string, unknown>;
}>) {
  let pref = await prisma.dashboardPreference.findFirst({
    where: { isDefault: true },
  });

  if (!pref) {
    pref = await prisma.dashboardPreference.create({
      data: {
        name: 'Default Layout',
        isDefault: true,
        layoutJson: JSON.stringify(layout),
      },
    });
  } else {
    pref = await prisma.dashboardPreference.update({
      where: { id: pref.id },
      data: { layoutJson: JSON.stringify(layout) },
    });
  }

  return {
    id: pref.id,
    name: pref.name,
    layout: JSON.parse(pref.layoutJson),
    updatedAt: pref.updatedAt.toISOString(),
  };
}

export async function resetLayout() {
  return saveLayout(DEFAULT_LAYOUT);
}
