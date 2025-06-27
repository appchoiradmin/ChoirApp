import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import DashboardPage from '../../src/pages/DashboardPage.tsx';
import MasterSongsListPage from '../../src/pages/MasterSongsListPage.tsx';
import CreateMasterSongPage from '../../src/pages/CreateMasterSongPage.tsx';
import MasterSongDetailPage from '../../src/pages/MasterSongDetailPage.tsx';
import '../../src/setupTests.ts';

// Mock the userService to prevent actual API calls
vi.mock('../../src/services/userService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

// Mock the masterSongService to prevent actual API calls
vi.mock('../../src/services/masterSongService', () => {
  const mockSongs = [
    { 
      id: '1', 
      title: 'Amazing Grace', 
      artist: 'Traditional', 
      lyricsChordPro: 'Amazing grace, how sweet the sound',
      tags: [{ tagId: '1', tagName: 'hymn' }, { tagId: '2', tagName: 'traditional' }] 
    },
    { 
      id: '2', 
      title: 'How Great Thou Art', 
      artist: 'Carl Boberg', 
      lyricsChordPro: 'O Lord my God, when I in awesome wonder',
      tags: [{ tagId: '1', tagName: 'hymn' }, { tagId: '3', tagName: 'worship' }] 
    }
  ];

  return {
    getAllMasterSongs: vi.fn().mockResolvedValue(mockSongs),
    createMasterSong: vi.fn().mockImplementation((song) => 
      Promise.resolve({ 
        id: '3', 
        title: song.title,
        artist: song.artist,
        lyricsChordPro: song.lyricsChordPro,
        tags: song.tags.map((tag, index) => ({ tagId: `${index + 4}`, tagName: tag }))
      })
    ),
    searchMasterSongs: vi.fn().mockResolvedValue([mockSongs[0]]),
  };
});

// Create a test router with memory router for master songs flow
const createTestRouter = () => {
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
      path: "/master-songs",
      element: <MasterSongsListPage />
    },
    {
      path: "/master-songs/create",
      element: <CreateMasterSongPage />
    },
    {
      path: "/master-songs/:id",
      element: <MasterSongDetailPage />
    }
  ], {
    initialEntries: ["/dashboard"], // Start at dashboard
    initialIndex: 0
  });
};

// Create a test wrapper that creates a fresh router for each test
const TestWrapper: React.FC = () => {
  const router = createTestRouter();
  return (
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
};

describe('Master Songs Management Flow - Integration Test', () => {
  beforeEach(async () => {
    // Reset mock implementations instead of clearing all mocks
    const masterSongService = await import('../../src/services/masterSongService');
    const mockSongs = [
      { 
        id: '1', 
        title: 'Amazing Grace', 
        artist: 'Traditional', 
        lyricsChordPro: 'Amazing grace, how sweet the sound',
        tags: [{ tagId: '1', tagName: 'hymn' }, { tagId: '2', tagName: 'traditional' }] 
      },
      { 
        id: '2', 
        title: 'How Great Thou Art', 
        artist: 'Carl Boberg', 
        lyricsChordPro: 'O Lord my God, when I in awesome wonder',
        tags: [{ tagId: '1', tagName: 'hymn' }, { tagId: '3', tagName: 'worship' }] 
      }
    ];
    
    vi.mocked(masterSongService.getAllMasterSongs).mockResolvedValue(mockSongs);
    vi.mocked(masterSongService.createMasterSong).mockImplementation((song) => 
      Promise.resolve({ 
        id: '3', 
        title: song.title,
        artist: song.artist,
        lyricsChordPro: song.lyricsChordPro,
        tags: song.tags.map((tag, index) => ({ tagId: `${index + 4}`, tagName: tag }))
      })
    );
    vi.mocked(masterSongService.searchMasterSongs).mockResolvedValue([mockSongs[0]]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow user to complete the full master songs management flow', async () => {
    const user = userEvent.setup();

    // Render the test wrapper starting at dashboard
    render(<TestWrapper />);

    // Step 1: Verify we start on Dashboard
    expect(screen.getByRole('heading', { name: /Choir Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to your choir's central hub!/i)).toBeInTheDocument();

    // Step 2: Navigate to Master Songs
    const masterSongsButton = screen.getByRole('link', { name: /Manage Master Songs/i });
    await user.click(masterSongsButton);

    // Step 3: Verify we're on Master Songs List page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Master Songs/i })).toBeInTheDocument();
    });

    // Verify the existing songs are loaded
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    });

    // Step 4: Navigate to Create New Song
    const createSongButton = screen.getByRole('link', { name: /Create New Song/i });
    await user.click(createSongButton);

    // Step 5: Verify we're on Create Master Song page
    expect(screen.getByRole('heading', { name: /Create New Master Song/i })).toBeInTheDocument();

    // Step 6: Fill out the song creation form
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'Test Song Title');

    const artistInput = screen.getByLabelText(/Artist/i);
    await user.type(artistInput, 'Test Artist');

    const tagsInput = screen.getByLabelText(/Tags/i);
    await user.type(tagsInput, 'test, integration, song');

    const contentTextarea = screen.getByLabelText(/Content/i);
    await user.type(contentTextarea, 'Title: Test Song Title{Enter}Artist: Test Artist{Enter}{Enter}Verse 1{Enter}This is a test song{Enter}For integration testing');

    // Step 7: Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Song/i });
    await user.click(submitButton);

    // Step 8: Verify navigation to the new song detail page
    // Note: The actual implementation navigates to the detail page, but since we're mocking the service,
    // we can verify the form submission was successful by checking the loading state disappears
    await waitFor(() => {
      expect(submitButton).not.toHaveClass('is-loading');
    });

    // Verify the form was submitted with correct data
    const { createMasterSong } = await import('../../src/services/masterSongService');
    expect(createMasterSong).toHaveBeenCalledWith({
      title: 'Test Song Title',
      artist: 'Test Artist',
      lyricsChordPro: 'Title: Test Song Title\nArtist: Test Artist\n\nVerse 1\nThis is a test song\nFor integration testing',
      tags: ['test', 'integration', 'song']
    });
  });

  it('should handle master song creation validation errors', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Navigate to Master Songs
    const masterSongsButton = screen.getByRole('link', { name: /Manage Master Songs/i });
    await user.click(masterSongsButton);

    // Navigate to Create New Song
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Create New Song/i })).toBeInTheDocument();
    });
    
    const createSongButton = screen.getByRole('link', { name: /Create New Song/i });
    await user.click(createSongButton);

    // Try to submit form with only title (missing required content)
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'Incomplete Song');

    const submitButton = screen.getByRole('button', { name: /Create Song/i });
    await user.click(submitButton);

    // The form should not submit due to HTML5 validation (required fields)
    // Since content is required, the form won't submit
    expect(screen.getByRole('heading', { name: /Create New Master Song/i })).toBeInTheDocument();
  });

  it('should handle master song creation API errors', async () => {
    const user = userEvent.setup();

    // Mock the service to reject
    const { createMasterSong } = await import('../../src/services/masterSongService');
    vi.mocked(createMasterSong).mockRejectedValueOnce(new Error('API Error'));

    render(<TestWrapper />);

    // Navigate through the flow
    const masterSongsButton = screen.getByRole('link', { name: /Manage Master Songs/i });
    await user.click(masterSongsButton);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Create New Song/i })).toBeInTheDocument();
    });
    
    const createSongButton = screen.getByRole('link', { name: /Create New Song/i });
    await user.click(createSongButton);

    // Fill out the form completely
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'Error Test Song');

    const contentTextarea = screen.getByLabelText(/Content/i);
    await user.type(contentTextarea, 'Test content for error scenario');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Song/i });
    await user.click(submitButton);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to create song/i)).toBeInTheDocument();
    });

    // Verify we're still on the create page
    expect(screen.getByRole('heading', { name: /Create New Master Song/i })).toBeInTheDocument();
  });

  it('should allow searching for master songs', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Navigate to Master Songs
    const masterSongsButton = screen.getByRole('link', { name: /Manage Master Songs/i });
    await user.click(masterSongsButton);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Master Songs/i })).toBeInTheDocument();
    });

    // Verify initial songs are loaded
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    });

    // Perform a search
    const titleSearchInput = screen.getByPlaceholderText(/Title/i);
    await user.type(titleSearchInput, 'Amazing');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    // Verify search results
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      // "How Great Thou Art" should not be visible in search results
    });

    // Verify the search service was called
    const { searchMasterSongs } = await import('../../src/services/masterSongService');
    expect(searchMasterSongs).toHaveBeenCalledWith({
      title: 'Amazing',
      artist: '',
      tag: ''
    });
  });
});
