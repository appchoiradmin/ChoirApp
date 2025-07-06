export interface Playlist {
  id: string;
  title?: string;
  isPublic: boolean;
  choirId: string;
  date: Date;
  sections: PlaylistSection[];
  tags: string[];
  playlistTemplateId?: string;
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
  masterSongId?: string;
  choirSongVersionId?: string;
}

export interface AddSongToPlaylistDto {
  songId: string;
  sectionId: string;
  choirSongVersionId?: string;
}

export interface PlaylistTemplate {
  id: string;
  title: string;
  description?: string;
  choirId: string;
  sections: PlaylistTemplateSection[];
}

export interface PlaylistTemplateSection {
  id: string;
  title: string;
  order: number;
  songs: PlaylistSong[];
}
