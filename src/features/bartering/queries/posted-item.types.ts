// Type for posted item with user and offer information
export interface PostedItemWithDetails {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  details: string;
  status: 'OPEN' | 'DONE';
  imagePublicId: string | null;
  imageSecureUrl: string | null;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  _count: {
    offers: number;
  };
  // Flag to indicate if current user owns this post
  isOwner: boolean;
}
