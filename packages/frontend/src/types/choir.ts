import { UserRole } from '../constants/roles';

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

// Legacy ChoirSongVersionDto interfaces have been removed
// These have been replaced by SongVersionDto interfaces in types/song.ts
