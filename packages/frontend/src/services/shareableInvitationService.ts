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
    let errorMessage = 'Failed to create shareable invitation';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.title || errorMessage;
    } catch (jsonError) {
      // Response doesn't contain JSON, use status-based error message
      if (response.status === 401) {
        errorMessage = 'You are not authorized to create invitations for this choir';
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to create invitations';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request data';
      } else {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
    }
    
    throw new Error(errorMessage);
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
    let errorMessage = 'Failed to accept invitation';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.title || errorMessage;
    } catch (jsonError) {
      // Response doesn't contain JSON, use status-based error message
      if (response.status === 401) {
        errorMessage = 'You are not authorized to accept this invitation';
      } else if (response.status === 404) {
        errorMessage = 'Invitation not found or has expired';
      } else if (response.status === 400) {
        errorMessage = 'Invalid invitation data';
      } else {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
    }
    
    throw new Error(errorMessage);
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
