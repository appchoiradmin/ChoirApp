import { Invitation } from '../types/invitation';

const API_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const getInvitations = async (token: string): Promise<Invitation[]> => {
  const response = await fetch(`${API_URL}/api/invitations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch invitations');
  }
  return response.json();
};

export const acceptInvitation = async (invitationToken: string, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/invitations/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ invitationToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to accept invitation');
  }
};

export const rejectInvitation = async (invitationToken: string, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/invitations/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ invitationToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to reject invitation');
  }
};

export const getInvitationsByChoir = async (choirId: string, token: string): Promise<Invitation[]> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}/invitations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch invitations');
  }
  return response.json();
}
