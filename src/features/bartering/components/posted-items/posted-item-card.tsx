/**
 * PostedItemCard Component
 * Displays individual posted items in Facebook-style card format
 * Shows user info, post content, image, and action buttons
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import {
  MoreHorizontal,
  MessageCircle,
  Edit,
  Trash2,
  Settings,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { deletePostedItem } from '../../actions/delete-posted-item';
import { UpdatePostedItemForm } from './update-posted-item-form';
import { ViewOffersModal } from '../offers/view-offers-modal';
import { updatePostedItemStatus } from '../../actions/update-posted-item-status';
import { getAvatarColor } from '@/utils/avatar-colors';
import { capitalizeFirstLetter } from '@/utils/text-utils';
import Link from 'next/link';
import { usersWallPath } from '@/paths';

interface PostedItemCardProps {
  postedItem: PostedItemWithDetails;
  onUpdate?: () => void; // Callback to refresh the list after updates (now optional since React Query handles it)
}

export const PostedItemCard = ({
  postedItem,
  onUpdate,
}: PostedItemCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showMainDropdown, setShowMainDropdown] = useState(false);

  // React Query setup
  const queryClient = useQueryClient();

  // Delete mutation
  const deletePostMutation = useMutation({
    mutationFn: deletePostedItem,
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);

        // Comprehensive query invalidation to update all views
        queryClient.invalidateQueries({
          queryKey: ['posted-items'],
        });

        // Invalidate search queries (homepage) to remove deleted items
        queryClient.invalidateQueries({
          queryKey: ['search-posted-items'],
        });

        // Close dialog and call optional callback for backward compatibility
        setShowDeleteDialog(false);
        onUpdate?.();
      } else {
        toast.error(result.message);
        console.error('Failed to delete post:', result.message);
      }
    },
    onError: error => {
      console.error('Unexpected error during deletion:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });

  // Status update mutation with optimistic updates
  const updateStatusMutation = useMutation({
    mutationFn: ({
      postId,
      status,
    }: {
      postId: string;
      status: 'OPEN' | 'DONE';
    }) => updatePostedItemStatus(postId, status),

    onMutate: async ({ postId, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['posted-items'] });
      await queryClient.cancelQueries({ queryKey: ['search-posted-items'] });

      // Snapshot the previous values for rollback
      const previousPostedItems = queryClient.getQueriesData({
        queryKey: ['posted-items'],
      });
      const previousSearchResults = queryClient.getQueriesData({
        queryKey: ['search-posted-items'],
      });

      // Optimistically update all relevant queries
      queryClient.setQueriesData(
        { queryKey: ['posted-items'] },
        (oldData: unknown) => {
          if (!oldData) return oldData;

          // Handle different data structures (arrays, paginated data, etc.)
          if (Array.isArray(oldData)) {
            return (oldData as PostedItemWithDetails[]).map(
              (item: PostedItemWithDetails) =>
                item.id === postId ? { ...item, status } : item
            );
          }

          // Handle paginated data structure
          if (
            typeof oldData === 'object' &&
            oldData !== null &&
            'pages' in oldData
          ) {
            const paginatedData = oldData as {
              pages: Array<{
                data?: PostedItemWithDetails[];
                [key: string]: unknown;
              }>;
              [key: string]: unknown;
            };

            return {
              ...paginatedData,
              pages: paginatedData.pages.map(page => ({
                ...page,
                data:
                  page.data?.map((item: PostedItemWithDetails) =>
                    item.id === postId ? { ...item, status } : item
                  ) || page.data,
              })),
            };
          }

          // Handle single item
          if (
            typeof oldData === 'object' &&
            oldData !== null &&
            'id' in oldData
          ) {
            const singleItem = oldData as PostedItemWithDetails;
            if (singleItem.id === postId) {
              return { ...singleItem, status };
            }
          }

          return oldData;
        }
      );

      // Also update search results
      queryClient.setQueriesData(
        { queryKey: ['search-posted-items'] },
        (oldData: unknown) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          return (oldData as PostedItemWithDetails[]).map(
            (item: PostedItemWithDetails) =>
              item.id === postId ? { ...item, status } : item
          );
        }
      );

      // Return context for rollback
      return { previousPostedItems, previousSearchResults };
    },

    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        // Call optional callback for backward compatibility
        onUpdate?.();
      } else {
        toast.error(result.message);
        console.error('Failed to update status:', result.message);
      }
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousPostedItems) {
        context.previousPostedItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousSearchResults) {
        context.previousSearchResults.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      console.error('Unexpected error during status update:', error);
      toast.error('Something went wrong. Please try again.');
    },

    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['posted-items'] });
      queryClient.invalidateQueries({ queryKey: ['search-posted-items'] });
    },
  });

  // Format the date for display
  const timeAgo = formatDistanceToNow(new Date(postedItem.createdAt), {
    addSuffix: true,
  });

  // Get user initials for avatar fallback
  const userInitials = postedItem.user.username
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Handle post deletion
  const handleDelete = async () => {
    deletePostMutation.mutate(postedItem.id);
  };

  // Handle status change
  const handleStatusChange = async (status: 'OPEN' | 'DONE') => {
    updateStatusMutation.mutate({ postId: postedItem.id, status });
    setShowMainDropdown(false); // Close the main dropdown after status change
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setShowEditDialog(false);

    // Comprehensive query invalidation to update all views
    queryClient.invalidateQueries({
      queryKey: ['posted-items'],
    });

    // Invalidate search queries (homepage) to show updated content
    queryClient.invalidateQueries({
      queryKey: ['search-posted-items'],
    });

    // Call optional callback for backward compatibility
    onUpdate?.();
  };

  const isDeleting = deletePostMutation.isPending;
  const isUpdatingStatus = updateStatusMutation.isPending;
  const isClosed = postedItem.status === 'DONE';

  return (
    <>
      <Card
        className={`w-full border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200 ${
          isClosed
            ? 'bg-gray-50 dark:bg-gray-950 opacity-75'
            : 'bg-white dark:bg-gray-900'
        }`}
      >
        {/* Post Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* User Avatar */}
              <Link href={usersWallPath(postedItem.user.id)}>
                <Avatar className="h-10 w-10">
                  {postedItem.user.profile?.profilePictureSecureUrl && (
                    <AvatarImage
                      src={postedItem.user.profile.profilePictureSecureUrl}
                      alt={`${postedItem.user.username}'s profile picture`}
                    />
                  )}
                  <AvatarFallback
                    className={`${getAvatarColor(
                      postedItem.user.id
                    )}  text-sm font-medium`}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* User Info & Timestamp */}
              <div className="flex flex-col">
                <Link href={usersWallPath(postedItem.user.id)}>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {capitalizeFirstLetter(postedItem.user.username)}
                  </span>
                </Link>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {timeAgo}
                  </span>
                  {/* Status Badge */}
                  <Badge variant="default" className="text-xs">
                    {postedItem.status === 'DONE' ? 'CLOSE' : postedItem.status}
                  </Badge>
                  {/* Category Badge */}
                  <Badge variant="outline" className="text-xs">
                    {postedItem.category}
                  </Badge>
                  {/* Tag Badge */}
                  {postedItem.tag && (
                    <Badge variant="secondary" className="text-xs">
                      {postedItem.tag}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Menu - Only show for post owner */}
            {postedItem.isOwner && (
              <div className="-mt-8 -mr-2">
                <DropdownMenu
                  open={showMainDropdown}
                  onOpenChange={setShowMainDropdown}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setShowEditDialog(true);
                        setShowMainDropdown(false);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Post
                    </DropdownMenuItem>

                    {/* Status Change Options - Direct menu items instead of nested dropdown */}
                    {postedItem.status === 'OPEN' ? (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange('DONE')}
                        disabled={isUpdatingStatus}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {isUpdatingStatus ? 'Updating...' : 'Mark as Closed'}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange('OPEN')}
                        disabled={isUpdatingStatus}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {isUpdatingStatus ? 'Updating...' : 'Mark as Open'}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowMainDropdown(false);
                      }}
                      // className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Post Content */}
        <CardContent className="pt-0">
          {/* Post Title */}
          <h3
            className={`font-semibold text-lg mb-2 ${
              isClosed
                ? 'text-gray-500 dark:text-gray-500'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {postedItem.title}
          </h3>

          {/* Post Details */}
          <p
            className={`whitespace-pre-wrap break-all text-sm mb-4 leading-relaxed ${
              isClosed
                ? 'text-gray-500 dark:text-gray-500'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {postedItem.details}
          </p>

          {/* Post Image */}
          {postedItem.imageSecureUrl && (
            <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={postedItem.imageSecureUrl}
                alt={postedItem.title}
                width={600}
                height={400}
                className={`w-full h-auto object-cover transition-all duration-200 ${
                  isClosed ? 'grayscale opacity-60' : ''
                }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-4">
              {/* Offers Count */}
              <Button
                variant="ghost"
                size="sm"
                className={`cursor-pointer transition-colors ${
                  isClosed
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
                }`}
                onClick={() => !isClosed && setShowOffersModal(true)}
                disabled={isClosed}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {postedItem._count.offers}{' '}
                  {postedItem._count.offers === 1 ? 'offer' : 'offers'}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone. All offers on this post will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <UpdatePostedItemForm
            postedItemId={postedItem.id}
            initialData={{
              title: postedItem.title,
              details: postedItem.details,
              category: postedItem.category,
              tag: postedItem.tag || undefined,
              imageUrl: postedItem.imageSecureUrl || undefined,
            }}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Offers Modal */}
      <ViewOffersModal
        isOpen={showOffersModal}
        onClose={() => setShowOffersModal(false)}
        postedItem={postedItem}
      />
    </>
  );
};
