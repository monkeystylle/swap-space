/**
 * PostedItemsGrid Component
 * Displays posted items in a responsive grid layout with infinite scroll
 */

'use client';

import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchPostedItems } from '@/features/search/hooks/use-search-posted-items';
import { PostedItemGridCard } from './posted-item-grid-card';
import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { ViewOffersModal } from '../offers/view-offers-modal';

interface PostedItemsGridProps {
  searchTerm?: string;
  category?: 'ITEM' | 'SERVICE' | 'ALL';
}

export const PostedItemsGrid = ({
  searchTerm = '',
  category = 'ALL',
}: PostedItemsGridProps) => {
  const [selectedPostedItem, setSelectedPostedItem] =
    useState<PostedItemWithDetails | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);

  // Infinite scroll with search
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useSearchPostedItems({ searchTerm, category });

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  // Trigger next page load when bottom is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle card click to show modal
  const handleCardClick = (postedItem: PostedItemWithDetails) => {
    setSelectedPostedItem(postedItem);
    setShowOffersModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowOffersModal(false);
    setSelectedPostedItem(null);
  };

  // Loading state
  if (status === 'pending') {
    return (
      <div className="space-y-6">
        {/* Loading skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load posted items.{' '}
          {error?.message || 'Please try again later.'}
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Flatten all pages into a single array
  const allItems = data?.pages.flatMap(page => page.items) || [];

  // Empty state
  if (allItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {searchTerm ? 'No items found' : 'No posted items yet'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {searchTerm
            ? `No items match your search "${searchTerm}"`
            : 'Be the first to post an item!'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchTerm
              ? `Search results for "${searchTerm}"`
              : 'Swap Space - Your Trade, swap and Exchange Platform'}
            {' • '}
            {/* {allItems.length} {allItems.length === 1 ? 'item' : 'items'} */}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allItems.map(postedItem => (
            <PostedItemGridCard
              key={postedItem.id}
              postedItem={postedItem}
              onClick={() => handleCardClick(postedItem)}
            />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={ref} className="flex justify-center py-6">
            {isFetchingNextPage ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading more items...
                </span>
              </div>
            ) : (
              <Button
                onClick={() => fetchNextPage()}
                variant="outline"
                size="sm"
              >
                Load More
              </Button>
            )}
          </div>
        )}

        {/* End of results */}
        {!hasNextPage && allItems.length > 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You&apos;ve reached the end of the results
            </p>
          </div>
        )}
      </div>

      {/* View Offers Modal */}
      {selectedPostedItem && (
        <ViewOffersModal
          isOpen={showOffersModal}
          onClose={handleModalClose}
          postedItem={selectedPostedItem}
        />
      )}
    </>
  );
};
