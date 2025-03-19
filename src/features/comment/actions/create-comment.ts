'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';

// Define the comment schema for validation
const CommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1024, 'Comment must be less than 1024 characters'),
});

export type CommentFormValues = z.infer<typeof CommentSchema>;

export async function createComment(
  values: CommentFormValues
): Promise<ActionState> {
  try {
    // Validate the input data
    const validatedFields = CommentSchema.safeParse(values);

    if (!validatedFields.success) {
      return fromErrorToActionState(validatedFields.error);
    }

    // Create the comment in the database
    const comment = await prisma.comment.create({
      data: {
        content: validatedFields.data.content,
      },
    });

    // Revalidate the path to update the UI
    revalidatePath('/');

    return toActionState(
      'SUCCESS',
      'Comment created successfully',
      undefined,
      comment
    );
  } catch (error: unknown) {
    return fromErrorToActionState(error);
  }
}

//An ActionState is a structured object that represents the outcome of an action
//It provides a consistent way to handle and communicate the result of an operation
//(success, error, or other states) across the application.

//This code implements a form handling and error management system,
// particularly useful in Next.js server actions.
