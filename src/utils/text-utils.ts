/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @param fallback - Fallback value if string is falsy
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (
  str: string | null | undefined,
  fallback: string = 'User'
): string => {
  if (!str) return fallback;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// You could add more text formatting functions here later:
