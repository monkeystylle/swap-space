/**
 * Create Post Trigger Component
 * Facebook-style clickable area that opens the post creation modal
 */

'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { PostedItemForm } from './posted-item-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import Link from 'next/link';
import { usersWallPath } from '@/paths';
import { getAvatarColor } from '@/utils/avatar-colors';

export const CreatePostTrigger: React.FC = () => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current user info
  const { user } = useAuth();

  // Handle opening the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handle successful post creation
  const handlePostSuccess = () => {
    closeModal(); // Close modal after successful post creation
  };

  // Get user's initials for avatar fallback
  const getUserInitials = (username?: string) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  // Don't render if user is not loaded yet
  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Trigger Area - Facebook Style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
        {/* Top Section - Main clickable area */}
        <div className="flex items-center gap-3 p-4   transition-colors rounded-t-lg">
          {/* User Avatar */}
          <Link href={usersWallPath(user.id)}>
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarFallback className={`${getAvatarColor(user.id)}`}>
                {getUserInitials(user.username)}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Placeholder Text Input (fake) */}
          <div
            onClick={openModal}
            className="cursor-pointer  flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            What are you trading today, {user.username}?
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              Create New Post
            </DialogTitle>
          </DialogHeader>

          {/* Divider */}
          <div className="border-t"></div>

          {/* Form Component */}
          <div className="py-4">
            <PostedItemForm
              onSuccess={handlePostSuccess}
              onCancel={closeModal}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
