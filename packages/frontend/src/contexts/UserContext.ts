import { createContext } from 'react';
import type { User } from '../types/user';

export interface UserContextType {
  user: User | null;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
