import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import { useUser } from '../../src/hooks/useUser';

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

  // Note: The global mock handles the success case. A separate test for the error case
  // would require overriding the global mock, which adds complexity.
  // For now, we rely on the global setup for simplicity.
});

