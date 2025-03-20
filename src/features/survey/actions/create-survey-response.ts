'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  type ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';

// Define the survey response schema for validation
const SurveyResponseSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  feedback: z
    .string()
    .max(2000, 'Feedback must be less than 2000 characters')
    .optional(),
  department: z.string().min(1, 'Department is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  isSubscribed: z.boolean().default(false),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  availableDate: z.date({
    required_error: 'Please select a date',
    invalid_type_error: "That's not a date!",
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  satisfaction: z.number().min(0).max(5),
});

export type SurveyFormValues = z.infer<typeof SurveyResponseSchema>;

export async function createSurveyResponse(
  values: SurveyFormValues
): Promise<ActionState> {
  try {
    // Validate the input data
    const validatedFields = SurveyResponseSchema.safeParse(values);

    if (!validatedFields.success) {
      return fromErrorToActionState(validatedFields.error);
    }

    // Create the survey response in the database
    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        fullName: validatedFields.data.fullName,
        email: validatedFields.data.email,
        feedback: validatedFields.data.feedback || null,
        department: validatedFields.data.department,
        experienceLevel: validatedFields.data.experienceLevel,
        isSubscribed: validatedFields.data.isSubscribed,
        interests: JSON.stringify(validatedFields.data.interests),
        availableDate: validatedFields.data.availableDate,
        agreeToTerms: validatedFields.data.agreeToTerms,
        satisfaction: validatedFields.data.satisfaction,
      },
    });

    // Revalidate the path to update the UI
    revalidatePath('/survey');

    return toActionState(
      'SUCCESS',
      'Survey response submitted successfully',
      undefined,
      surveyResponse
    );
  } catch (error: unknown) {
    return fromErrorToActionState(error);
  }
}
