/**
 * Posted Item Form Component
 * Handles creating new posted items with title, details, and image upload
 */

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useImagePreview } from '../../hooks/use-image-preview';
import { createPostedItem } from '../../actions/create-posted-item';
import { useAuth } from '@/features/auth/hooks/use-auth';

// Form validation schema
const postedItemFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(191, 'Title must be less than 191 characters'),
  details: z
    .string()
    .min(1, 'Details are required')
    .max(1024, 'Details must be less than 1024 characters'),
});

// Type for form values
type PostedItemFormValues = z.infer<typeof postedItemFormSchema>;

// Props interface
interface PostedItemFormProps {
  onSuccess?: () => void; // Called when post is created successfully (e.g., close modal)
  onCancel?: () => void; // Called when user cancels (e.g., close modal)
}

export const PostedItemForm: React.FC<PostedItemFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Get current user for query invalidation
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form management with validation
  const form = useForm<PostedItemFormValues>({
    resolver: zodResolver(postedItemFormSchema),
    defaultValues: {
      title: '',
      details: '',
    },
  });

  // React Query mutation for creating posted item
  const createPostMutation = useMutation({
    mutationFn: createPostedItem,
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);

        // Reset form and clear image
        form.reset();
        clearImage();

        // Invalidate posted items query to refresh the list
        if (user?.id) {
          queryClient.invalidateQueries({
            queryKey: ['posted-items'],
          });
          // Also invalidate search query to refresh homepage
          queryClient.invalidateQueries({
            queryKey: ['search-posted-items'],
          });
        }

        // Call success callback (e.g., close modal)
        onSuccess?.();
      } else {
        toast.error(result.message || 'Failed to create post');

        // Handle field-specific errors from the server
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof PostedItemFormValues, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    },
    onError: error => {
      console.error('Failed to create posted item:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });

  // Image preview functionality
  const {
    selectedFile,
    previewUrl,
    handleFileSelect,
    clearImage,
    fileInputRef,
    triggerFileSelect,
  } = useImagePreview();

  // Cleanup preview URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Form submission
  const onSubmit = async (values: PostedItemFormValues) => {
    // Validate that image is selected
    if (!selectedFile) {
      toast.error('Please select an image for your posted item');
      return;
    }

    // Use React Query mutation instead of direct action call
    createPostMutation.mutate({
      title: values.title,
      details: values.details,
      image: selectedFile,
    });
  };

  // Check if form can be submitted
  const isFormValid = form.formState.isValid && selectedFile;
  const isSubmitting = createPostMutation.isPending;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="What are you offering to trade?"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Details Field */}
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your item, its condition, and what you're looking for in return..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Image</label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isSubmitting}
            />

            {/* Upload Area or Preview */}
            {!previewUrl ? (
              // Upload area when no image selected
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={triggerFileSelect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              // Image preview when image is selected
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                {/* Remove image button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Post...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
