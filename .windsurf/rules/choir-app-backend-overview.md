---
trigger: always_on
---

# ChoirApp Backend Overview

This document provides a summary of the backend architecture and the features that are currently implemented.

## Architecture

The backend of ChoirApp is a .NET solution that follows the principles of **Clean Architecture**, which promotes a clear separation of concerns and results in a more maintainable, scalable, and testable application.

-   **`ChoirApp.Domain`**: This is the core of the application, containing the main business entities: `User`, `Choir`, `ChoirInvitation`, `MasterSong`, `ChoirSongVersion`, `Playlist`, and `PlaylistTemplate`. It defines the fundamental business objects and their relationships, and it is completely independent of any technology-specific implementations.

-   **`ChoirApp.Application`**: This layer orchestrates the domain logic. It defines contracts (interfaces) for services like `IUserService`, `IChoirService`, and `IInvitationService`, and uses Data Transfer Objects (DTOs) for communication between the API layer and the core business logic.

-   **`ChoirApp.Infrastructure`**: This layer handles external concerns. It includes data persistence using Entity Framework Core (as indicated by the `Migrations` and `Persistence` directories) and provides implementations for the services defined in the Application layer.

-   **`ChoirApp.Backend`**: This is the presentation layer, which exposes the application's functionality as an API. It uses an endpoint-based approach, following the REPR (Request-Endpoint-Response) pattern, to handle HTTP requests. This keeps the controllers lean and focused on a single responsibility.

## Implemented Features

Based on the current API endpoints, the following features are implemented in the backend:

### Authentication

-   **Sign in with Google** (`SignInGoogleEndpoint`): Initiates the Google OAuth 2.0 authentication flow.
-   **Handle Google OAuth Callback** (`GoogleCallbackEndpoint`): Handles the callback from Google after the user has authenticated.

### Choir Management

-   **Create a Choir** (`CreateChoirEndpoint`): Allows an authenticated user to create a new choir.
-   **Get Choir Details** (`GetChoirEndpoint`): Retrieves the details of a specific choir.
-   **Update a Choir** (`UpdateChoirEndpoint`): Updates the information of an existing choir.
-   **Delete a Choir** (`DeleteChoirEndpoint`): Deletes a choir.
-   **Invite a User to a Choir** (`InviteUserEndpoint`): Allows a choir admin to send an invitation to a user.
-   **Accept a Choir Invitation** (`AcceptInvitationEndpoint`): Allows a user to accept an invitation to join a choir.
-   **Reject a Choir Invitation** (`RejectInvitationEndpoint`): Allows a user to reject an invitation to join a choir.
-   **Remove a Member from a Choir** (`RemoveMemberEndpoint`): Allows a choir admin to remove a member from the choir.