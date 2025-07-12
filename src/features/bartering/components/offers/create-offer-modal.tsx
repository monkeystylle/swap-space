/**
 * CreateOfferModal Component
 * Modal that displays posted item details and form to create or edit an offer
 * Automatically detects if user already has an offer and switches to edit mode
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { canUserMakeOffer } from '../../queries/get-offers';
import { OfferForm } from './offer-form';
import { UpdateOfferForm } from './update-offer-form';
import { PostedItemModalDisplay } from '../posted-items/posted-item-modal-display';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  postedItem: PostedItemWithDetails;
}

export const CreateOfferModal = ({
  isOpen,
  onClose,
  postedItem,
}: CreateOfferModalProps) => {
  // Check if user can make an offer or if they already have one
  const {
    data: offerEligibility,
    isLoading: isCheckingEligibility,
    isError,
    error,
  } = useQuery({
    queryKey: ['offer-eligibility', postedItem.id],
    queryFn: () => canUserMakeOffer(postedItem.id),
    enabled: isOpen, // Only run when modal is open
    staleTime: 0, // Always check fresh data
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 border-b">
          <DialogTitle className="text-lg font-semibold">
            {offerEligibility?.existingOffer
              ? 'Edit Your Offer'
              : 'Make an Offer'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Posted Item Display - Full width, no padding */}
          <PostedItemModalDisplay postedItem={postedItem} />

          {/* Separator */}
          <Separator />

          {/* Offer Form Section */}
          <div className="px-4 py-4">
            {isCheckingEligibility ? (
              // Loading state
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Checking offer eligibility...
                </span>
              </div>
            ) : isError ? (
              // Error state
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to check offer eligibility.{' '}
                  {error?.message || 'Please try again.'}
                </AlertDescription>
              </Alert>
            ) : offerEligibility?.canOffer === false ? (
              // Cannot make offer
              <Alert>
                <AlertDescription>{offerEligibility.reason}</AlertDescription>
              </Alert>
            ) : offerEligibility?.existingOffer ? (
              // Edit existing offer
              <UpdateOfferForm
                offerId={offerEligibility.existingOffer.id}
                initialData={{
                  content: offerEligibility.existingOffer.content,
                  imageSecureUrl: offerEligibility.existingOffer.imageSecureUrl,
                }}
                onSuccess={onClose}
                onCancel={onClose}
              />
            ) : (
              // Create new offer
              <OfferForm
                postedItemId={postedItem.id}
                onSuccess={onClose}
                onCancel={onClose}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
