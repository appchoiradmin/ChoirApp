import { Song } from './Song';
import { User } from './User';
export interface Playlist {
    id: string;
    name: string;
    description?: string;
    songs: Song[];
    createdBy: User;
    createdAt: Date;
}
