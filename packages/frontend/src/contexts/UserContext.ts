import { createContext } from 'react';
import type { User } from '../types/user';

export interface UserContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
