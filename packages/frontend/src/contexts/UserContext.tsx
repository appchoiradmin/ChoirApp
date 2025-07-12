import React, { useState, useEffect, type ReactNode, useCallback } from 'react';
import type { User } from '../types/user';
import { getCurrentUser } from '../services/userService';
import { UserContext } from './UserContext.ts';

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, _setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    _setToken(newToken);
    if (newToken) {
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
  };

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
      setToken(null); // This will also clear localStorage
    } finally {
      setLoading(false);
    }
  }, [token]);

  const setChoirId = useCallback((choirId: string) => {
    setUser(prevUser => {
      if (prevUser && prevUser.choirId !== choirId) {
        return { ...prevUser, choirId };
      }
      return prevUser;
    });
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null); // This will now clear state and localStorage
  }, []);

  return (
    <UserContext.Provider value={{ user, token, setToken, loading, refetchUser: fetchUser, setChoirId, signOut }}>
      {children}
    </UserContext.Provider>
  );
};
