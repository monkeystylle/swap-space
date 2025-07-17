/**
 * ViewOffersModal Component
 * Facebook-style modal that displays a posted item and its offers
 * Shows the main post at the top and list of offers below
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 drop-shadow-lg [&>button]:top-5 [&>button]:right-4 ">
        <DialogHeader className="px-4 py-4 border-b-2 ">
          <DialogTitle className="text-lg font-semibold truncate max-w-[580px] mx-auto ">
            {postedItem.title} - Offers
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  );
};
