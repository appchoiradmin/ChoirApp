import { Choir } from '../types/choir';

const API_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const createChoir = async (
  choirName: string,
  token: string
): Promise<Choir> => {
  const response = await fetch(`${API_URL}/api/choirs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: choirName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create choir');
  }

  return response.json();
};
