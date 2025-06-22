export interface TagDto {
  tagId: string;
  tagName: string;
}

export interface MasterSongDto {
  id: string;
  title: string;
  artist: string;
  key: string;
  content: string;
  tags: TagDto[];
}

export interface CreateMasterSongDto {
  title: string;
  artist: string;
  key: string;
  content: string;
  tags: string[];
}
