import { SongDto } from './song';

export interface Playlist {
  id: string;
  title?: string;
  isPublic: boolean;
  choirId: string;
  date: string | Date;
  sections: PlaylistSection[];
  tags: string[];
  playlistTemplateId?: string;
  template?: PlaylistTemplate | null; // Optional, for context logic
}

export interface PlaylistSection {
  id: string;
  title: string;
  order: number;
  songs: PlaylistSong[];
}

export interface PlaylistSong {
  id: string;
  order: number;
  songId: string;
  song?: SongDto; // Using the unified SongDto
}

export interface AddSongToPlaylistDto {
  songId: string;
  sectionId: string;
}

export interface PlaylistTemplate {
  id: string;
  title: string;
  description?: string;
  choirId: string;
  isDefault: boolean;
  sections: PlaylistTemplateSection[];
}

export interface PlaylistTemplateSection {
  id: string;
  title: string;
  order: number;
  songs: PlaylistSong[];
}
