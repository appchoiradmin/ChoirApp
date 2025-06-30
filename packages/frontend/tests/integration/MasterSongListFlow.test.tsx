import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DashboardPage from '../../src/pages/DashboardPage';
import ChoirAdminPage from '../../src/pages/ChoirAdminPage';
import MasterSongsListPage from '../../src/pages/MasterSongsListPage';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import '@testing-library/jest-dom';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

// Mock the userService to prevent actual API calls
vi.mock('../../src/services/userService', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock the masterSongService to prevent actual API calls
vi.mock('../../src/services/masterSongService', () => ({
  getAllMasterSongs: vi.fn(),
}));

// Mock choirService for ChoirAdminPage
vi.mock('../../src/services/choirService', () => ({
  getChoirDetails: vi.fn().mockResolvedValue({
    id: 'choir-1',
    name: 'Admin Choir',
    role: 'Admin',
    members: [],
  }),
}));

// Mock invitationService for ChoirAdminPage and DashboardPage
vi.mock('../../src/services/invitationService', () => ({
  getInvitations: vi.fn().mockResolvedValue([]),
  getInvitationsByChoir: vi.fn().mockResolvedValue([]),
  acceptInvitation: vi.fn().mockResolvedValue(undefined),
  rejectInvitation: vi.fn().mockResolvedValue(undefined),
}));

const createTestRouter = (initialEntries: string[]) => {
  return createMemoryRouter(
    [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/master-songs', element: <MasterSongsListPage /> },
      { path: '/choir/:choirId/admin', element: <ChoirAdminPage /> },
    ],
    {
      initialEntries,
      initialIndex: 0,
    }
  );
};

const TestWrapper: React.FC<{ initialEntries: string[] }> = ({ initialEntries }) => {
  const router = createTestRouter(initialEntries);
  return (
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
};

describe('Master Song List Flow', () => {
  const mockSongs = [
    {
      id: '1',
      title: 'Amazing Grace',
      artist: 'Traditional',
      lyricsChordPro: 'Amazing grace, how sweet the sound',
      tags: [{ tagId: '1', tagName: 'hymn' }],
    },
  ];

  beforeEach(async () => {
    localStorage.setItem('authToken', 'test-token');

    const userService = await import('../../src/services/userService');
    vi.mocked(userService.getCurrentUser).mockResolvedValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'SuperAdmin',
      choirs: [{ id: 'choir-1', name: 'Admin Choir', role: 'Admin' }],
      hasCompletedOnboarding: true,
      isNewUser: false,
    });

    const masterSongService = await import('../../src/services/masterSongService');
    vi.mocked(masterSongService.getAllMasterSongs).mockResolvedValue(mockSongs);

    const choirService = await import('../../src/services/choirService');
    vi.mocked(choirService.getChoirDetails).mockResolvedValue({
      id: 'choir-1',
      name: 'Admin Choir',
      role: 'Admin',
      members: [],
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('navigates to master song list from dashboard', async () => {
    const user = userEvent.setup();
    render(<TestWrapper initialEntries={['/dashboard']} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Choir Dashboard/i })).toBeInTheDocument();
    });

    const masterSongListLink = screen.getByRole('link', { name: /Master Song List/i });
    await user.click(masterSongListLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Master Songs/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
  });

  it('navigates to master song list from choir admin page', async () => {
    const user = userEvent.setup();
    render(<TestWrapper initialEntries={['/choir/choir-1/admin']} />);

    // Wait for the admin page heading (matches the actual heading in ChoirAdminPage)
    expect(await screen.findByRole('heading', { name: /Admin Choir - Admin/i })).toBeInTheDocument();

    const masterSongListLink = screen.getByRole('link', { name: /Master Song List/i });
    await user.click(masterSongListLink);

    expect(await screen.findByRole('heading', { name: /Master Songs/i })).toBeInTheDocument();
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
  });
});
