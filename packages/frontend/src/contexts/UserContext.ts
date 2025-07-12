import { createContext } from 'react';
import type { User } from '../types/user';

export interface UserContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  loading: boolean;
  refetchUser: () => Promise<void>;
  setChoirId: (choirId: string) => void;
  signOut: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
