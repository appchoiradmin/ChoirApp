import { UserRole } from '../constants/roles';
import type { User } from './user';
import type { MasterSongDto } from './song';

export type ChoirRole = typeof UserRole.ChoirAdmin | typeof UserRole.ChoirMember;

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
