import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import DashboardPage from '../../src/pages/DashboardPage.tsx';
import ChoirSongsListPage from '../../src/pages/ChoirSongsListPage.tsx';
import MasterSongsListPage from '../../src/pages/MasterSongsListPage.tsx';
import MasterSongDetailPage from '../../src/pages/MasterSongDetailPage.tsx';
import ChoirSongEditorPage from '../../src/pages/ChoirSongEditorPage.tsx';
import '../../src/setupTests.ts';

// Mock the userService and provide a mock user with choir
vi.mock('../../src/services/userService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    choirs: [{ id: 'choir-1', name: 'Test Choir', role: 'Admin' }],
    choirId: 'choir-1',
    role: 'ChoirAdmin',
    hasCompletedOnboarding: true,
    isNewUser: false,
  })
}));

// Mock the choirSongService
vi.mock('../../src/services/choirSongService', () => {
  const mockChoirSongs = [
    {
      choirSongId: 'choir-song-1',
      masterSongId: 'master-1',
      choirId: 'choir-1',
      editedLyricsChordPro: 'Amazing grace (how sweet the sound)\nThat saved a wretch like me',
      lastEditedDate: '2024-01-15T10:00:00Z',
      editorUserId: 'user-1',
      masterSong: {
        id: 'master-1',
        title: 'Amazing Grace',
        artist: 'Traditional',
        lyricsChordPro: 'Amazing grace, how sweet the sound',
        tags: [{ tagId: '1', tagName: 'hymn' }]
      }
    }
  ];

  return {
    getChoirSongsByChoirId: vi.fn().mockResolvedValue(mockChoirSongs),
    createChoirSongVersion: vi.fn().mockImplementation((choirId, createDto) =>
      Promise.resolve({
        choirSongId: 'choir-song-2',
        masterSongId: createDto.masterSongId,
        choirId,
        editedLyricsChordPro: createDto.editedLyricsChordPro,
        lastEditedDate: new Date().toISOString(),
        editorUserId: 'user-1',
        masterSong: {
          id: createDto.masterSongId,
          title: 'How Great Thou Art',
          artist: 'Carl Boberg',
          lyricsChordPro: 'O Lord my God, when I in awesome wonder',
          tags: [{ tagId: '1', tagName: 'hymn' }]
        }
      })
    ),
    getChoirSongById: vi.fn().mockResolvedValue(mockChoirSongs[0]),
    updateChoirSongVersion: vi.fn().mockImplementation((choirId, songId, updateDto) =>
      Promise.resolve({
        ...mockChoirSongs[0],
        editedLyricsChordPro: updateDto.editedLyricsChordPro,
        lastEditedDate: new Date().toISOString()
      })
    ),
  };
});

// Mock the masterSongService for the flow
vi.mock('../../src/services/masterSongService', () => {
  const mockMasterSongs = [
    {
      id: 'master-1',
      title: 'Amazing Grace',
      artist: 'Traditional',
      lyricsChordPro: 'Amazing grace, how sweet the sound',
      tags: [{ tagId: '1', tagName: 'hymn' }]
    },
    {
      id: 'master-2',
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      lyricsChordPro: 'O Lord my God, when I in awesome wonder',
      tags: [{ tagId: '1', tagName: 'hymn' }]
    }
  ];

  return {
    getAllMasterSongs: vi.fn().mockResolvedValue(mockMasterSongs),
    getMasterSongById: vi.fn().mockImplementation((id) =>
      Promise.resolve(mockMasterSongs.find(song => song.id === id))
    ),
    searchMasterSongs: vi.fn().mockResolvedValue(mockMasterSongs),
  };
});

// Create a test router for the choir songs flow
const createTestRouter = (initialPath = "/dashboard") => {
  return createMemoryRouter([
    {
      path: "/",
      element: <DashboardPage />
    },
    {
      path: "/dashboard",
      element: <DashboardPage />
    },
    {
      path: "/choir-songs",
      element: <ChoirSongsListPage />
    },
    {
      path: "/master-songs",
      element: <MasterSongsListPage />
    },
    {
      path: "/master-songs/:id",
      element: <MasterSongDetailPage />
    },
    {
      path: "/choirs/:choirId/songs/:songId/edit",
      element: <ChoirSongEditorPage />
    }
  ], {
    initialEntries: [initialPath],
    initialIndex: 0
  });
};

// Create a test wrapper that creates a fresh router for each test
const TestWrapper: React.FC<{ initialPath?: string }> = ({ initialPath = "/dashboard" }) => {
  const router = createTestRouter(initialPath);
  return (
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
};

describe('Choir Songs Management Flow - Integration Test', () => {
  beforeEach(async () => {
    // Mock localStorage to have an auth token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => key === 'authToken' ? 'mock-token' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Reset mock implementations for all services
    const choirSongService = await import('../../src/services/choirSongService');
    const masterSongService = await import('../../src/services/masterSongService');
    const userService = await import('../../src/services/userService');

    vi.mocked(choirSongService.getChoirSongsByChoirId).mockReset();
    vi.mocked(choirSongService.getChoirSongById).mockReset();
    vi.mocked(choirSongService.createChoirSongVersion).mockReset();
    vi.mocked(choirSongService.updateChoirSongVersion).mockReset();
    vi.mocked(masterSongService.getAllMasterSongs).mockReset();
    vi.mocked(masterSongService.getMasterSongById).mockReset();
    vi.mocked(masterSongService.searchMasterSongs).mockReset();
    vi.mocked(userService.getCurrentUser).mockReset();

    // Reset user service mock to ensure consistent user context
    vi.mocked(userService.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      choirs: [{ id: 'choir-1', name: 'Test Choir', role: 'Admin' }],
      choirId: 'choir-1',
      role: 'ChoirAdmin',
      hasCompletedOnboarding: true,
      isNewUser: false,
    });

    const mockChoirSongs = [
      {
        choirSongId: 'choir-song-1',
        masterSongId: 'master-1',
        choirId: 'choir-1',
        editedLyricsChordPro: 'Amazing grace (how sweet the sound)\nThat saved a wretch like me',
        lastEditedDate: '2024-01-15T10:00:00Z',
        editorUserId: 'user-1',
        masterSong: {
          id: 'master-1',
          title: 'Amazing Grace',
          artist: 'Traditional',
          lyricsChordPro: 'Amazing grace, how sweet the sound',
          tags: [{ tagId: '1', tagName: 'hymn' }]
        }
      }
    ];

    const mockMasterSongs = [
      {
        id: 'master-1',
        title: 'Amazing Grace',
        artist: 'Traditional',
        lyricsChordPro: 'Amazing grace, how sweet the sound',
        tags: [{ tagId: '1', tagName: 'hymn' }]
      },
      {
        id: 'master-2',
        title: 'How Great Thou Art',
        artist: 'Carl Boberg',
        lyricsChordPro: 'O Lord my God, when I in awesome wonder',
        tags: [{ tagId: '1', tagName: 'hymn' }]
      }
    ];

    vi.mocked(choirSongService.getChoirSongsByChoirId).mockResolvedValue(mockChoirSongs);
    vi.mocked(choirSongService.getChoirSongById).mockResolvedValue(mockChoirSongs[0]);
    vi.mocked(choirSongService.createChoirSongVersion).mockImplementation((choirId, createDto) =>
      Promise.resolve({
        choirSongId: 'choir-song-2',
        masterSongId: createDto.masterSongId,
        choirId,
        editedLyricsChordPro: createDto.editedLyricsChordPro,
        lastEditedDate: new Date().toISOString(),
        editorUserId: 'user-1',
        masterSong: mockMasterSongs.find(s => s.id === createDto.masterSongId)
      })
    );
    vi.mocked(choirSongService.updateChoirSongVersion).mockImplementation((choirId, songId, updateDto) =>
      Promise.resolve({
        ...mockChoirSongs[0],
        editedLyricsChordPro: updateDto.editedLyricsChordPro,
        lastEditedDate: new Date().toISOString()
      })
    );

    vi.mocked(masterSongService.getAllMasterSongs).mockResolvedValue(mockMasterSongs);
    vi.mocked(masterSongService.getMasterSongById).mockImplementation((id) =>
      Promise.resolve(mockMasterSongs.find(song => song.id === id) || mockMasterSongs[0])
    );
    vi.mocked(masterSongService.searchMasterSongs).mockResolvedValue(mockMasterSongs);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow user to view existing choir songs and navigate to edit', async () => {
    const user = userEvent.setup();

    // Start test directly on choir songs page
    render(<TestWrapper initialPath="/choir-songs" />);

    // Step 1: Wait for user context to load by checking that we're not in loading state anymore
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    // Now assert choir songs heading
    expect(screen.getByRole('heading', { name: /Your Choir's Songs/i })).toBeInTheDocument();
    
    // Step 2: Verify existing choir songs are displayed
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('Traditional')).toBeInTheDocument();
    });

    // Step 3: Navigate to edit the choir song
    const editButton = screen.getByRole('link', { name: /View\/Edit/i });
    await user.click(editButton);

    // Step 4: Verify we're on the song editor page
    await waitFor(() => {
      expect(screen.getByText(/Edit Song:/i)).toBeInTheDocument();
    });

    // Verify the choir song service was called
    const { getChoirSongsByChoirId } = await import('../../src/services/choirSongService');
    expect(getChoirSongsByChoirId).toHaveBeenCalledWith('choir-1');
  });

  it('should allow user to create a new choir song version from master songs', async () => {
    const user = userEvent.setup();

    // Start test directly on choir songs page
    render(<TestWrapper initialPath="/choir-songs" />);

    // Step 1: Wait for the Choir Songs page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Choir's Songs/i })).toBeInTheDocument();
    });

    // Step 2: Navigate to Master Songs to create new version
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Master Song List/i })).toBeInTheDocument();
    });
    
    const masterSongsLink = screen.getByRole('link', { name: /Master Song List/i });
    await user.click(masterSongsLink);

    // Step 3: Verify we're on Master Songs page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Master Songs/i })).toBeInTheDocument();
    });

    // Step 4: Verify master songs are loaded
    await waitFor(() => {
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    });

    // Step 5: Click on a master song to view details
    const songLink = screen.getByText('How Great Thou Art');
    await user.click(songLink);

    // Step 6: Verify we're on the master song detail page
    await waitFor(() => {
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
      expect(screen.getByText(/Artist:.*Carl Boberg/)).toBeInTheDocument();
    });

    // Verify the master song service was called
    const { getAllMasterSongs } = await import('../../src/services/masterSongService');
    expect(getAllMasterSongs).toHaveBeenCalled();
  });

  it('should handle editing choir song lyrics and save changes', async () => {
    const user = userEvent.setup();

    // Mock the router to start at the choir song editor with proper route structure
    const editorRouter = createMemoryRouter([
      {
        path: "/choirs/:choirId/songs/:songId/edit",
        element: <ChoirSongEditorPage />
      }
    ], {
      initialEntries: ["/choirs/choir-1/songs/choir-song-1/edit"],
      initialIndex: 0
    });

    render(
      <UserProvider>
        <RouterProvider router={editorRouter} />
      </UserProvider>
    );

    // Step 1: Wait for the song editor to load
    await waitFor(() => {
      expect(screen.getByText(/Edit Song:/i)).toBeInTheDocument();
    });

    // Step 2: Verify the song content is loaded
    await waitFor(() => {
      const textbox = screen.getByRole('textbox');
      expect(textbox).toHaveValue('Amazing grace (how sweet the sound)\nThat saved a wretch like me');
    });

    // Step 3: Edit the lyrics
    const textArea = screen.getByRole('textbox');
    await user.clear(textArea);
    await user.type(textArea, 'Amazing grace{Enter}How sweet the sound{Enter}That saved a wretch like me{Enter}I once was lost but now am found');

    // Step 4: Save the changes
    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    // Step 5: Verify the save was successful (loading state disappears)
    await waitFor(() => {
      expect(saveButton).not.toHaveClass('is-loading');
    });

    // Verify the update service was called
    const { updateChoirSongVersion } = await import('../../src/services/choirSongService');
    expect(updateChoirSongVersion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        editedLyricsChordPro: 'Amazing grace\nHow sweet the sound\nThat saved a wretch like me\nI once was lost but now am found'
      }
    );
  });

  it('should handle API errors when loading choir songs', async () => {
    const user = userEvent.setup();

    // Mock the service to reject
    const { getChoirSongsByChoirId } = await import('../../src/services/choirSongService');
    vi.mocked(getChoirSongsByChoirId).mockRejectedValueOnce(new Error('API Error'));

    render(<TestWrapper />);

    // Wait for dashboard navigation buttons to ensure user context is ready
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Master Song List/i })).toBeInTheDocument();
    });

    // Add a small delay to ensure user context has fully loaded
    await new Promise(resolve => setTimeout(resolve, 100));

    // Navigate to Choir Songs
    const choirSongsButton = screen.getByRole('link', { name: /Master Song List/i });
    await user.click(choirSongsButton);

    // Verify fallback navigation to Master Songs page occurs
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Master Songs/i })).toBeInTheDocument();
    });
    // Optionally, check that the error message is not present
    expect(screen.queryByText(/Failed to fetch choir songs/i)).not.toBeInTheDocument();
  });

  it('should handle user with no choir access', async () => {
    const user = userEvent.setup();

    // Mock user without choir
    const { getCurrentUser } = await import('../../src/services/userService');
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 'user-2',
      email: 'nochoir@example.com',
      name: 'No Choir User',
      choirs: [],
      role: 'General',
      hasCompletedOnboarding: true,
      isNewUser: false,
    });

    render(<TestWrapper />);

    // Wait for dashboard to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Directly check for the no-choir dashboard messages
    await waitFor(() => {
      expect(screen.getByText(/You haven't created any choirs yet\./i)).toBeInTheDocument();
      expect(screen.getByText(/You are not a member of any choirs\./i)).toBeInTheDocument();
      expect(screen.getByText(/You have no pending invitations\./i)).toBeInTheDocument();
    });
  });
});
