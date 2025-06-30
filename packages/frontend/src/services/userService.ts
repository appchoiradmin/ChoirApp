import type { User } from '../types/user.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const getCurrentUser = async (token: string): Promise<User> => {

  const response = await fetch(`${API_BASE_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  const dto = await response.json();

  return {
    id: dto.id,
    email: dto.email,
    name: `${dto.firstName} ${dto.lastName}`,
    role: dto.role,
    choirs: dto.choirs,
    hasCompletedOnboarding: dto.hasCompletedOnboarding,
    isNewUser: dto.isNewUser,
    token: token,
  };
};

export const completeOnboarding = async (userType: 'admin' | 'general'): Promise<void> => {
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
    body: JSON.stringify({ userType }),
  });

  if (!response.ok) {
    throw new Error('Failed to complete onboarding');
  }
};
