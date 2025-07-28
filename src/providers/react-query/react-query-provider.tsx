'use client';

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const CONFIGURATION = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - increased from 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes - how long to keep data in cache after component unmounts
      retry: 1, // Reduce retries for faster failure feedback
      refetchOnWindowFocus: false, // Prevent refetch on window focus for better UX
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
