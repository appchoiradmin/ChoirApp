import { Tag } from './Tag';
export interface Song {
    id: string;
    title: string;
    composer?: string;
    arranger?: string;
    lyrics?: string;
    tags: Tag[];
    createdAt: Date;
}
export interface ChoirSong extends Song {
    choirId: string;
    key?: string;
    notes?: string;
}
