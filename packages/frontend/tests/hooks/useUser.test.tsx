import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import { useUser } from '../../src/hooks/useUser';
import * as userService from '../../src/services/userService';
import type { User } from '../../src/types/user';

vi.mock('../../src/services/userService');

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  choirs: [],
};

describe('useUser', () => {
  beforeEach(() => {
    // Mock localStorage to have an auth token for tests that expect user fetching
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => key === 'authToken' ? 'mock-token' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error when used outside of a UserProvider', () => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Uncaught [Error: useUser must be used within a UserProvider]')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    expect(() => renderHook(() => useUser())).toThrow('useUser must be used within a UserProvider');

    console.error = originalError;
  });

  it('returns the loading state and fetches the user', async () => {
    vi.mocked(userService.getCurrentUser).mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('handles error when fetching user', async () => {
    vi.mocked(userService.getCurrentUser).mockRejectedValue(new Error('Failed to fetch'));

    const wrapper = ({ children }: { children: React.ReactNode }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
  });
});
