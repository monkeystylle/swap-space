/**
 * TypeScript types for offers in the bartering system
 */

// Base offer type matching the database schema
export interface Offer {
  id: string;
  content: string;
  postedItemId: string;
  userId: string | null;
  imagePublicId: string | null;
  imageSecureUrl: string | null;
  createdAt: Date;
}

// User information for offer display
export interface OfferUser {
  id: string;
  username: string;
  email: string;
}

// Offer with user details for display components
export interface OfferWithDetails extends Offer {
  user: OfferUser | null;
  isOwner: boolean; // Whether the current user owns this offer
}

// Form types for creating offers
export interface CreateOfferInput {
  content: string;
  image?: File;
}

// Form types for updating offers
export interface UpdateOfferInput {
  content?: string;
  image?: File;
}
