# ChoirApp Backend Features and Capabilities

This document provides a comprehensive overview of the ChoirApp backend's features and capabilities based on the current domain model and API endpoints. It serves as a reference for understanding the system's functionality and ensuring alignment with the product requirements.

## Domain Model Overview

The ChoirApp backend follows Clean Architecture principles with a well-defined domain model that represents the core business entities and their relationships:

### Core Entities

1. **User**
   - Represents a user of the application
   - Authentication via Google OAuth
   - Roles: GeneralUser, ChoirAdmin, ChoirMember
   - Onboarding status tracking
   - Can create and manage songs, playlists, and choirs

2. **Choir**
   - Represents a choir group
   - Has an admin user and members
   - Can have multiple playlists and playlist templates
   - Members can be invited and removed

3. **Song**
   - User-centric model where users create and own songs
   - Visibility types: Private, PublicAll, PublicChoirs
   - Can be shared with specific choirs
   - Robust versioning system:
     - Each song has a version number (starting at 1 for originals)
     - Users can create new versions of any song
     - The creator of a version becomes its owner
     - Only the owner of a specific version can edit it
     - Version history is maintained through BaseSongId references
   - Can be tagged for organization and searchability
   - Contains ChordPro content for lyrics and chord display

4. **Playlist**
   - Collection of songs organized into sections
   - Can be associated with a choir or be user-specific
   - Has visibility settings (private or public)
   - Can be tagged for organization
   - Supports structured organization with sections

5. **PlaylistTemplate**
   - Reusable structure for creating playlists
   - Contains sections that can be pre-populated with songs
   - Associated with a specific choir

## Feature Capabilities

### User Management

1. **Authentication**
   - Google OAuth 2.0 integration
   - JWT token-based authentication
   - Role-based authorization

2. **User Profile**
   - View current user information
   - Complete onboarding process
   - Update profile information

### Choir Management

1. **Choir Creation and Administration**
   - Create new choirs
   - Update choir information
   - Delete choirs
   - Assign choir administrators

2. **Membership Management**
   - Invite users to join choirs
   - Accept/reject choir invitations
   - Remove members from choirs
   - Update member roles within choirs
   - View choir invitations (both sent and received)

### Song Management

1. **Song Creation and Editing**
   - Create new songs with title, artist, and ChordPro content
   - Create new versions of existing songs
     - New versions inherit title and artist from the base song
     - The creator of the version becomes its owner
     - Each version has its own visibility settings
     - Version numbers increment automatically (1, 2, 3, etc.)
   - Update song information and content (restricted to the creator of that specific version)
   - Delete songs (restricted to song creator)

2. **Song Visibility and Sharing**
   - Set song visibility (Private, PublicAll, PublicChoirs)
   - Share songs with specific choirs
   - Remove choir access to songs
   - View songs shared with a choir

3. **Song Organization**
   - Add tags to songs
   - Remove tags from songs
   - Search songs by various criteria (title, content, tags)
   - View all available tags

### Playlist Management

1. **Playlist Creation and Editing**
   - Create new playlists (with or without a template)
   - Update playlist information
   - Delete playlists
   - Set playlist visibility (private or public)

2. **Playlist Content Management**
   - Add songs to playlist sections
   - Remove songs from playlists
   - Reorder songs within playlists
   - Organize songs into sections

3. **Playlist Templates**
   - Create reusable playlist templates
   - Update playlist templates
   - Delete playlist templates
   - View templates by choir

## API Endpoints

### Authentication Endpoints
- Complete user onboarding
- Get current user information

### Choir Endpoints
- Create, read, update, delete choirs
- Invite users to choirs
- Accept/reject choir invitations
- Remove choir members
- Update member roles
- Get choir invitations

### Song Endpoints
- Create songs and song versions
- Get songs by ID, user, or choir
- Update songs
- Delete songs
- Manage song visibility and choir access
- Add/remove tags from songs
- Search songs
- Get all tags

### Playlist Endpoints
- Create, read, update, delete playlists
- Add songs to playlists
- Remove songs from playlists
- Move songs within playlists
- Get playlists by choir
- Create, read, update, delete playlist templates
- Get playlist templates by choir

## Alignment with Product Requirements

The current backend implementation aligns well with the core product requirements:

1. **User-Centric Song Model**
   - Songs are owned by users rather than choirs
   - Users control sharing and visibility
   - Supports the collaborative nature of choir song management

2. **Choir Management**
   - Comprehensive choir administration features
   - Role-based access control
   - Invitation system for adding members

3. **Song Management**
   - Support for ChordPro format
   - Versioning capability for song adaptations
   - Tagging for organization
   - Flexible visibility options

4. **Playlist Organization**
   - Section-based organization for structured playlists
   - Support for playlist templates for recurring events
   - Tagging for better organization

5. **Mobile-First Considerations**
   - API design supports efficient data retrieval for mobile views
   - Structured data format (ChordPro) for synchronized display

## Potential Enhancements

While the current implementation covers most requirements, some potential enhancements could include:

1. **Advanced Search Capabilities**
   - Full-text search across song content
   - Filter by multiple criteria simultaneously

2. **Performance Optimizations**
   - Pagination for large result sets
   - Caching frequently accessed data

3. **Analytics and Insights**
   - Usage statistics for songs and playlists
   - Activity tracking for choir engagement

4. **Export/Import Functionality**
   - Export playlists to PDF or other formats
   - Import songs from external sources

## Frontend Refactoring Guide

### Key DTO Structures

#### Song-Related DTOs

```typescript
// Backend SongDto structure
export interface SongDto {
  songId: string;
  title: string;
  artist: string | null;
  content: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  versionNumber: number;
  baseSongId: string | null;
  visibility: SongVisibilityType;
  visibleToChoirs: ChoirDto[];
  tags: TagDto[];
}

// SongVisibilityType enum
export enum SongVisibilityType {
  Private = 0,
  PublicAll = 1,
  PublicChoirs = 2
}
```

#### Playlist-Related DTOs

```typescript
// Backend PlaylistDto structure
export interface PlaylistDto {
  id: string;
  title: string | null;
  isPublic: boolean;
  choirId: string;
  date: string;
  playlistTemplateId: string | null;
  sections: PlaylistSectionDto[];
  tags: string[];
}

export interface PlaylistSectionDto {
  id: string;
  title: string;
  order: number;
  songs: PlaylistSongDto[];
}

export interface PlaylistSongDto {
  id: string;
  order: number;
  songId: string;
  song?: SongDto;
}
```

### Migration Path from Old to New Model

#### Current Frontend Model

The current frontend uses a two-tier model with:

1. `MasterSongDto` - The original song with core content
2. `SongVersionDto` - Choir-specific adaptations of master songs

This is reflected in services like `masterSongService.ts` and `songVersionService.ts`, and the combined approach in `combinedSongService.ts`.

#### Migration Steps

1. **Replace Type Definitions**
   - Replace `MasterSongDto` and `SongVersionDto` with the unified `SongDto`
   - Update all interfaces that reference these types

2. **Consolidate Services**
   - Merge `masterSongService.ts` and `songVersionService.ts` into a single `songService.ts`
   - Update `combinedSongService.ts` to work with the unified model or remove it entirely

3. **Update API Calls**
   - Replace calls to `/master-songs` and `/song-versions` endpoints with calls to `/songs` endpoints
   - Update request and response handling to match the new DTO structures

4. **Update UI Components**
   - Modify components that display song information to use the unified model
   - Update forms for creating/editing songs to match the new structure
   - Ensure version history is properly displayed using `baseSongId` and `versionNumber`

5. **Update Permissions Logic**
   - Modify permission checks to focus on song ownership and visibility rather than choir membership
   - Implement visibility controls based on the `SongVisibilityType` enum

### Example API Calls

#### Creating a Song

```typescript
const createSong = async (song: CreateSongDto, token: string): Promise<SongDto> => {
  const response = await fetch(`${API_BASE_URL}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(song)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create song: ${response.statusText}`);
  }
  
  return await response.json();
};
```

#### Creating a Song Version

```typescript
const createSongVersion = async (
  baseSongId: string,
  content: string,
  visibility: SongVisibilityType,
  token: string
): Promise<SongDto> => {
  const response = await fetch(`${API_BASE_URL}/songs/${baseSongId}/versions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, visibility })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create song version: ${response.statusText}`);
  }
  
  return await response.json();
};
```

### UI Considerations

1. **Song Creation and Editing**
   - Song creation forms should include visibility options (Private, Public, Shared with Choirs)
   - When creating a new version, clearly indicate the base song and version number
   - Only show edit options to the creator of a specific version

2. **Song Listing and Filtering**
   - Provide filtering options based on ownership, visibility, and choir access
   - Group or visually connect related song versions
   - Show version numbers prominently

3. **Choir Context**
   - When viewing songs in a choir context, filter by songs shared with that choir
   - Provide clear indicators of which songs are visible to which choirs
   - Allow choir admins to request songs be shared with their choir

4. **Playlist Integration**
   - Update playlist song selection to work with the unified song model
   - Ensure playlists can include any song version the user has access to
   - Display appropriate version information in playlist views

### Testing Scenarios

1. **Song Creation and Versioning**
   - Create a new song and verify it has version number 1
   - Create a version of an existing song and verify ownership and versioning
   - Attempt to edit a song version created by another user (should be prevented)

2. **Song Visibility**
   - Create a private song and verify it's only visible to the creator
   - Create a public song and verify it's visible to all users
   - Share a song with specific choirs and verify visibility

3. **Playlist Integration**
   - Add songs to a playlist and verify correct display
   - Test playlist sharing with choir members
   - Verify song versions appear correctly in playlists

## Conclusion

The ChoirApp backend provides a robust foundation for the application's requirements. The user-centric song model, comprehensive choir management, and flexible playlist organization align well with the product vision. The clean architecture approach ensures maintainability and extensibility as new features are added.

This refactoring guide provides a clear path for transitioning the frontend from the old choir-centric model to the new user-centric model. By following these steps and considerations, the frontend can be updated to fully leverage the backend capabilities while maintaining a cohesive user experience that emphasizes mobile-first design and provides appropriate desktop interfaces for administrative tasks.
