import React, { useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types/user';
import { getCurrentUser } from '../services/userService';
import { UserContext } from './UserContext.ts';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Only try to fetch user if we have a token
        const token = localStorage.getItem('authToken');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};
