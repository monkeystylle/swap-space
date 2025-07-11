/**
 * UpdateOfferForm Component
 * Form for editing existing offers with content and optional image
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
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
import { updateOffer } from '../../actions/update-offer';

// Form validation schema
const updateOfferSchema = z.object({
  content: z
    .string()
    .min(1, 'Offer content is required')
    .max(1024, 'Offer content must be less than 1024 characters'),
});

type UpdateOfferFormValues = z.infer<typeof updateOfferSchema>;

interface UpdateOfferFormProps {
  offerId: string;
  initialData: {
    content: string;
    imageSecureUrl?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UpdateOfferForm = ({
  offerId,
  initialData,
  onSuccess,
  onCancel,
}: UpdateOfferFormProps) => {
  // React Query setup
  const queryClient = useQueryClient();

  // Form management with validation
  const form = useForm<UpdateOfferFormValues>({
    resolver: zodResolver(updateOfferSchema),
    defaultValues: {
      content: initialData.content,
    },
  });

  // React Query mutation for updating offer
  const updateOfferMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { content: string; image?: File };
    }) => updateOffer(id, data),
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);

        // Invalidate offers query to refresh the list
        queryClient.invalidateQueries({
          queryKey: ['offers'],
        });

        // Call success callback (e.g., close modal)
        onSuccess?.();
      } else {
        toast.error(result.message || 'Failed to update offer');

        // Handle field-specific errors from the server
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof UpdateOfferFormValues, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    },
    onError: error => {
      console.error('Failed to update offer:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });

  // Image preview functionality with initial image
  const {
    selectedFile,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    clearImage,
  } = useImagePreview(initialData.imageSecureUrl || undefined);

  // Helper to check if image is selected
  const isImageSelected = Boolean(selectedFile || previewUrl);

  // Handle file selection through input change
  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Form submission
  const onSubmit = async (values: UpdateOfferFormValues) => {
    // Use React Query mutation instead of direct action call
    updateOfferMutation.mutate({
      id: offerId,
      data: {
        content: values.content,
        image: selectedFile || undefined,
      },
    });
  };

  // Check if form can be submitted
  const isFormValid = form.formState.isValid;
  const isSubmitting = updateOfferMutation.isPending;

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Content Field */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Offer Content *
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Update your offer details..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-3">
            <FormLabel className="text-sm font-medium">
              Offer Image (Optional)
            </FormLabel>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={selectFile}
              className="hidden"
            />

            {/* Image preview or upload area */}
            {isImageSelected && previewUrl ? (
              <div className="space-y-3">
                {/* Image preview when image is selected */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Offer preview"
                    className="w-full max-w-sm h-auto object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Change image button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Image
                </Button>
              </div>
            ) : (
              /* Upload area when no image selected */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex flex-col items-center space-y-2">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Offer'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
