import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';
import type { ComplianceCB, AdjustedCB } from '@/types';

export function useComplianceCB(shipId?: string, year?: number) {
  const key = shipId && year ? `/compliance/cb?shipId=${shipId}&year=${year}` : null;
  const { data, error, isLoading, mutate } = useSWR<ComplianceCB>(key, swrFetcher);
  return { cb: data ?? null, isLoading, error: error as Error | undefined, mutate };
}

export function useAdjustedCB(shipId?: string, year?: number) {
  const key = shipId && year ? `/compliance/adjusted-cb?shipId=${shipId}&year=${year}` : null;
  const { data, error, isLoading, mutate } = useSWR<AdjustedCB>(key, swrFetcher);
  return { adjustedCB: data ?? null, isLoading, error: error as Error | undefined, mutate };
}
