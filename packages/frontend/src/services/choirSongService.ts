import type { ChoirSongVersionDto, CreateChoirSongVersionDto } from '../types/choir';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const createChoirSongVersion = async (choirId: string, createDto: CreateChoirSongVersionDto): Promise<ChoirSongVersionDto> => {
  const response = await fetch(`${API_BASE_URL}/api/choirs/${choirId}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createDto),
  });

  if (!response.ok) {
    throw new Error('Failed to create choir song version');
  }

  return response.json();
};
