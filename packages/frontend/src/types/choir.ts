import type { MasterSongDto } from './song';

export type ChoirRole = 'Admin' | 'Member';

export interface Choir {
  id: string;
  name: string;
  role: ChoirRole;
}

export interface ChoirMember {
  id: string;
  name: string;
  email: string;
  role: ChoirRole;
}

export interface ChoirDetails extends Choir {
  members: ChoirMember[];
}

export interface ChoirSongVersionDto {
  choirSongId: string;
  masterSongId: string;
  choirId: string;
  editedLyricsChordPro: string;
  lastEditedDate: string;
  editorUserId: string;
  masterSong?: MasterSongDto;
}

export interface CreateChoirSongVersionDto {
  masterSongId: string;
  editedLyricsChordPro: string;
}

export interface UpdateChoirSongVersionDto {
  editedLyricsChordPro: string;
}
