/**
 * PostedItemCard Component
 * Displays individual posted items in Facebook-style card format
 * Shows user info, post content, image, and action buttons
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, MessageCircle, Edit, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

import { PostedItemWithDetails } from '../../queries/get-posted-items';
import { deletePostedItem } from '../../actions/delete-posted-item';
import { PostedItemForm } from './posted-item-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PostedItemCardProps {
  postedItem: PostedItemWithDetails;
  onUpdate?: () => void; // Callback to refresh the list after updates
}

export const PostedItemCard = ({
  postedItem,
  onUpdate,
}: PostedItemCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsDeleting(true);
    try {
      const result = await deletePostedItem(postedItem.id);

      if (result.status === 'SUCCESS') {
        onUpdate?.(); // Refresh the list
        setShowDeleteDialog(false);
      } else {
        console.error('Failed to delete post:', result.message);
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setShowEditDialog(false);
    onUpdate?.(); // Refresh the list
  };

  return (
    <>
      <Card className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Post Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* User Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              {/* User Info & Timestamp */}
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {postedItem.user.username}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {timeAgo}
                  </span>
                  {/* Status Badge */}
                  <Badge
                    variant={
                      postedItem.status === 'OPEN' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {postedItem.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions Menu - Only show for post owner */}
            {postedItem.isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        {/* Post Content */}
        <CardContent className="pt-0">
          {/* Post Title */}
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
            {postedItem.title}
          </h3>

          {/* Post Details */}
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
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
                className="w-full h-auto object-cover"
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
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {postedItem._count.offers}{' '}
                  {postedItem._count.offers === 1 ? 'offer' : 'offers'}
                </span>
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {!postedItem.isOwner && postedItem.status === 'OPEN' && (
                <Button size="sm" variant="outline" className="text-sm">
                  Make Offer
                </Button>
              )}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <PostedItemForm
            mode="edit"
            initialData={{
              title: postedItem.title,
              details: postedItem.details,
              imageUrl: postedItem.imageSecureUrl || undefined,
            }}
            postedItemId={postedItem.id}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
