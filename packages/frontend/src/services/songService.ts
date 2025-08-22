import type { 
  SongDto, 
  CreateSongDto, 
  UpdateSongDto, 
  CreateSongVersionDto, 
  SongSearchParams,
  SearchSongsResponse,
  TagDto,
  UpdateSongVisibilityDto,
  SongTagDto
} from '../types/song';
import { globalSongCache } from '../utils/songCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Creates a new song
 * @param songDto The song data to create
 * @param token Authentication token
 * @returns The created song
 */
export const createSong = async (songDto: CreateSongDto, token: string): Promise<SongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(songDto)
  });

  if (!response.ok) {
    throw new Error(`Failed to create song: ${response.statusText}`);
  }

  const createdSong = await response.json();
  
  // Cache the newly created song
  globalSongCache.set(createdSong.songId, createdSong);
  
  return createdSong;
};

/**
 * Creates a new version of an existing song
 * @param baseSongId The ID of the base song
 * @param versionDto The version data
 * @param token Authentication token
 * @returns The created song version
 */
export const createSongVersion = async (baseSongId: string, versionDto: CreateSongVersionDto, token: string): Promise<SongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/${baseSongId}/versions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(versionDto)
  });

  if (!response.ok) {
    throw new Error(`Failed to create song version: ${response.statusText}`);
  }

  const createdVersion = await response.json();
  
  // Cache the newly created song version
  globalSongCache.set(createdVersion.songId, createdVersion);
  
  return createdVersion;
};

/**
 * Gets a song by its ID with client-side caching
 * @param id Song ID
 * @param token Authentication token
 * @returns The song
 */
export const getSongById = async (id: string, token: string): Promise<SongDto> => {
  // Check cache first
  const cached = globalSongCache.get(id);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const response = await fetch(`${API_BASE_URL}/api/songs/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get song: ${response.statusText}`);
  }

  const song = await response.json();
  
  // Store in cache for future requests
  globalSongCache.set(id, song);
  
  return song;
};

/**
 * Gets all versions of a song
 * @param baseSongId The ID of the base song
 * @param token Authentication token
 * @returns Array of song versions
 */
export const getSongVersions = async (baseSongId: string, token: string): Promise<SongDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/${baseSongId}/versions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get song versions: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Searches for songs based on provided parameters
 * @param params Search parameters
 * @param token Authentication token
 * @returns Array of matching songs
 */
/**
 * Get all tags from the server
 * @param token Authentication token
 * @returns Array of tags
 */
export const getAllTags = async (token: string): Promise<TagDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/tags`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Get tag suggestions based on a query
 * @param query Search query for tags
 * @param maxResults Maximum number of results to return
 * @param token Authentication token
 * @returns Array of matching tags
 */
export const getTagSuggestions = async (query: string = '', maxResults: number = 10, token: string): Promise<TagDto[]> => {
  const queryParams = new URLSearchParams();
  if (query) queryParams.append('query', query);
  queryParams.append('maxResults', maxResults.toString());

  const response = await fetch(`${API_BASE_URL}/api/tags/suggestions?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tag suggestions: ${response.statusText}`);
  }

  return await response.json();
};

export const searchSongs = async (params: SongSearchParams, token: string): Promise<SearchSongsResponse> => {
  // Build query string from params
  const queryParams = new URLSearchParams();
  
  // Add searchTerm parameter (required by backend)
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  
  if (params.title) queryParams.append('title', params.title);
  if (params.artist) queryParams.append('artist', params.artist);
  if (params.content) queryParams.append('content', params.content);
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.choirId) queryParams.append('choirId', params.choirId);
  if (params.visibility !== undefined) queryParams.append('visibility', params.visibility.toString());
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.take !== undefined) queryParams.append('take', params.take.toString());
  
  // Handle tags array
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach(tag => queryParams.append('tags', tag));
  }
  
  // Add onlyUserCreated parameter
  if (params.onlyUserCreated !== undefined) {
    queryParams.append('onlyUserCreated', params.onlyUserCreated.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/songs/search?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to search songs: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Updates a song's details
 * @param songId Song ID
 * @param updateDto Update data
 * @param token Authentication token
 * @returns The updated song
 */
export const updateSong = async (songId: string, updateDto: UpdateSongDto, token: string): Promise<SongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateDto)
  });

  if (!response.ok) {
    throw new Error(`Failed to update song: ${response.statusText}`);
  }

  const updatedSong = await response.json();
  
  // Invalidate cache to ensure fresh data on next request
  globalSongCache.delete(songId);
  
  return updatedSong;
};

/**
 * Updates a song's visibility settings
 * @param songId Song ID
 * @param visibilityDto Visibility settings
 * @param token Authentication token
 * @returns The updated song
 */
export const updateSongVisibility = async (songId: string, visibilityDto: UpdateSongVisibilityDto, token: string): Promise<SongDto> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/${songId}/visibility`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(visibilityDto)
  });

  if (!response.ok) {
    throw new Error(`Failed to update song visibility: ${response.statusText}`);
  }

  const updatedSong = await response.json();
  
  // Invalidate cache to ensure fresh data on next request
  globalSongCache.delete(songId);
  
  return updatedSong;
};

/**
 * Deletes a song
 * @param songId Song ID
 * @param token Authentication token
 */
export const deleteSong = async (songId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete song: ${response.statusText}`);
  }
  
  // Remove from cache since song no longer exists
  globalSongCache.delete(songId);
};

/**
 * Adds a tag to a song
 * @param songId Song ID
 * @param tagName Tag name
 * @param token Authentication token
 * @returns The updated song
 */
export const addTagToSong = async (songId: string, tagName: string, token: string): Promise<SongDto> => {
  const tagDto: SongTagDto = {
    songId,
    tagName
  };

  const response = await fetch(`${API_BASE_URL}/api/songs/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(tagDto)
  });

  if (!response.ok) {
    throw new Error(`Failed to add tag to song: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Removes a tag from a song
 * @param songId Song ID
 * @param tagName Tag name
 * @param token Authentication token
 * @returns The updated song
 */
export const removeTagFromSong = async (songId: string, tagName: string, token: string): Promise<SongDto> => {
  const tagDto: SongTagDto = {
    songId,
    tagName
  };

  const response = await fetch(`${API_BASE_URL}/api/songs/tags`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(tagDto)
  });

  if (!response.ok) {
    throw new Error(`Failed to remove tag from song: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Gets songs shared with a specific choir
 * @param choirId Choir ID
 * @param token Authentication token
 * @returns Array of songs shared with the choir
 */
export const getSongsForChoir = async (choirId: string, token: string): Promise<SongDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/choir/${choirId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get choir songs: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Gets songs created by the current user
 * @param token Authentication token
 * @returns Array of user's songs
 */
export const getMySongs = async (token: string): Promise<SongDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/my`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user songs: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Gets the total count of songs
 * @param token Authentication token
 * @returns Total number of songs
 */
export const getSongsCount = async (token: string): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/api/songs/count`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get songs count: ${response.statusText}`);
  }

  return await response.json();
};
