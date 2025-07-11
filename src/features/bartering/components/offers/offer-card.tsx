/**
 * OfferCard Component
 * Displays an individual offer with user information, content, optional image,
 * and edit/delete actions for the offer owner
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { OfferWithDetails } from '../../queries/offer.types';
import { deleteOffer } from '../../actions/delete-offer';
import { UpdateOfferForm } from './update-offer-form';

interface OfferCardProps {
  offer: OfferWithDetails;
  onUpdate?: () => void; // Callback to refresh offers (optional since React Query handles it)
}

export const OfferCard = ({ offer, onUpdate }: OfferCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // React Query setup
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteOfferMutation = useMutation({
    mutationFn: deleteOffer,
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);

        // Invalidate offers queries to refresh the list
        queryClient.invalidateQueries({
          queryKey: ['offers'],
        });

        // Close dialog and call optional callback for backward compatibility
        setShowDeleteDialog(false);
        onUpdate?.();
      } else {
        toast.error(result.message);
        console.error('Failed to delete offer:', result.message);
      }
    },
    onError: error => {
      console.error('Unexpected error during deletion:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });

  // Format the date for display
  const formattedDate = formatDistanceToNow(new Date(offer.createdAt), {
    addSuffix: true,
  });

  // Handle offer deletion
  const handleDelete = async () => {
    deleteOfferMutation.mutate(offer.id);
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setShowEditDialog(false);

    // Invalidate offers queries to refresh the list
    queryClient.invalidateQueries({
      queryKey: ['offers'],
    });

    // Call optional callback for backward compatibility
    onUpdate?.();
  };

  const isDeleting = deleteOfferMutation.isPending;

  // Handle case where user data is missing (soft deleted user)
  if (!offer.user) {
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-200">
                <User className="h-5 w-5 text-gray-500" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Deleted User</p>
              <p className="text-xs text-gray-400">{formattedDate}</p>
            </div>
          </div>

          <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {offer.content}
          </p>

          {/* Show image if available */}
          {offer.imageSecureUrl && (
            <div className="mt-3">
              <div className="relative rounded-lg overflow-hidden max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={offer.imageSecureUrl}
                  alt="Offer image"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-3">
        <CardContent className="p-4">
          {/* Offer Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {/* User Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                  {offer.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {offer.user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Actions Menu - Only show for offer owner */}
            {offer.isOwner && (
              <div className="-mt-2 -mr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowEditDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit offer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="flex items-center gap-2 text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete offer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Offer Content */}
          <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed">
            {offer.content}
          </p>

          {/* Show image if available */}
          {offer.imageSecureUrl && (
            <div className="mt-3">
              <div className="relative rounded-lg overflow-hidden max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={offer.imageSecureUrl}
                  alt="Offer image"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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

      {/* Edit Offer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
          </DialogHeader>
          <UpdateOfferForm
            offerId={offer.id}
            initialData={{
              content: offer.content,
              imageSecureUrl: offer.imageSecureUrl,
            }}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
