/**
 * ViewOffersModal Component
 * Facebook-style modal that displays a posted item and its offers
 * Shows the main post at the top and list of offers below
 */

'use client';

import { X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { OffersList } from './offers-list';
import { PostedItemModalDisplay } from '../posted-items/posted-item-modal-display';

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 border-b">
          <DialogTitle className="text-lg font-semibold">
            {postedItem.title} - Offers
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

          {/* Offers Section */}
          <div className="px-4 py-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Offers
            </h3>
            <OffersList postedItemId={postedItem.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
