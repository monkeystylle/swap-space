// Type for posted item with user and offer information
export interface PostedItemWithDetails {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  details: string;
  status: 'OPEN' | 'DONE';
  category: 'ITEM' | 'SERVICE';
  tag: string | null;
  imagePublicId: string | null;
  imageSecureUrl: string | null;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    profile: {
      id: string;
      profilePictureSecureUrl: string | null;
      profilePicturePublicId: string | null;
    } | null;
  };
  _count: {
    offers: number;
  };
  // Flag to indicate if current user owns this post
  isOwner: boolean;
}
