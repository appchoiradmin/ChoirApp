import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import MasterSongDetailPage from '../src/pages/MasterSongDetailPage';
import { UserProvider } from '../src/contexts/UserContext.tsx';
import { server } from '../src/mocks/server';
import { http, HttpResponse } from 'msw';
import * as userService from '../src/services/userService';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const API_BASE_URL = 'http://localhost:5014';

const mockUser = {
  id: 'user-123',
  email: 'test.user@example.com',
  firstName: 'Test',
  lastName: 'User',
  choirs: [
    {
      id: 'choir-abc',
      name: 'The Test Choir',
      adminId: 'admin-456',
    },
  ],
};

describe('MasterSongDetailPage', () => {
  it('renders song details after fetching', async () => {
    vi.spyOn(userService, 'getCurrentUser').mockResolvedValue(mockUser);
    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/1']}>
          <Routes>
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Song 1', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Artist: Test Artist 1/i)).toBeInTheDocument();
      
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Test Song 1', level: 2 })).toBeInTheDocument();
    });
  });

  it('displays an error message if fetching the song fails', async () => {
    vi.spyOn(userService, 'getCurrentUser').mockResolvedValue(mockUser);
    server.use(
      http.get(`${API_BASE_URL}/api/master-songs/error`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/error']}>
          <Routes>
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch song details')).toBeInTheDocument();
    });
  });

  it('displays "Song not found" if the song does not exist', async () => {
    vi.spyOn(userService, 'getCurrentUser').mockResolvedValue(mockUser);
    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/not-found']}>
          <Routes>
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Song not found.')).toBeInTheDocument();
    });
  });

  it('creates a new choir version when the button is clicked', async () => {
    // Mock localStorage to provide a token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    
    vi.spyOn(userService, 'getCurrentUser').mockResolvedValue(mockUser);
    
    // Reset handlers and set up the specific ones needed for this test
    server.resetHandlers(
      http.get(`${API_BASE_URL}/api/master-songs/1`, () => {
        return HttpResponse.json({
          id: '1',
          title: 'Test Song 1',
          artist: 'Test Artist 1',
          key: 'C',
          tags: [{ tagId: 't1', tagName: 'test' }],
          lyricsChordPro: '{title: Test Song 1}',
        });
      }),
      http.get(`${API_BASE_URL}/api/choirs/:choirId/songs/:songId`, () => {
        console.log('GET choir song - returning 404');
        return new HttpResponse(null, { status: 404 });
      }),
      http.post(`${API_BASE_URL}/api/choirs/:choirId/songs`, async ({ request }) => {
        const body = await request.json();
        console.log('POST request received:', body);
        return HttpResponse.json({
          choirSongId: 'new-song-1',
          masterSongId: '1',
          choirId: 'choir-abc',
          editedLyricsChordPro: 'C',
          lastEditedDate: new Date().toISOString(),
          editorUserId: 'user-123',
        });
      })
    );

    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/1']}>
          <Routes>
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
            <Route path="/choirs/:choirId/songs/:songId/edit" element={<div>Edit Page</div>} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    // Wait for the song to load first
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Song 1', level: 1 })).toBeInTheDocument();
    });

    // Wait for the version check to complete and the button to appear
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create Choir Version/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).not.toBeDisabled();
    });

    // Click the button
    const createButton = screen.getByRole('button', { name: /Create Choir Version/i });
    createButton.click();

    // Wait for navigation or check if button state changes
    await waitFor(() => {
      // Check if the button becomes loading state or if we navigated
      const currentButton = screen.queryByRole('button', { name: /Create Choir Version/i });
      if (currentButton) {
        // If button still exists, check if it has loading state
        expect(currentButton).toHaveClass('is-loading');
      } else {
        // If button doesn't exist, we should be on edit page
        expect(screen.getByText('Edit Page')).toBeInTheDocument();
      }
    }, { timeout: 5000 });

    // Final check for navigation
    await waitFor(() => {
      expect(screen.getByText('Edit Page')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('navigates to the edit page when the "Edit Choir Version" button is clicked', async () => {
    // Mock localStorage to provide a token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    
    vi.spyOn(userService, 'getCurrentUser').mockResolvedValue(mockUser);
    
    // Reset handlers and set up the specific ones needed for this test
    server.resetHandlers(
      http.get(`${API_BASE_URL}/api/master-songs/1`, () => {
        return HttpResponse.json({
          id: '1',
          title: 'Test Song 1',
          artist: 'Test Artist 1',
          key: 'C',
          tags: [{ tagId: 't1', tagName: 'test' }],
          lyricsChordPro: '{title: Test Song 1}',
        });
      }),
      http.get(`${API_BASE_URL}/api/choirs/:choirId/songs/:songId`, () => {
        return HttpResponse.json({
          choirSongId: 'existing-song-1',
          masterSongId: '1',
          choirId: 'choir-abc',
          editedLyricsChordPro: 'G C D',
          lastEditedDate: new Date().toISOString(),
          editorUserId: 'user-123',
        });
      })
    );

    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/1']}>
          <Routes>
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
            <Route path="/choirs/:choirId/songs/:songId/edit" element={<div>Edit Page</div>} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    // Wait for the song to load first
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Song 1', level: 1 })).toBeInTheDocument();
    });

    // Wait for the version check to complete and the edit button to appear
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit Choir Version/i });
      expect(editButton).toBeInTheDocument();
      editButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Page')).toBeInTheDocument();
    });
  });
});
