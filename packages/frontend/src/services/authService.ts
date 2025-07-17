const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

/**
 * Refreshes the user's JWT token to reflect their current roles and permissions
 * @param token The current JWT token
 * @returns A new JWT token with updated roles
 */
export const refreshToken = async (token: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestId: 'refresh-token-request' }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to refresh token');
  }

  const data = await response.json();
  return data.token;
};
