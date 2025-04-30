import { ZodError } from 'zod';

/**
 * Action State Utilities
 * ---------------------
 * Purpose: Standardize server action responses and error handling
 *
 * Key Features:
 * - Consistent error handling for Zod, standard, and unknown errors
 * - Support for both FormData and direct value patterns
 * - Type-safe success responses with optional data
 * - Built-in timestamp tracking for debugging
 *
 * Usage:
 * 1. Success case:
 *    return toActionState('SUCCESS', 'Operation successful', undefined, data);
 *
 * 2. Validation error:
 *    return fromErrorToActionState(validationError);
 *
 * 3. Try-catch error:
 *    try {
 *      // ... code
 *    } catch (error) {
 *      return fromErrorToActionState(error);
 *    }
 *
 * Note: The payload (FormData) parameter is optional and can be ignored
 * when using direct value submissions instead of FormData.
 */

/**
 * Utility types and functions for handling server action responses and errors
 * This module provides a standardized way to handle both success and error states
 * in server actions, supporting both FormData and direct value submissions.
 */

/**
 * Represents the state of a server action's execution
 * @template T - The type of the data returned on success (defaults to any)
 *
 * @property status - 'SUCCESS' or 'ERROR' indicating the operation result
 * @property message - A user-friendly message describing the result
 * @property payload - Optional FormData object (useful for form resubmission or debugging)
 * @property fieldErrors - Record of field-specific validation errors
 * @property timestamp - Unix timestamp of when the state was created
 * @property data - Optional data returned on successful operations
 */

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
 * Converts various error types into a standardized ActionState format
 * Handles three types of errors:
 * 1. ZodError: For validation errors with field-specific details
 * 2. Standard Error: For general JavaScript errors
 * 3. Unknown errors: For unexpected error types
 *
 * @param error - The error to convert
 * @param formData - Optional FormData object to include in the response
 * @returns ActionState with appropriate error details
 *
 * @example
 * // Handling Zod validation error
 * if (!validatedFields.success) {
 *   return fromErrorToActionState(validatedFields.error);
 * }
 *
 * // Handling general errors
 * try {
 *   // ... code that might throw
 * } catch (error) {
 *   return fromErrorToActionState(error);
 * }
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

/**
 * Creates a success or error ActionState with the provided details
 *
 * @param status - 'SUCCESS' or 'ERROR'
 * @param message - User-friendly message
 * @param formData - Optional FormData to include
 * @param data - Optional data to include (typically for success responses)
 * @returns ActionState with the provided details
 *
 * @example
 * // Success with data
 * return toActionState(
 *   'SUCCESS',
 *   'Comment created successfully',
 *   undefined,
 *   commentData
 * );
 *
 * // Error without data
 * return toActionState(
 *   'ERROR',
 *   'Operation failed',
 *   formData
 * );
 */
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
