import type { MasterSongDto, CreateMasterSongDto, TagDto } from '../types/song';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const getAllMasterSongs = async (token: string): Promise<MasterSongDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/master-songs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch master songs');
  }
  return response.json();
};

export const getMasterSongById = async (id: string, token: string): Promise<MasterSongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/master-songs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 404) {
    throw new Error('Song not found');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch master song');
  }
  return response.json();
};

export const createMasterSong = async (songDto: CreateMasterSongDto, token: string): Promise<MasterSongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/master-songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(songDto),
  });

  if (!response.ok) {
    throw new Error('Failed to create master song');
  }
  return response.json();
};

export const searchMasterSongs = async (
  params: { title?: string; artist?: string; tag?: string; skip?: number; take?: number },
  token: string
): Promise<MasterSongDto[]> => {
  const query = new URLSearchParams();
  if (params.title) query.append('title', params.title);
  if (params.artist) query.append('artist', params.artist);
  if (params.tag) query.append('tag', params.tag);
  if (typeof params.skip === 'number') query.append('skip', params.skip.toString());
  if (typeof params.take === 'number') query.append('take', params.take.toString());

  const response = await fetch(`${API_BASE_URL}/api/master-songs/search?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to search songs');
  }
  return response.json();
};

export const getAllTags = async (token: string): Promise<TagDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/tags`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  return response.json();
};
