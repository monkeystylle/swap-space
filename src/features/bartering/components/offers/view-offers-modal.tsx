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
import { useQueryClient } from '@tanstack/react-query';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { OffersList } from './offers-list';
import { PostedItemModalDisplay } from '../posted-items/posted-item-modal-display';
import { CreateOfferForm } from './create-offer-form';
import { useAuth } from '@/features/auth/hooks/use-auth';

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

  // Simple client-side checks - no server calls needed
  const isOwner = user && postedItem.userId === user.id;
  const isPostClosed = postedItem.status !== 'OPEN';

  const handleCreateOfferSuccess = () => {
    setShowCreateOfferModal(false);
    // Invalidate offers to refresh the count
    queryClient.invalidateQueries({
      queryKey: ['offers'],
    });
  };

  // Get button state and text
  const getButtonState = () => {
    if (!isFetched) {
      return { disabled: true, text: 'Loading...', message: null };
    }

    if (!user) {
      return { disabled: true, text: 'Sign in to make offer', message: null };
    }

    if (isOwner) {
      return { disabled: true, text: 'Your item', message: null };
    }

    if (isPostClosed) {
      return { disabled: true, text: 'Item closed', message: null };
    }

    return { disabled: false, text: 'Make Offer', message: null };
  };

  const buttonState = getButtonState();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 drop-shadow-lg [&>button]:top-5 [&>button]:right-4 ">
          <DialogHeader className="px-4 py-4 border-b-2 ">
            <DialogTitle className="text-lg font-semibold truncate max-w-[580px] mx-auto ">
              {postedItem.title} - Offers
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pb-16">
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

          {/* Fixed Footer - Always show with consistent height */}
          <div className="absolute   bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-5">
            <Button
              onClick={
                buttonState.disabled
                  ? undefined
                  : () => setShowCreateOfferModal(true)
              }
              disabled={buttonState.disabled}
              className="w-full max-w-xs "
            >
              {buttonState.text}
            </Button>
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
