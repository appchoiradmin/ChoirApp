import React, { useState, useEffect, type ReactNode, useCallback } from 'react';
import type { User } from '../types/user';
import { getCurrentUser } from '../services/userService';
import { refreshToken as refreshTokenService } from '../services/authService';
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

  const fetchUser = useCallback(async (currentToken?: string | null) => {
    const tokenToUse = currentToken || token;
    if (!tokenToUse) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = await getCurrentUser(tokenToUse);
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

  const refreshUserToken = useCallback(async () => {
    if (token) {
      try {
        console.log('UserContext: Starting token refresh process');
        const newToken = await refreshTokenService(token);
        console.log('UserContext: Received new token from server');
        setToken(newToken);
        console.log('UserContext: Updated token in state');
        console.log('UserContext: Fetching user data with new token');
        await fetchUser(newToken);
        console.log('UserContext: User data refreshed with new token');
        return true;
      } catch (error) {
        console.error('UserContext: Failed to refresh token:', error);
        return false;
      }
    }
    console.warn('UserContext: Cannot refresh token - no existing token');
    return false;
  }, [token, fetchUser]);

  return (
    <UserContext.Provider value={{
      user,
      token,
      setToken,
      loading,
      refetchUser: fetchUser,
      refreshToken: refreshUserToken,
      setChoirId,
      signOut
    }}>
      {children}
    </UserContext.Provider>
  );
};
