import type { Choir } from './choir';

export type UserRole = 'General' | 'ChoirAdmin' | 'SuperAdmin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  choirs: Choir[];
  choirId?: string;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;
}
