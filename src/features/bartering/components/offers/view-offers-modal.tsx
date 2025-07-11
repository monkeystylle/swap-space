/**
 * ViewOffersModal Component
 * Facebook-style modal that displays a posted item and its offers
 * Shows the main post at the top and list of offers below
 */

'use client';

import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { OffersList } from './offers-list';

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
  // Format the date for display
  const formattedDate = formatDistanceToNow(new Date(postedItem.createdAt), {
    addSuffix: true,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Posted Item Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {/* Item Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                    {postedItem.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {postedItem.user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                variant={postedItem.status === 'OPEN' ? 'default' : 'secondary'}
                className={
                  postedItem.status === 'OPEN'
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                }
              >
                {postedItem.status}
              </Badge>
            </div>

            {/* Item Title */}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {postedItem.title}
            </h2>

            {/* Item Details */}
            <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
              {postedItem.details}
            </p>

            {/* Item Image */}
            {postedItem.imageSecureUrl && (
              <div className="rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postedItem.imageSecureUrl}
                  alt={postedItem.title}
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            )}

            {/* Offer Count */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {postedItem._count.offers}{' '}
                {postedItem._count.offers === 1 ? 'offer' : 'offers'}
              </p>
            </div>
          </div>

          {/* Separator */}
          <Separator />

          {/* Offers Section */}
          <div>
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
