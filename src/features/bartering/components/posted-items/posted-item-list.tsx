/**
 * PostedItemsList Component
 * Fetches and displays all posted items in a feed format
 * Handles loading states, empty states, and real-time updates
 */

'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getPostedItems,
  PostedItemWithDetails,
} from '../../queries/get-posted-items';
import { PostedItemCard } from './posted-item-card';

interface PostedItemsListProps {
  // Optional filter for user-specific posts
  userId?: string;
  // Option to show only open posts
  openOnly?: boolean;
  className?: string;
}

export const PostedItemsList = ({
  userId,
  openOnly = false,
  className = '',
}: PostedItemsListProps) => {
  const [postedItems, setPostedItems] = useState<PostedItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posted items data
  const fetchPostedItems = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // For now, we'll use the main getPostedItems function
      // In the future, we can extend this to support userId and openOnly filters
      const items = await getPostedItems();

      // Apply client-side filtering if needed
      let filteredItems = items;

      if (userId) {
        filteredItems = filteredItems.filter(item => item.userId === userId);
      }

      if (openOnly) {
        filteredItems = filteredItems.filter(item => item.status === 'OPEN');
      }

      setPostedItems(filteredItems);
    } catch (err) {
      console.error('Failed to fetch posted items:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPostedItems();
  }, [userId, openOnly]); // Refetch when filters change

  // Handle refresh
  const handleRefresh = () => {
    fetchPostedItems(true);
  };

  // Handle individual item updates (after edit/delete)
  const handleItemUpdate = () => {
    fetchPostedItems(true);
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
                {error}
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
              {userId
                ? 'No posts yet'
                : openOnly
                ? 'No open posts available'
                : 'No posts to show'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {userId
                ? "This user hasn't posted any items yet."
                : openOnly
                ? 'There are currently no open posts available for trading.'
                : 'Be the first to share something for trade!'}
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
      {/* Refresh button - optional, could be hidden */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {userId
            ? 'Posted Items'
            : openOnly
            ? 'Available for Trading'
            : 'Recent Posts'}
        </h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={isRefreshing}
          className="text-gray-600 dark:text-gray-400"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
