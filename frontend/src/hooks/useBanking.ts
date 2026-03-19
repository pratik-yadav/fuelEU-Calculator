import useSWR from 'swr';
import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import { swrFetcher, apiClient } from '@/lib/api-client';
import type { BankEntry, BankRequest, ApplyRequest } from '@/types';

export function useBankingRecords(shipId?: string, year?: number) {
  const key = shipId && year ? `/banking/records?shipId=${shipId}&year=${year}` : null;
  const { data, error, isLoading, mutate } = useSWR<BankEntry[]>(key, swrFetcher);
  return { records: data ?? [], isLoading, error: error as Error | undefined, mutate };
}

export function useBankSurplus(shipId?: string, year?: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (body: BankRequest): Promise<BankEntry> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<BankEntry>('/banking/bank', body);
      if (shipId && year) {
        await globalMutate(`/banking/records?shipId=${shipId}&year=${year}`);
        await globalMutate(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
        await globalMutate(`/compliance/cb?shipId=${shipId}&year=${year}`);
      }
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useApplyBank(shipId?: string, year?: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (body: ApplyRequest): Promise<BankEntry> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<BankEntry>('/banking/apply', body);
      if (shipId && year) {
        await globalMutate(`/banking/records?shipId=${shipId}&year=${year}`);
        await globalMutate(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
        await globalMutate(`/compliance/cb?shipId=${shipId}&year=${year}`);
      }
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
