import type { User } from '../types/user.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  return response.json();
};

export const completeOnboarding = async (): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/complete-onboarding`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to complete onboarding');
  }
};
