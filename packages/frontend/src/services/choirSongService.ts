import type { ChoirSongVersionDto, CreateChoirSongVersionDto, UpdateChoirSongVersionDto } from '../types/choir';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const createChoirSongVersion = async (choirId: string, createDto: CreateChoirSongVersionDto, token: string): Promise<ChoirSongVersionDto> => {
  const response = await fetch(`${API_BASE_URL}/api/choirs/${choirId}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(createDto),
  });

  if (!response.ok) {
    throw new Error('Failed to create choir song version');
  }

  return response.json();
};

export const getChoirSongsByChoirId = async (choirId: string, token: string): Promise<ChoirSongVersionDto[]> => {
    const response = await fetch(`${API_BASE_URL}/api/choirs/${choirId}/songs`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch choir songs');
    }

    return response.json();
};

export const getChoirSongById = async (choirId: string, songId: string, token: string): Promise<ChoirSongVersionDto> => {
    const response = await fetch(`${API_BASE_URL}/api/choirs/${choirId}/songs/${songId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch choir song');
    }

    return response.json();
};

export const updateChoirSongVersion = async (choirId: string, songId: string, updateDto: UpdateChoirSongVersionDto, token: string): Promise<ChoirSongVersionDto> => {
    const response = await fetch(`${API_BASE_URL}/api/choirs/${choirId}/songs/${songId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateDto),
    });

    if (!response.ok) {
        throw new Error('Failed to update choir song version');
    }

    return response.json();
};
