/**
 * ViewOffersModal Component
 * Facebook-style modal that displays a posted item and its offers
 * Shows the main post at the top and list of offers below
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { OffersList } from './offers-list';
import { PostedItemModalDisplay } from '../posted-items/posted-item-modal-display';
import { CreateOfferForm } from './create-offer-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { canUserMakeOffer } from '../../queries/get-offers';

interface ViewOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  postedItem: PostedItemWithDetails;
}

export const ViewOffersModal = ({
  isOpen,
  onClose,
  postedItem,
}: ViewOffersModalProps) => {
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const { user, isFetched } = useAuth();
  const queryClient = useQueryClient();

  // Check if user can make an offer using the server function
  const { data: offerEligibility, isPending: isCheckingEligibility } = useQuery(
    {
      queryKey: ['canUserMakeOffer', postedItem.id],
      queryFn: () => canUserMakeOffer(postedItem.id),
      enabled: isFetched && isOpen, // Only run when modal is open and auth is fetched
    }
  );

  const handleCreateOfferSuccess = () => {
    setShowCreateOfferModal(false);
    // Invalidate the eligibility check so it updates to show user already has an offer
    queryClient.invalidateQueries({
      queryKey: ['canUserMakeOffer', postedItem.id],
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 drop-shadow-lg [&>button]:top-5 [&>button]:right-4 ">
          <DialogHeader className="px-4 py-4 border-b-2 ">
            <DialogTitle className="text-lg font-semibold truncate max-w-[580px] mx-auto ">
              {postedItem.title} - Offers
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pb-20">
            {/* Posted Item Display - Full width, no padding */}
            <PostedItemModalDisplay postedItem={postedItem} />

            {/* Offers Section */}
            <div className="px-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Offers
              </h3>
              <OffersList postedItemId={postedItem.id} />
            </div>
          </div>

          {/* Fixed Footer - Always show */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            {!user ? (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Sign in to make an offer
                </p>
                <Button disabled className="w-full" size="sm">
                  Make Offer
                </Button>
              </div>
            ) : isCheckingEligibility ? (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Checking eligibility...
                </p>
                <Button disabled className="w-full" size="sm">
                  Make Offer
                </Button>
              </div>
            ) : offerEligibility?.canOffer ? (
              <Button
                onClick={() => setShowCreateOfferModal(true)}
                className="w-full"
                size="sm"
              >
                Make Offer
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {offerEligibility?.reason || 'Cannot make offer'}
                </p>
                <Button disabled className="w-full" size="sm">
                  Make Offer
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Offer Modal */}
      <Dialog
        open={showCreateOfferModal}
        onOpenChange={setShowCreateOfferModal}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
          </DialogHeader>
          <CreateOfferForm
            postedItemId={postedItem.id}
            onSuccess={handleCreateOfferSuccess}
            onCancel={() => setShowCreateOfferModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
