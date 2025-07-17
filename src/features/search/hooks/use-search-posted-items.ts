/**
 * Custom hook for searching posted items with infinite scroll
 * Uses React Query for data fetching and caching
 */

'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import {
  searchPostedItems,
  SearchPostedItemsParams,
} from '../queries/search-posted-items';

export const useSearchPostedItems = (params: SearchPostedItemsParams) => {
  return useInfiniteQuery({
    queryKey: ['search-posted-items', params.searchTerm],
    queryFn: ({ pageParam = 1 }) =>
      searchPostedItems({
        ...params,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
