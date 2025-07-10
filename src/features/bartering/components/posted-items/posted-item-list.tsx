/**
 * PostedItemsList Component
 * Fetches and displays posted items for a specific user using React Query
 * Handles loading states, empty states, and real-time updates
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getPostedItemsByUser } from '../../queries/get-posted-items-by-user';
import { PostedItemCard } from './posted-item-card';

interface PostedItemsListProps {
  // Required user ID to fetch posts for
  userId: string;
  className?: string;
}

export const PostedItemsList = ({
  userId,
  className = '',
}: PostedItemsListProps) => {
  const {
    data: postedItems = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['posted-items', userId],
    queryFn: () => getPostedItemsByUser(userId),
    enabled: !!userId, // Only run query if userId is provided
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle individual item updates (after edit/delete)
  const handleItemUpdate = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="w-full">
            <CardContent className="p-6">
              {/* Header skeleton */}
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* Content skeleton */}
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />

              {/* Image skeleton */}
              <Skeleton className="h-64 w-full rounded-lg mb-4" />

              {/* Actions skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="text-red-500 mb-4">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Failed to load posts. Please try again.
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (postedItems.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No posts yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This user hasn&apos;t posted any items yet.
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content with posts
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Posted Items
        </h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={isRefetching}
          className="text-gray-600 dark:text-gray-400"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`}
          />
          {isRefetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Posts list */}
      <div className="space-y-6">
        {postedItems.map(postedItem => (
          <PostedItemCard
            key={postedItem.id}
            postedItem={postedItem}
            onUpdate={handleItemUpdate}
          />
        ))}
      </div>

      {/* Load more section - for future pagination */}
      {postedItems.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {postedItems.length}{' '}
            {postedItems.length === 1 ? 'post' : 'posts'}
          </p>
          {/* Future: Add "Load More" button for pagination */}
        </div>
      )}
    </div>
  );
};
