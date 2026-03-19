import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import { apiClient } from '@/lib/api-client';
import type { PoolMember, PoolRequest } from '@/types';

export function useCreatePool() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<PoolMember[] | null>(null);

  const createPool = async (body: PoolRequest): Promise<PoolMember[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const members = await apiClient.post<PoolMember[]>('/pools', body);
      setResult(members);
      for (const shipId of body.members) {
        await globalMutate(`/compliance/adjusted-cb?shipId=${shipId}&year=${body.year}`);
        await globalMutate(`/compliance/cb?shipId=${shipId}&year=${body.year}`);
      }
      return members;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };
  return { createPool, isLoading, error, result, reset };
}
