import type { MasterSongDto, CreateMasterSongDto } from '../types/song';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const getAllMasterSongs = async (): Promise<MasterSongDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/master-songs`);
  if (!response.ok) {
    throw new Error('Failed to fetch master songs');
  }
  return response.json();
};

export const getMasterSongById = async (id: string): Promise<MasterSongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/master-songs/${id}`);
  if (response.status === 404) {
    throw new Error('Song not found');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch master song');
  }
  return response.json();
};

export const createMasterSong = async (songDto: CreateMasterSongDto): Promise<MasterSongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/master-songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songDto }),
  });

  if (!response.ok) {
    throw new Error('Failed to create master song');
  }
  return response.json();
};

export const searchMasterSongs = async (params: { title?: string; artist?: string; tag?: string }): Promise<MasterSongDto[]> => {
  const query = new URLSearchParams();
  if (params.title) query.append('title', params.title);
  if (params.artist) query.append('artist', params.artist);
  if (params.tag) query.append('tag', params.tag);

  const response = await fetch(`${API_BASE_URL}/api/songs/search?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to search songs');
  }
  return response.json();
};
