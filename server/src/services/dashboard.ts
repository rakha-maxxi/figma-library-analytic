import { prisma } from '../config/prisma.js';

const DEFAULT_LAYOUT = [
  { widgetId: 'health_summary', order: 1, size: 'full', visible: true, settings: {} },
  { widgetId: 'adoption_coverage', order: 2, size: 'medium', visible: true, settings: {} },
  { widgetId: 'recent_usage_changes', order: 3, size: 'medium', visible: true, settings: {} },
  { widgetId: 'direct_instances_trend', order: 4, size: 'large', visible: true, settings: {} },
  { widgetId: 'scan_reliability', order: 5, size: 'small', visible: true, settings: {} },
  { widgetId: 'top_used_components', order: 6, size: 'medium', visible: true, settings: {} },
  { widgetId: 'next_actions', order: 7, size: 'medium', visible: true, settings: {} },
  { widgetId: 'files_needing_attention', order: 8, size: 'large', visible: true, settings: {} },
  { widgetId: 'governance_health', order: 9, size: 'small', visible: true, settings: {} },
  { widgetId: 'scan_success_rate', order: 10, size: 'small', visible: false, settings: {} },
  { widgetId: 'unused_in_tracked_files', order: 11, size: 'medium', visible: false, settings: {} },
  { widgetId: 'low_usage_components', order: 12, size: 'medium', visible: false, settings: {} },
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
