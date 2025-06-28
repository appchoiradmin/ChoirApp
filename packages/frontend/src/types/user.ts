import type { Choir } from './choir';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  choirs: Choir[];
  choirId?: string;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;
}
