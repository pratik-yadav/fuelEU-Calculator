import useSWR from 'swr';
import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import { swrFetcher, apiClient } from '@/lib/api-client';
import type { Route, RouteFilters } from '@/types';

export function buildRoutesKey(filters?: RouteFilters): string {
  const params = new URLSearchParams();
  if (filters?.fuelType) params.set('fuelType', filters.fuelType);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.vesselType) params.set('vesselType', filters.vesselType);
  const qs = params.toString();
  return qs ? `/routes?${qs}` : '/routes';
}

export function useRoutes(filters?: RouteFilters) {
  const key = buildRoutesKey(filters);
  const { data, error, isLoading, mutate } = useSWR<Route[]>(key, swrFetcher);
  return { routes: data ?? [], isLoading, error: error as Error | undefined, mutate };
}

export function useSetBaseline() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setBaseline = async (id: string): Promise<Route> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiClient.post<Route>(`/routes/${id}/baseline`);
      // Revalidate all routes keys
      await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/routes'), undefined, { revalidate: true });
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { setBaseline, isLoading, error };
}
