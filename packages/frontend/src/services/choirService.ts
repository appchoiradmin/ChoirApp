import { Choir, ChoirDetails, ChoirRole } from '../types/choir';

const API_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const createChoir = async (
  choirData: { name: string; address?: string; notes?: string },
  token: string
): Promise<Choir> => {
  const response = await fetch(`${API_URL}/api/choirs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(choirData),
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
  choirData: { name: string; address?: string; notes?: string },
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(choirData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to update choir';
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      }
    } catch {
      // If parsing fails, use the raw text or default message
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  // Check if there's a response body
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // If no JSON response, return void
  return;
};

export const deleteChoir = async (
  choirId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to delete choir';
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      }
    } catch {
      // If parsing fails, use the raw text or default message
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};
