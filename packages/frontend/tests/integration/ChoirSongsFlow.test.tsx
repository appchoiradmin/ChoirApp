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
    firstName: 'Test',
    lastName: 'User',
    choirs: [{ id: 'choir-1', name: 'Test Choir' }],
    choirId: 'choir-1'
  }),
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
    // Reset mock implementations
    const choirSongService = await import('../../src/services/choirSongService');
    const masterSongService = await import('../../src/services/masterSongService');
    const userService = await import('../../src/services/userService');
    
    // Reset user service mock to ensure consistent user context
    vi.mocked(userService.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      choirs: [{ id: 'choir-1', name: 'Test Choir' }],
      choirId: 'choir-1'
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow user to view existing choir songs and navigate to edit', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Step 1: Verify we start on Dashboard and wait for user context to load
    expect(screen.getByRole('heading', { name: /Choir Dashboard/i })).toBeInTheDocument();
    
    // Wait for user context to load by checking that we're not in loading state anymore
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Step 2: Navigate to Choir Songs
    const choirSongsButton = screen.getByRole('link', { name: /Manage Choir Songs/i });
    await user.click(choirSongsButton);

    // Step 3: Verify we're on Choir Songs List page and wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Choir's Songs/i })).toBeInTheDocument();
    });

    // Step 4: Verify existing choir songs are displayed
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('Traditional')).toBeInTheDocument();
    });

    // Step 5: Navigate to edit the choir song
    const editButton = screen.getByRole('link', { name: /View\/Edit/i });
    await user.click(editButton);

    // Step 6: Verify we're on the song editor page
    await waitFor(() => {
      expect(screen.getByText(/Edit Song:/i)).toBeInTheDocument();
    });

    // Verify the choir song service was called
    const { getChoirSongsByChoirId } = await import('../../src/services/choirSongService');
    expect(getChoirSongsByChoirId).toHaveBeenCalledWith('choir-1');
  });

  it('should allow user to create a new choir song version from master songs', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Step 1: Wait for dashboard navigation buttons to ensure user context is ready
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Manage Choir Songs/i })).toBeInTheDocument();
    });

    // Add a small delay to ensure user context has fully loaded
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 2: Navigate to Choir Songs
    const choirSongsButton = screen.getByRole('link', { name: /Manage Choir Songs/i });
    await user.click(choirSongsButton);

    // Step 3: Wait for the Choir Songs page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Choir's Songs/i })).toBeInTheDocument();
    });

    // Step 4: Navigate to Master Songs to create new version
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Master Song List/i })).toBeInTheDocument();
    });
    
    const masterSongsLink = screen.getByRole('link', { name: /Master Song List/i });
    await user.click(masterSongsLink);

    // Step 5: Verify we're on Master Songs page
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
      expect(screen.getByRole('link', { name: /Manage Choir Songs/i })).toBeInTheDocument();
    });

    // Add a small delay to ensure user context has fully loaded
    await new Promise(resolve => setTimeout(resolve, 100));

    // Navigate to Choir Songs
    const choirSongsButton = screen.getByRole('link', { name: /Manage Choir Songs/i });
    await user.click(choirSongsButton);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch choir songs/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch choir songs/i)).toBeInTheDocument();
    });
  });

  it('should handle user with no choir access', async () => {
    const user = userEvent.setup();

    // Mock user without choir
    const { getCurrentUser } = await import('../../src/services/userService');
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 'user-2',
      email: 'nochoir@example.com',
      firstName: 'No Choir',
      lastName: 'User',
      choirs: [],
      choirId: undefined
    });

    render(<TestWrapper />);

    // Navigate to Choir Songs
    const choirSongsButton = screen.getByRole('link', { name: /Manage Choir Songs/i });
    await user.click(choirSongsButton);

    // Verify appropriate message appears
    await waitFor(() => {
      expect(screen.getByText(/You must be part of a choir/i)).toBeInTheDocument();
    });
  });
});
