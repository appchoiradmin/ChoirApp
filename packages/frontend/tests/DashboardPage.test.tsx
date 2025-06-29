import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DashboardPage from '../src/pages/DashboardPage';
import { UserProvider } from '../src/contexts/UserContext.tsx';

// Mock userService to provide a user for dashboard rendering
vi.mock('../src/services/userService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    choirs: [{ id: 'choir-1', name: 'Test Choir', role: 'Admin' }],
    choirId: 'choir-1',
    role: 'ChoirAdmin',
    hasCompletedOnboarding: true,
    isNewUser: false,
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    // Mock localStorage to have an auth token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => (key === 'authToken' ? 'mock-token' : null)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders the dashboard content and navigation links', async () => {
    render(
      <UserProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </UserProvider>
    );

    // Wait for the dashboard heading to appear
    expect(await screen.findByRole('heading', { name: /Choir Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome, /i)).toBeInTheDocument();

    const masterSongsLink = screen.getByRole('link', { name: /Master Song List/i });
    expect(masterSongsLink).toBeInTheDocument();
    expect(masterSongsLink).toHaveAttribute('href', '/master-songs');

    const createChoirLink = screen.getByRole('link', { name: /Create New Choir/i });
    expect(createChoirLink).toBeInTheDocument();
    expect(createChoirLink).toHaveAttribute('href', '/create-choir');
  });
});
