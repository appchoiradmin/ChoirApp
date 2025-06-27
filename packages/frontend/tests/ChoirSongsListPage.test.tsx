import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ChoirSongsListPage from '../src/pages/ChoirSongsListPage';
import * as useUserHook from '../src/hooks/useUser'; // Import the hook directly
import * as choirSongService from '../src/services/choirSongService'; // Import the service directly
import { server } from '../src/mocks/server';

describe('ChoirSongsListPage', () => {
  beforeEach(() => {
    server.listen();
    vi.clearAllMocks();
    vi.spyOn(localStorage, 'getItem').mockReturnValue('test-token');
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  it('displays message when user is not logged in', async () => {
    vi.spyOn(useUserHook, 'useUser').mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ChoirSongsListPage />
      </BrowserRouter>
    );
    expect(await screen.findByText(/Please log in to see choir songs./i)).toBeInTheDocument();
  });

  it('displays choir songs when fetched successfully', async () => {
    const mockSongs = [
      {
        choirSongId: 'song1',
        masterSongId: 'master1',
        choirId: 'choir-abc',
        editedLyricsChordPro: 'lyrics1',
        lastEditedDate: '2023-01-01T00:00:00Z',
        editorUserId: 'user1',
        masterSong: { id: 'master1', title: 'Song One', artist: 'Artist A', lyricsChordPro: 'lyrics1', tags: [] },
      },
      {
        choirSongId: 'song2',
        masterSongId: 'master2',
        choirId: 'choir-abc',
        editedLyricsChordPro: 'lyrics2',
        lastEditedDate: '2023-01-02T00:00:00Z',
        editorUserId: 'user1',
        masterSong: { id: 'master2', title: 'Song Two', artist: 'Artist B', lyricsChordPro: 'lyrics2', tags: [] },
      },
    ];

    vi.spyOn(useUserHook, 'useUser').mockReturnValue({
      user: { id: 'user-123', email: 'test@test.com', choirs: [{ id: 'choir-abc', name: 'Test Choir' }], choirId: 'choir-abc' },
      loading: false,
    });

    vi.spyOn(choirSongService, 'getChoirSongsByChoirId').mockResolvedValue(mockSongs);

    render(
      <BrowserRouter>
        <ChoirSongsListPage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Song One')).toBeInTheDocument();
    expect(screen.getByText('Artist A')).toBeInTheDocument();
    expect(screen.getByText('Song Two')).toBeInTheDocument();
    expect(screen.getByText('Artist B')).toBeInTheDocument();
  });

  it('displays message when no songs are found', async () => {
    vi.spyOn(useUserHook, 'useUser').mockReturnValue({
      user: { id: 'user-123', email: 'test@test.com', choirs: [{ id: 'choir-abc', name: 'Test Choir' }], choirId: 'choir-abc' },
      loading: false,
    });

    vi.spyOn(choirSongService, 'getChoirSongsByChoirId').mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ChoirSongsListPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Your choir has not created any custom song versions yet./i)).toBeInTheDocument();
  });

  it('displays error message when fetching songs fails', async () => {
    vi.spyOn(useUserHook, 'useUser').mockReturnValue({
      user: { id: 'user-123', email: 'test@test.com', choirs: [{ id: 'choir-abc', name: 'Test Choir' }], choirId: 'choir-abc' },
      loading: false,
    });

    vi.spyOn(choirSongService, 'getChoirSongsByChoirId').mockRejectedValue(new Error('Failed to fetch choir songs'));

    render(
      <BrowserRouter>
        <ChoirSongsListPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Failed to fetch choir songs. Please try again later./i)).toBeInTheDocument();
  });

  it('displays message if user is not part of a choir', async () => {
    vi.spyOn(useUserHook, 'useUser').mockReturnValue({
      user: { id: 'user-123', email: 'test@test.com', choirs: [], choirId: undefined },
      loading: false,
    });

    render(
      <BrowserRouter>
        <ChoirSongsListPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/You must be part of a choir to see its songs./i)).toBeInTheDocument();
  });

  it('navigates to master songs list page', async () => {
    vi.spyOn(useUserHook, 'useUser').mockReturnValue({
      user: { id: 'user-123', email: 'test@test.com', choirs: [{ id: 'choir-abc', name: 'Test Choir' }], choirId: 'choir-abc' },
      loading: false,
    });

    vi.spyOn(choirSongService, 'getChoirSongsByChoirId').mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ChoirSongsListPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Your choir has not created any custom song versions yet./i)).toBeInTheDocument();

    const masterSongsLink = screen.getByRole('link', { name: /Master Song List/i });
    expect(masterSongsLink).toHaveAttribute('href', '/master-songs');
  });
});