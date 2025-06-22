export interface TagDto {
  tagId: string;
  tagName: string;
}

export interface MasterSongDto {
  id: string;
  title: string;
  artist: string | null;
  lyricsChordPro: string;
  tags: TagDto[];
}

export interface CreateMasterSongDto {
  title: string;
  artist: string | null;
  lyricsChordPro: string;
  tags: string[];
}
