import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MasterSongsListPage from '../src/pages/MasterSongsListPage';
import * as masterSongService from '../src/services/masterSongService';

describe('MasterSongsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of master songs', async () => {
    const mockSongs = [
      { id: '1', title: 'Test Song 1', artist: 'Test Artist 1', key: 'C', tags: [], content: '' },
      { id: '2', title: 'Test Song 2', artist: 'Test Artist 2', key: 'G', tags: [], content: '' },
    ];
    vi.spyOn(masterSongService, 'getAllMasterSongs').mockResolvedValue(mockSongs);

    render(
      <BrowserRouter>
        <MasterSongsListPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.getByText('Test Song 2')).toBeInTheDocument();
    });

    expect(screen.getByText(/create new song/i)).toBeInTheDocument();
  });

  it('searches for songs by title and finds results', async () => {
    const mockSongs = [
      { id: '1', title: 'Test Song 1', artist: 'Test Artist 1', key: 'C', tags: [], content: '' },
      { id: '2', title: 'Test Song 2', artist: 'Test Artist 2', key: 'G', tags: [], content: '' },
    ];
    vi.spyOn(masterSongService, 'getAllMasterSongs').mockResolvedValue(mockSongs);
    const searchMock = vi.spyOn(masterSongService, 'searchMasterSongs').mockResolvedValue([mockSongs[0]]);

    render(
      <BrowserRouter>
        <MasterSongsListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Song 1' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith({ title: 'Song 1', artist: '', tag: '' });
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Song 2')).not.toBeInTheDocument();
    });
  });

  it('searches for songs by title and finds no results', async () => {
    const mockSongs = [
      { id: '1', title: 'Test Song 1', artist: 'Test Artist 1', key: 'C', tags: [], content: '' },
      { id: '2', title: 'Test Song 2', artist: 'Test Artist 2', key: 'G', tags: [], content: '' },
    ];
    vi.spyOn(masterSongService, 'getAllMasterSongs').mockResolvedValue(mockSongs);
    const searchMock = vi.spyOn(masterSongService, 'searchMasterSongs').mockResolvedValue([]);

    render(
      <BrowserRouter>
        <MasterSongsListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Non-existent song' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith({ title: 'Non-existent song', artist: '', tag: '' });
      expect(screen.queryByText('Test Song 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Song 2')).not.toBeInTheDocument();
    });
  });

  it('displays an error message if fetching songs fails', async () => {
    vi.spyOn(masterSongService, 'getAllMasterSongs').mockRejectedValue(new Error('Failed to fetch songs'));

    render(
      <BrowserRouter>
        <MasterSongsListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch songs/i)).toBeInTheDocument();
    });
  });

  it('displays an error message if searching for songs fails', async () => {
    const mockSongs = [
        { id: '1', title: 'Test Song 1', artist: 'Test Artist 1', key: 'C', tags: [], content: '' },
    ];
    vi.spyOn(masterSongService, 'getAllMasterSongs').mockResolvedValue(mockSongs);
    vi.spyOn(masterSongService, 'searchMasterSongs').mockRejectedValue(new Error('Failed to search for songs.'));

    render(
      <BrowserRouter>
        <MasterSongsListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText(/failed to search for songs/i)).toBeInTheDocument();
    });
  });
});
