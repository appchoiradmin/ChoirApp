import type { Choir } from './choir';

import { UserRole as AppUserRole } from '../constants/roles';

export type UserRole = AppUserRole;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  choirs: Choir[];
  choirId?: string;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;
  token: string;
}
