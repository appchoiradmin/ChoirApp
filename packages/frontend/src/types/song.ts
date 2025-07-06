export interface TagDto {
  tagId: string;
  tagName: string;
}

export interface MasterSongDto {
  songId: string;
  title: string;
  artist: string | null;
  lyricsChordPro: string;
  tags: TagDto[];
  choirSongVersionId?: string;
}

export interface CreateMasterSongDto {
  title: string;
  artist: string | null;
  lyricsChordPro: string;
  tags: string[];
}
