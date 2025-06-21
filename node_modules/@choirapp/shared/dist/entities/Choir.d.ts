import { User } from './User';
export interface Choir {
    id: string;
    name: string;
    description?: string;
    members: User[];
    createdAt: Date;
}
