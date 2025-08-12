/**
 * Profile types for type safety
 */

export interface Profile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  profilePicturePublicId: string | null;
  profilePictureSecureUrl: string | null;
  surname: string | null;
  givenName: string | null;
  middleInitial: string | null;
  street: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  isComplete: boolean;
  userId: string;
}

export interface CreateProfileData {
  surname?: string;
  givenName?: string;
  middleInitial?: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdateProfileData extends Partial<CreateProfileData> {
  profilePicturePublicId?: string;
  profilePictureSecureUrl?: string;
}

export interface ProfileFormData {
  surname: string;
  givenName: string;
  middleInitial: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}
