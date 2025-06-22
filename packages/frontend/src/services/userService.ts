import type { User } from '../types/user.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  return response.json();
};
