const API_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export interface ShareableInviteResponse {
  inviteLink: string;
  invitationToken: string;
}

export interface ShareableInviteInfo {
  choirName: string;
  choirId: string;
  isValid: boolean;
  isExpired: boolean;
  errorMessage?: string;
}

export const createShareableInvite = async (
  choirId: string,
  token: string
): Promise<ShareableInviteResponse> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}/shareable-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create shareable invitation');
  }

  return response.json();
};

export const getShareableInviteInfo = async (
  invitationToken: string
): Promise<ShareableInviteInfo> => {
  const response = await fetch(`${API_URL}/api/invite/${invitationToken}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to get invitation information');
  }

  return response.json();
};

export const acceptShareableInvite = async (
  invitationToken: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/invite/${encodeURIComponent(invitationToken)}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to accept invitation');
  }
};
