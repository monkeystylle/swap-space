/**
 * Tailwind color classes for avatar backgrounds
 */
const AVATAR_COLORS = [
  'bg-red-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-yellow-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-cyan-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-lime-600',
  'bg-sky-600',
] as const;

/**
 * Generates a consistent avatar color based on user identifier
 * @param identifier - User ID or username
 * @returns Tailwind CSS class for avatar background color
 */
export const getAvatarColor = (identifier: string): string => {
  if (!identifier) return 'bg-gray-600'; // fallback

  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Get absolute value and map to color array index
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
};
