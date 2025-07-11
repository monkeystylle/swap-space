/**
 * OffersList Component
 * Displays a list of offers for a specific posted item
 * Uses React Query for data fetching with loading and error states
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import { getOffersForPostedItem } from '../../queries/get-offers';
import { OfferCard } from './offer-card';

interface OffersListProps {
  postedItemId: string;
  onUpdate?: () => void; // Optional callback for backward compatibility
}

export const OffersList = ({ postedItemId, onUpdate }: OffersListProps) => {
  // React Query to fetch offers
  const {
    data: offers = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['offers', postedItemId],
    queryFn: () => getOffersForPostedItem(postedItemId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Loading State
  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <MessageCircle className="h-4 w-4" />
          <span>Loading offers...</span>
        </div>
        {/* Loading skeletons */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load offers. {error?.message || 'Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty State
  if (offers.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No offers yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Be the first to make an offer on this item!
        </p>
      </div>
    );
  }

  // Success State - Display offers
  return (
    <div className="space-y-1">
      {/* Offers Header */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <MessageCircle className="h-4 w-4" />
        <span>
          {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
        </span>
      </div>

      {/* Offers List */}
      <div className="space-y-2">
        {offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
};
