import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';
import type { ComparisonResult } from '@/types';

export function useComparison() {
  const { data, error, isLoading, mutate } = useSWR<ComparisonResult[]>(
    '/routes/comparison',
    swrFetcher,
  );
  return {
    comparison: data ?? [],
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}
