import type { MasterSongDto, CreateMasterSongDto } from '../types/song';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const getAllMasterSongs = async (): Promise<MasterSongDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/mastersongs`);
  if (!response.ok) {
    throw new Error('Failed to fetch master songs');
  }
  return response.json();
};

export const getMasterSongById = async (id: string): Promise<MasterSongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/mastersongs/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch master song');
  }
  return response.json();
};

export const createMasterSong = async (songDto: CreateMasterSongDto): Promise<MasterSongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/mastersongs`, {
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
