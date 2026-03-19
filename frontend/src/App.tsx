import { SWRConfig } from 'swr';
import { swrFetcher } from '@/lib/api-client';
import { AppShell } from './layout/AppShell';

export default function App() {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        errorRetryCount: 2,
        dedupingInterval: 2000,
      }}
    >
      <AppShell />
    </SWRConfig>
  );
}
