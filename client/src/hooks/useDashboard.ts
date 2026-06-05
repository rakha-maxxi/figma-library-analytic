import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { WidgetLayoutItem } from '../lib/dashboard-types';
import { saveLocalLayout } from '../lib/dashboard-types';

export function useDashboardLayout() {
  return useQuery<WidgetLayoutItem[]>({
    queryKey: ['dashboardLayout'],
    queryFn: async () => {
      const data = await api.get<{ layout: WidgetLayoutItem[] }>('/api/dashboard/layout');
      return data.layout;
    },
    staleTime: 30000,
  });
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (layout: WidgetLayoutItem[]) => {
      const result = await api.put<{ layout: WidgetLayoutItem[] }>('/api/dashboard/layout', { layout });
      saveLocalLayout(result.layout);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardLayout'] });
    },
  });
}

export function useResetDashboardLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await api.post<{ layout: WidgetLayoutItem[] }>('/api/dashboard/layout/reset');
      saveLocalLayout(data.layout);
      return data.layout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardLayout'] });
    },
  });
}
