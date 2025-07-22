import { Choir, ChoirDetails, ChoirRole } from '../types/choir';

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

export const getChoirDetails = async (
  choirId: string,
  token: string
): Promise<ChoirDetails> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch choir details');
  }

  return response.json();
};

export const inviteUser = async (
  choirId: string,
  email: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to invite user');
  }
};

export const removeMember = async (
  choirId: string,
  userId: string,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/choirs/${choirId}/members/${userId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to remove member');
  }
};

export const updateMemberRole = async (
  choirId: string,
  userId: string,
  role: ChoirRole,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/choirs/${choirId}/members/${userId}/role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update member role');
  }
};

export const updateChoir = async (
  choirId: string,
  choirName: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ChoirId: choirId,
      Dto: {
        Name: choirName
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update choir');
  }
};
