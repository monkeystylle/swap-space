/**
 * Update Posted Item Form Component
 * Handles updating existing posted items with title, details, and image upload
 */

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

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
import { updatePostedItem } from '../../actions/update-posted-item';

// Form validation schema
const updatePostedItemFormSchema = z.object({
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
type UpdatePostedItemFormValues = z.infer<typeof updatePostedItemFormSchema>;

// Props interface
interface UpdatePostedItemFormProps {
  postedItemId: string;
  initialData: {
    title: string;
    details: string;
    imageUrl?: string;
  };
  onSuccess?: () => void; // Called when post is updated successfully
  onCancel?: () => void; // Called when user cancels
}

export const UpdatePostedItemForm: React.FC<UpdatePostedItemFormProps> = ({
  postedItemId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  // Form management with validation
  const form = useForm<UpdatePostedItemFormValues>({
    resolver: zodResolver(updatePostedItemFormSchema),
    defaultValues: {
      title: initialData.title,
      details: initialData.details,
    },
  });

  // Image preview functionality with initial image
  const {
    selectedFile,
    previewUrl,
    handleFileSelect,
    clearImage,
    fileInputRef,
    triggerFileSelect,
  } = useImagePreview(initialData.imageUrl);

  // Cleanup preview URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== initialData.imageUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, initialData.imageUrl]);

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
  const onSubmit = async (values: UpdatePostedItemFormValues) => {
    try {
      const result = await updatePostedItem(postedItemId, {
        title: values.title,
        details: values.details,
        image: selectedFile || undefined,
      });

      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        onSuccess?.();
      } else {
        toast.error(result.message || 'Failed to update post');

        // Handle field-specific errors from the server
        // If it was a validation error, it would have fieldErrors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof UpdatePostedItemFormValues, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to update posted item:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  // Check if form can be submitted
  const isFormValid = form.formState.isValid;
  const isSubmitting = form.formState.isSubmitting;

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
                  Click to change image or drag and drop
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
                  Updating Post...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Post
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
