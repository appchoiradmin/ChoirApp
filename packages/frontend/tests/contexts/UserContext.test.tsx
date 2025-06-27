import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import { useUser } from '../../src/hooks/useUser';
import * as userService from '../../src/services/userService';
import type { User } from '../../src/types/user';

vi.mock('../../src/services/userService');

const TestComponent = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return <div>Welcome, {user.firstName}</div>;
};

describe('UserContext', () => {
  it('fetches and provides user data', async () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      choirs: [],
    };
    vi.mocked(userService.getCurrentUser).mockResolvedValue(mockUser);

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
    });
  });
});

