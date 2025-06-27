# Gemini Code Assist Workspace Configuration

This document outlines the essential conventions, architectural patterns, and core principles for the ChoirApp project. Adhering to these guidelines will ensure consistency and maintainability as the codebase evolves.

## 1. Product Overview

ChoirApp is a digital tool designed for church choirs to manage songs and create playlists for events. It centralizes musical content, allowing members to view synchronized lyrics and chords on mobile devices during performances. The application features a mobile-first design for live use and a responsive desktop interface for administrative and preparation tasks.

**Target Users:**
- **Choir Admin:** Manages the choir, members, and playlists.
- **Choir Member:** Views playlists, contributes to song versions, and uses the app during performances.
- **General User:** Accesses a master database of songs and public playlists.
- **Super Admin:** The product owner with oversight of the entire platform.

## 2. Architecture

The project is a monorepo containing a .NET backend and a React frontend.

### 2.1. Backend Architectural Patterns (.NET)

The backend's design is a robust and modern setup that combines several powerful patterns to achieve a clear separation of concerns, maintainability, and testability.

-   **Clean Architecture & Domain-Driven Design (DDD):** The project is fundamentally structured around Clean Architecture. The `ChoirApp.Domain` project serves as the core of the application, representing the "Domain" layer in DDD. It contains the business entities, aggregates, and domain logic, with no dependencies on external frameworks or infrastructure. This keeps the business rules pure and isolated.

-   **REPR Pattern with FastEndpoints:** The presentation layer (`ChoirApp.Backend`) uses the **REPR (Request-Endpoint-Response)** pattern. Each API endpoint is a self-contained class that handles a single request, processes it, and returns a response. This is implemented using the **FastEndpoints** library, which helps create lean, focused, and high-performance API endpoints, avoiding the "fat controller" problem.

-   **Repository Pattern:** The `ChoirApp.Infrastructure` layer abstracts data access through the Repository Pattern. Interfaces for data operations are defined in the `ChoirApp.Application` layer, and the EF Core implementations reside in `Infrastructure`. This decouples the application logic from the specific data access technology.

-   **Global Exception Handling:** A centralized exception handling middleware is in place to catch and process unhandled exceptions. This ensures that all errors are logged consistently and that standardized, user-friendly error responses are sent back to the client.

-   **Dependency Injection (DI):** DI is used extensively to achieve loose coupling between layers. Service registrations are encapsulated within their respective projects (`Application` and `Infrastructure`) using dedicated extension methods, keeping the main `Program.cs` file clean and reinforcing the separation of concerns.

### 2.2. Frontend Architectural Patterns (React)

The frontend is a modern single-page application (SPA) that leverages established React patterns for a scalable and maintainable codebase.

-   **Component-Based Architecture:** The UI is built as a tree of reusable components, located in the `src/components` directory.
-   **Hooks and Context API:** State management is handled using React Hooks (`useState`, `useEffect`) for local component state and the Context API (`UserContext`) for sharing global state, such as user authentication status, across the application.
-   **Service Layer:** API communication is abstracted into a dedicated service layer (`src/services`). These services (e.g., `choirSongService`, `masterSongService`) encapsulate the logic for making HTTP requests to the backend, making components cleaner and more focused on the UI.
-   **API Mocking (MSW):** For testing, **Mock Service Worker (MSW)** is used to intercept API requests and provide mock responses. This allows for reliable, isolated testing of components that fetch data, without needing a live backend.
-   **Styling:** The **Bulma** CSS framework is used for styling, supplemented by custom CSS files (`App.css`, `index.css`).

## 3. Naming Conventions & Code Style

### 3.1. General
- **Max Line Length:** 120 characters.
- **Brace Style:** K&R style (opening brace on the same line).

### 3.2. C# (.NET)
- **Style:** Follow Microsoft's C# coding conventions.
- **Casing:** `PascalCase` for classes, methods, and public properties. `camelCase` for local variables.
- **Indentation:** 4 spaces.
- **Database Columns:** `snake_case` (e.g., `user_id`, `choir_name`).
- **Entities/DTOs:** `PascalCase` (e.g., `Choir`, `UserDto`).

### 3.3. TypeScript/React
- **Style:** Follow the Airbnb JavaScript Style Guide. Use functional components and hooks.
- **Casing:** `PascalCase` for components (e.g., `ChoirList`). `camelCase` for variables and functions.
- **Indentation:** 2 spaces.

### 3.4. API
- **Endpoints:** Use RESTful principles. Plural nouns for collections (`/api/choirs`) and `kebab-case` for path segments (`/api/choir-members`).

## 4. Core Design Principles

-   **Mobile-First, Responsive Design:** Prioritize the mobile user experience, especially for performance viewing (legibility, minimal distractions). The desktop UI should be optimized for administrative and editing tasks.
-   **Performance:** Strive for near-instantaneous load times for songs and playlists on mobile devices. Be mindful of I/O-bound operations and use asynchronous programming.
-   **Data Integrity:** This is a critical requirement.
    -   Master songs are immutable.
    -   Choir-specific song versions are distinct, private copies.
    -   Enforce uniqueness for key identifiers: `Choir Name`, `Playlist ID`, `Tag Name`.
-   **Security:** Use secure Google authentication and enforce strict Role-Based Access Control (RBAC) for different user levels (General, Choir Admin, Super Admin).
-   **Error Handling:** Implement robust error handling on both the frontend (e.g., React error boundaries) and backend (e.g., global exception handling middleware).

## 5. Data Model (Core Entities)

-   **User:** Authenticated via Google. Can be a General User, Choir Member, or Choir Admin.
-   **Choir:** A uniquely named group of users. Contains playlists, choir-specific songs, and templates.
-   **MasterSong:** The canonical version of a song, stored in ChordPro format.
-   **ChoirSongVersion:** A choir's private, edited version of a `MasterSong`.
-   **Playlist:** A collection of songs organized into sections. Belongs to a choir and can be public or private.
-   **PlaylistTemplate:** A reusable structure for creating new playlists. Belongs to a choir.
-   **Tag:** A unique, lowercase tag that can be applied to songs and playlists.
