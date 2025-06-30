import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach, afterAll } from 'vitest';
import DashboardPage from '../src/pages/DashboardPage';
import { UserProvider } from '../src/contexts/UserContext.tsx';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

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

// Mock invitations for dashboard
const mockInvitations = [
  {
    invitationToken: 'token-1',
    choirId: 'choir-1',
    choirName: 'Test Choir',
    email: 'invitee@example.com',
    status: 'Pending',
    sentAt: new Date().toISOString(),
  },
];

const API_BASE_URL = 'http://localhost:5014';
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
    // MSW handler for invitations
    server.use(
      http.get(`${API_BASE_URL}/api/invitations`, () => {
        return HttpResponse.json(mockInvitations);
      })
    );
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
