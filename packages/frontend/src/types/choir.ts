import type { MasterSongDto } from './song';

export interface Choir {
  id: string;
  name: string;
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
