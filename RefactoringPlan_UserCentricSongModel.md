# Refactoring Plan: User-Centric Song Model

## 1. Overview

This document outlines the strategic plan to refactor the ChoirApp's song management system. We will transition from a dual-entity model (`MasterSong` and `SongVersion`) to a unified, user-centric `Song` model. This change simplifies the architecture, aligns with the product vision of user ownership, and enhances the user experience by providing a single, consolidated view of all songs.

## 2. Core Principles

The new model is built on three core principles:

*   **Unified Song Entity**: Every song, whether it's an original composition or an adaptation, is treated as a `Song`. The concept of a separate "master song" is removed.
*   **User-Centric Ownership**: Each `Song` version has a single, explicit creator. Only the creator of a specific version can edit or delete it. This empowers users and clarifies content ownership.
*   **Granular Visibility**: Each `Song` version has its own visibility setting (`Private`, `PublicAll`, `PublicChoirs`), allowing creators to control who can see and use their versions.

## 3. Backend Refactoring Plan

### 3.1. Database Schema

**Action**: Drop the existing database and recreate it with a new schema. No data migration will be performed.

*   **Drop Tables**: `MasterSongs`, `SongVersions`, `VersionVisibilities`.
*   **Create Table**: A new `Songs` table will be the single source of truth for all song data.
*   **Update Tables**: `SongVisibilities` and `SongTags` will be updated to reference the new `Songs` table.

### 3.2. Domain Layer (`ChoirApp.Domain`)

**Action**: Define the new `Song` entity.

```csharp
// In ChoirApp.Domain/Entities/Song.cs
public class Song
{
    public Guid SongId { get; set; }
    public string Title { get; set; }
    public string? Artist { get; set; }
    public string Content { get; set; } // ChordPro content
    public Guid CreatorId { get; set; }
    public User Creator { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int VersionNumber { get; set; } // Version 1 is the first, subsequent numbers are derivatives.
    public Guid? BaseSongId { get; set; } // Self-referencing FK to the original song (null if VersionNumber is 1).
    public Song? BaseSong { get; set; }
    public SongVisibilityType Visibility { get; set; }

    public ICollection<Song> Derivatives { get; set; } = new List<Song>();
    public ICollection<SongVisibility> Visibilities { get; set; } = new List<SongVisibility>();
    public ICollection<SongTag> Tags { get; set; } = new List<SongTag>();
}
```

### 3.3. Application & Infrastructure Layers

**Action**: Consolidate services to work with the `Song` entity.

*   **Create `ISongService` / `SongService`**: This new service will replace `MasterSongService` and `ChoirSongService`. It will handle all business logic:
    *   Creating a new song (version 1).
    *   Creating a new version of an existing song (incrementing `VersionNumber`).
    *   Fetching songs based on user and choir visibility.
    *   Updating a song (only allowed for the `CreatorId`).
    *   Managing song visibility.

### 3.4. API Layer (`ChoirApp.Backend`)

**Action**: Create a new set of unified, RESTful endpoints for songs.

*   `POST /api/songs`: Create a new song (version 1).
*   `POST /api/songs/{baseSongId}/versions`: Create a new version of an existing song.
*   `GET /api/songs`: Get all songs visible to the current user.
*   `GET /api/choirs/{choirId}/songs`: Get all songs visible to a specific choir.
*   `GET /api/songs/{songId}`: Get a single song by its ID.
*   `PUT /api/songs/{songId}`: Update a song (authorization required).
*   `DELETE /api/songs/{songId}`: Delete a song (authorization required).

## 4. Frontend Refactoring Plan

### 4.1. UI/UX Changes

**Action**: Streamline the user interface to reflect the unified model.

*   **Remove "Song Versions" Tab**: In the `ChoirDashboardPage`, the separate tab for song versions will be removed.
*   **Consolidate into "Songs" Tab**: The existing "Songs" tab will now display a unified list of all songs (originals and versions) visible to the choir.
*   **Update Song List UI**: The song list items will be updated to display version information, creator details, and visibility status where relevant.

### 4.2. Service Layer

**Action**: Refactor frontend services to communicate with the new backend API.

*   **Create `songService.ts`**: A new service will be created to interact with the `/api/songs` endpoints.
*   **Deprecate Old Services**: `masterSongService.ts` and `songVersionService.ts` will be removed.

### 4.3. Component & State Management

**Action**: Update components to use the new service and display the unified data.

*   **Refactor `MasterSongList.tsx`**: This component will be refactored (or replaced by a new `SongList.tsx`) to fetch and display the combined list of songs from the new service.
*   **Update State**: React hooks and context will be updated to handle the unified `Song` data structure.

## 5. Implementation Notes

*   **No Testing**: As per the directive, no unit or integration tests will be created or modified during this refactoring phase.
*   **Fresh Database**: The process will start by dropping the entire database, ensuring a clean slate for the new schema.
*   **Mobile-First**: All frontend changes will adhere to the mobile-first design philosophy.
