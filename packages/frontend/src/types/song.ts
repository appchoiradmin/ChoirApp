export interface TagDto {
  tagId: string;
  tagName: string;
}

/**
 * Represents the visibility options for a song
 */
export const SongVisibilityType = {
  Private: 0,
  PublicAll: 1,
  PublicChoirs: 2
} as const;

export type SongVisibilityType = typeof SongVisibilityType[keyof typeof SongVisibilityType];

/**
 * Represents a choir that a song is shared with
 */
export interface ChoirDto {
  choirId: string;
  name: string;
}

/**
 * Unified Song DTO that represents both master songs and versions
 */
export interface SongDto {
  songId: string;
  title: string;
  artist: string | null;
  content: string;
  audioUrl: string | null;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  versionNumber: number;
  baseSongId: string | null;
  visibility: SongVisibilityType;
  visibleToChoirs: ChoirDto[];
  tags: TagDto[];
}

/**
 * DTO for creating a new song
 */
export interface CreateSongDto {
  title: string;
  artist: string | null;
  content: string;
  audioUrl?: string | null;
  visibility: SongVisibilityType;
  visibleToChoirs?: string[]; // Choir IDs
  tags?: string[]; // Tag names
}

/**
 * DTO for creating a new version of an existing song
 */
export interface CreateSongVersionDto {
  content: string;
  audioUrl?: string | null;
  visibility: SongVisibilityType;
  visibleToChoirs?: string[]; // Choir IDs
  tags?: string[]; // Tag names
}

/**
 * DTO for updating a song
 */
export interface UpdateSongDto {
  title?: string;
  artist?: string;
  content?: string;
  audioUrl?: string | null;
  tags?: string[]; // Tag names
}

/**
 * DTO for updating song visibility
 */
export interface UpdateSongVisibilityDto {
  visibility: SongVisibilityType;
  visibleToChoirs?: string[]; // Choir IDs
}

/**
 * DTO for adding or removing a tag from a song
 */
export interface SongTagDto {
  songId: string;
  tagName: string;
}

/**
 * Parameters for searching songs
 */
export interface SongSearchParams {
  searchTerm?: string;
  title?: string;
  artist?: string;
  content?: string;
  tags?: string[];
  userId?: string;
  choirId?: string;
  visibility?: SongVisibilityType;
  skip?: number;
  take?: number;
}
