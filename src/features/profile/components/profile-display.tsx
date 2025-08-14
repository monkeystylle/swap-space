/**
 * Profile Display Component
 * Shows profile information with inline editing capabilities
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Edit2, Camera, User, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useUpdateProfilePicture } from '../hooks/use-update-profile-picture';
import { WebcamCapture } from './webcam-capture';
import { ProfileForm } from './profile-form';
import { useProfile } from '../hooks/use-profile';

interface ProfileDisplayProps {
  userId: string;
  isOwner: boolean; // Whether the current user owns this profile
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  userId,
  isOwner,
}) => {
  const { data: profile, isLoading } = useProfile(userId);
  const updatePictureMutation = useUpdateProfilePicture(userId);

  // Edit states
  const [editingDetails, setEditingDetails] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);

  // Handle profile picture capture
  const handlePictureCapture = async (imageFile: File) => {
    try {
      await updatePictureMutation.mutateAsync(imageFile);
      setShowWebcam(false);
    } catch {
      // Error handling is done in the mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (showWebcam) {
    return (
      <WebcamCapture
        onCapture={handlePictureCapture}
        onClose={() => setShowWebcam(false)}
        isUploading={updatePictureMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Profile Picture */}
            <div className="relative">
              {updatePictureMutation.isPending ? (
                <div className="w-30 h-30 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-background shadow-lg">
                  <div className="w-8 h-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : profile?.profilePictureSecureUrl ? (
                <Image
                  src={`${profile.profilePictureSecureUrl}?v=${Date.now()}`}
                  alt="Profile picture"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-background shadow-lg"
                  key={profile.profilePictureSecureUrl} // Force re-render when URL changes
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-background shadow-lg">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Edit Button for Picture */}
              {isOwner && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => setShowWebcam(true)}
                  disabled={updatePictureMutation.isPending}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Picture Status */}
            {!profile?.profilePictureSecureUrl && (
              <p className="text-sm text-muted-foreground text-center">
                {isOwner
                  ? 'Click the camera icon to add your profile picture'
                  : 'No profile picture'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Section */}
      <Card>
        <CardContent className="p-6">
          {editingDetails && isOwner ? (
            // Edit Mode
            <ProfileForm
              userId={userId}
              profile={profile || null}
              onSuccess={() => setEditingDetails(false)}
              onCancel={() => setEditingDetails(false)}
              isEditing={true}
            />
          ) : (
            // Display Mode
            <div className="space-y-6">
              {/* Header with Edit Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  {profile?.isComplete && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Profiled
                    </div>
                  )}
                </div>

                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDetails(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Profile Details or Empty State */}
              {profile?.givenName || profile?.surname ? (
                <div className="space-y-4">
                  {/* Name Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal Information
                    </h4>
                    <div className="space-y-1 pl-6">
                      <p className="text-base">
                        <span className="font-medium">Name:</span>{' '}
                        {[
                          profile?.givenName,
                          profile?.middleInitial,
                          profile?.surname,
                        ]
                          .filter(Boolean)
                          .join(' ') || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address Information
                    </h4>
                    <div className="space-y-1 pl-6">
                      {profile?.street && (
                        <p className="text-base">
                          <span className="font-medium">Street:</span>{' '}
                          {profile.street}
                        </p>
                      )}
                      {profile?.city && (
                        <p className="text-base">
                          <span className="font-medium">City:</span>{' '}
                          {profile.city}
                        </p>
                      )}
                      {profile?.postalCode && (
                        <p className="text-base">
                          <span className="font-medium">Postal Code:</span>{' '}
                          {profile.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Empty State
                <div className="text-center py-8 space-y-4">
                  <User className="w-12 h-12 text-gray-400 mx-auto" />
                  <div className="space-y-2">
                    <h4 className="text-base font-medium">
                      No Profile Information
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isOwner
                        ? 'Add your personal information to complete your profile'
                        : 'This user has not added their profile information yet'}
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingDetails(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Add Profile Information
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Profile Form for New Users */}
      {!profile && isOwner && !editingDetails && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Create Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                Add your personal information to complete your profile setup.
              </p>
              <ProfileForm
                userId={userId}
                profile={null}
                onSuccess={() => {
                  // Profile created successfully
                }}
                isEditing={false}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Loading skeleton component
const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Profile Picture Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="w-30 h-30 rounded-full" />
            <Skeleton className="w-48 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="w-40 h-6" />
              <Skeleton className="w-16 h-8" />
            </div>
            <div className="space-y-4">
              <Skeleton className="w-32 h-4" />
              <div className="pl-6 space-y-2">
                <Skeleton className="w-64 h-4" />
              </div>
              <Skeleton className="w-32 h-4" />
              <div className="pl-6 space-y-2">
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-40 h-4" />
                <Skeleton className="w-52 h-4" />
                <Skeleton className="w-36 h-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
