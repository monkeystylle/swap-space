'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { createComment } from '../actions/create-comment';

// Use the same schema as the server action for client-side validation
const CommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1024, 'Comment must be less than 1024 characters'),
});

type FormFields = z.infer<typeof CommentSchema>;

export default function CommentCreateForm() {
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<FormFields>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Extract isSubmitting from form.formState
  const { isSubmitting } = form.formState;

  // Handle form submission
  async function onSubmit(values: FormFields) {
    try {
      const result = await createComment(values);

      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result.message || 'Failed to add comment');

        // Handle field errors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof FormFields, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-card rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add a Comment</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your comment here..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Post Comment'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
