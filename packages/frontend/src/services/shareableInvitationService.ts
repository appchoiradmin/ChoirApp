const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export interface ShareableInvitation {
  invitationId: string;
  choirId: string;
  invitationToken: string;
  createdBy: string;
  dateCreated: string;
  expiryDate?: string;
  isActive: boolean;
  maxUses?: number;
  currentUses: number;
  invitationUrl: string;
}

export interface CreateShareableInvitationRequest {
  choirId: string;
  expiryDate?: string;
  maxUses?: number;
}

export interface AcceptShareableInvitationRequest {
  invitationToken: string;
}

export const createShareableInvitation = async (
  request: CreateShareableInvitationRequest,
  token: string
): Promise<ShareableInvitation> => {
  const response = await fetch(`${API_BASE_URL}/api/invitations/shareable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create shareable invitation');
  }

  return response.json();
};

export const getShareableInvitationByToken = async (
  token: string
): Promise<ShareableInvitation> => {
  const response = await fetch(`${API_BASE_URL}/api/invitations/shareable/${token}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Invitation not found or expired');
  }

  return response.json();
};

export const acceptShareableInvitation = async (
  request: AcceptShareableInvitationRequest,
  authToken: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/invitations/shareable/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to accept invitation');
  }
};

export const getShareableInvitationsByChoir = async (
  choirId: string,
  token: string
): Promise<ShareableInvitation[]> => {
  const response = await fetch(`${API_BASE_URL}/api/invitations/shareable/choir/${choirId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shareable invitations');
  }

  return response.json();
};
