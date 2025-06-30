import React, { useState, useEffect, type ReactNode, useCallback } from 'react';
import type { User } from '../types/user';
import { getCurrentUser } from '../services/userService';
import { UserContext } from './UserContext.ts';

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(storedToken);
      const userData = await getCurrentUser(storedToken);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, token, loading, refetchUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};
