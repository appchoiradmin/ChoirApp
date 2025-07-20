import { Playlist, PlaylistTemplate, AddSongToPlaylistDto } from '../types/playlist';

export type CreatePlaylistTemplatePayload = {
  title: string;
  description?: string;
  choirId: string;
  sections: string[];
};

export type UpdatePlaylistTemplatePayload = {
  title: string;
  description?: string;
  sections: string[];
};

const API_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

export const createPlaylist = async (
  playlist: Partial<Playlist>,
  token: string
): Promise<Playlist> => {
  const response = await fetch(`${API_URL}/api/playlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(playlist),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create playlist');
  }

  return response.json();
};

export const getPlaylistsByChoirId = async (
  choirId: string,
  token: string
): Promise<Playlist[]> => {
  const response = await fetch(`${API_URL}/api/choirs/${choirId}/playlists`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch playlists');
  }

  return response.json();
};

export const getPlaylistById = async (
  playlistId: string,
  token: string
): Promise<Playlist> => {
  const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch playlist');
  }

  return response.json();
};

export const addSongToPlaylist = async (
  playlistId: string,
  data: AddSongToPlaylistDto,
  token: string
): Promise<void> => {
  console.log('Debug - API Call addSongToPlaylist:', {
    playlistId,
    data,
    token: token ? 'present' : 'missing',
    url: `${API_URL}/api/playlists/${playlistId}/songs`
  });

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  console.log('Debug - API Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    let errorMessage = 'Failed to add song to playlist';
    try {
      const errorData = await response.json();
      console.error('Debug - API Error Response:', errorData);
      
      // Log detailed validation errors if available
      if (errorData.errors) {
        console.error('Debug - Validation Errors:', errorData.errors);
        Object.keys(errorData.errors).forEach(field => {
          console.error(`Debug - Field '${field}':`, errorData.errors[field]);
        });
      }
      
      errorMessage = errorData.message || errorData.title || errorMessage;
    } catch (parseError) {
      console.error('Debug - Failed to parse error response:', parseError);
    }
    throw new Error(errorMessage);
  }

  console.log('Debug - Song added to playlist successfully');
};

export interface UpdatePlaylistSongDto {
  songId: string;
  order: number;
}

export interface UpdatePlaylistSectionDto {
  title: string;
  order: number;
  songs: UpdatePlaylistSongDto[];
}

export interface UpdatePlaylistDto {
  title: string;
  isPublic: boolean;
  sections: UpdatePlaylistSectionDto[];
  playlistTemplateId?: string;
}

export const updatePlaylist = async (
  playlistId: string,
  playlist: UpdatePlaylistDto,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(playlist),
  });

  if (!response.ok) {
    throw new Error('Failed to update playlist');
  }
};

export const deletePlaylist = async (
  playlistId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete playlist');
  }
};

export const createPlaylistTemplate = async (
  template: CreatePlaylistTemplatePayload,
  token: string
): Promise<PlaylistTemplate> => {
  const response = await fetch(`${API_URL}/api/playlist-templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create playlist template');
  }

  return response.json();
};

export const getPlaylistTemplatesByChoirId = async (
  choirId: string,
  token: string
): Promise<PlaylistTemplate[]> => {
  const response = await fetch(
    `${API_URL}/api/choirs/${choirId}/playlist-templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch playlist templates');
  }

  return response.json();
};


export const getPlaylistTemplateById = async (
  templateId: string,
  token: string
): Promise<PlaylistTemplate> => {
  const response = await fetch(`${API_URL}/api/playlist-templates/${templateId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch playlist template');
  }

  return response.json();
};

export const updatePlaylistTemplate = async (
  templateId: string,
  template: UpdatePlaylistTemplatePayload,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlist-templates/${templateId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    throw new Error('Failed to update playlist template');
  }
};

export const deletePlaylistTemplate = async (
  templateId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlist-templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete playlist template');
  }
};

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove song from playlist');
  }
};

export interface MoveSongInPlaylistDto {
  fromSectionId: string;
  toSectionId: string;
}

export const moveSongInPlaylist = async (
  playlistId: string,
  songId: string,
  data: MoveSongInPlaylistDto,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlists/${playlistId}/songs/${songId}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to move song in playlist');
  }
};

export interface SetTemplateDefaultDto {
  isDefault: boolean;
}

export const setPlaylistTemplateDefault = async (
  templateId: string,
  isDefault: boolean,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/api/playlist-templates/${templateId}/default`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isDefault }),
  });

  if (!response.ok) {
    throw new Error('Failed to set template default status');
  }
};
