'use client';

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const CONFIGURATION = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 15 * 60 * 1000, // 15 minutes - keep prefetched data longer
      retry: 1, // Reduce retries for faster failure feedback
      refetchOnWindowFocus: false, // Prevent refetch on window focus for better UX
      refetchOnReconnect: false, // Prevent refetch on reconnect for smoother UX
      networkMode: 'online' as const, // Only fetch when online
    },
  },
};

const makeQueryClient = () => {
  return new QueryClient(CONFIGURATION);
};

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

type ReactQueryProviderProps = {
  children: React.ReactNode;
};

const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { ReactQueryProvider };
