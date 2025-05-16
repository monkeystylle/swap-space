import { ZodError } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionState<T = any> = {
  status?: 'SUCCESS' | 'ERROR';
  message: string;
  payload?: FormData; // Supports both FormData and direct value patterns
  fieldErrors: Record<string, string[] | undefined>;
  timestamp: number; // Useful for tracking state freshness and debugging
  data?: T; // Generic type for success response data
};

/**
 * Initial empty state for ActionState
 * Useful as a starting point for forms or operations
 */
export const EMPTY_ACTION_STATE: ActionState = {
  message: '',
  fieldErrors: {},
  timestamp: Date.now(),
};

/**
 * Converts a ZodError or standard Error into an ActionState format
 * This is useful for standardizing error responses across different actions
 *
 * @param error - The error object to convert
 * @param formData - Optional FormData object (useful for form resubmission)
 * @returns An ActionState object representing the error
 */
export const fromErrorToActionState = (
  error: unknown,
  formData?: FormData
): ActionState => {
  if (error instanceof ZodError) {
    //Zod validation errors
    return {
      status: 'ERROR',
      message: '',
      payload: formData,
      fieldErrors: error.flatten().fieldErrors,
      timestamp: Date.now(),
    };
  } else if (error instanceof Error) {
    // Regular JavaScript errors (like network errors)
    return {
      status: 'ERROR',
      message: error.message,
      payload: formData,
      fieldErrors: {},
      timestamp: Date.now(),
    };
  } else {
    // Unknown errors
    return {
      status: 'ERROR',
      message: 'An unknown error occurred',
      payload: formData,
      fieldErrors: {},
      timestamp: Date.now(),
    };
  }
};

/// Converts a successful operation into an ActionState format
/// This is useful for standardizing success responses across different actions
export const toActionState = (
  status: ActionState['status'],
  message: string,
  formData?: FormData,
  data?: unknown
): ActionState => {
  return {
    status,
    message,
    fieldErrors: {},
    payload: formData,
    timestamp: Date.now(),
    data,
  };
};
