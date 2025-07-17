/**
 * PostedItemGridCard Component
 * Compact card component optimized for grid layout
 * Shows image, title, and number of offers
 */

'use client';

import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostedItemWithDetails } from '../../queries/posted-item.types';

interface PostedItemGridCardProps {
  postedItem: PostedItemWithDetails;
  onClick: () => void;
}

export const PostedItemGridCard = ({
  postedItem,
  onClick,
}: PostedItemGridCardProps) => {
  return (
    <Card
      className="w-full cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800  overflow-hidden">
          {postedItem.imageSecureUrl ? (
            <Image
              src={postedItem.imageSecureUrl}
              alt={postedItem.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No image
                </p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={postedItem.status === 'OPEN' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {postedItem.status}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 overflow-hidden">
            <span className="block truncate">{postedItem.title}</span>
          </h3>

          {/* Offers Count */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">
                {postedItem._count.offers}{' '}
                {postedItem._count.offers === 1 ? 'offer' : 'offers'}
              </span>
            </div>

            {/* User indicator */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              by {postedItem.user.username}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
