export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  dateOfBirth: Date | null;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  personaImageUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
