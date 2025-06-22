---
trigger: always_on
---

# ChoirApp Frontend Overview

This document provides a summary of the frontend architecture and the features that are currently implemented.

## Architecture

The frontend of ChoirApp is a modern web application built with **React** and **TypeScript**, using **Vite** as the build tool. This combination provides a fast and efficient development experience with strong type-safety.

The project follows a standard structure for a React application:

-   **`main.tsx`**: The entry point of the application, where the root React component is rendered.
-   **[App.tsx](cci:7://file:///c:/ChoirAppV2/packages/frontend/src/App.tsx:0:0-0:0)**: The main application component, which sets up the routing and global layout.
-   **`pages`**: This directory contains the different views or pages of the application, with each file representing a distinct route.
-   **`services`**: This directory contains modules responsible for communicating with the backend API.
-   **`types`**: This directory holds TypeScript type definitions, primarily for Data Transfer Objects (DTOs) used in API communication.
-   **Styling**: CSS files (`App.css`, `index.css`) and the **Bulma** CSS framework are used for styling the application components.

### Testing

The project has a robust testing setup to ensure code quality and maintainability:

-   **Test Runner**: **Vitest** is used as the test runner, providing a fast and modern testing experience that integrates seamlessly with Vite.
-   **Testing Library**: **React Testing Library** is used for writing tests that simulate user interactions and verify component behavior from a user's perspective.
-   **API Mocking**: **Mock Service Worker (MSW)** is used to intercept API requests during tests and provide mock responses. This allows for reliable and isolated testing of components that fetch data.
-   **Test Location**: All test files are located in a dedicated `tests` directory at the root of the frontend package, separate from the application source code.

## Implemented Features

Based on the files in the `pages` directory, the following features are currently implemented in the frontend:

### Authentication

-   **`AuthCallbackPage.tsx`**: Handles the redirect from the Google OAuth flow after a user successfully signs in, likely to exchange the authorization code for a token.

### Onboarding and Setup

-   **`OnboardingPage.tsx`**: A page to guide new users through the initial setup process after they have signed up.
-   **`CreateChoirPage.tsx`**: A dedicated page for users to create a new choir.

### Core Application Views

-   **`HomePage.tsx`**: The main landing page for both authenticated and unauthenticated users.
-   **[DashboardPage.tsx](cci:7://file:///c:/ChoirAppV2/packages/frontend/src/pages/DashboardPage.tsx:0:0-0:0)**: The central dashboard for authenticated users, which will likely display choir information, playlists, and other key data.

### Master Song Management

-   **[MasterSongsListPage.tsx](cci:7://file:///c:/ChoirAppV2/packages/frontend/src/pages/MasterSongsListPage.tsx:0:0-0:0)**: Displays a list of all master songs available in the system.
-   **[MasterSongDetailPage.tsx](cci:7://file:///c:/ChoirAppV2/packages/frontend/src/pages/MasterSongDetailPage.tsx:0:0-0:0)**: Shows the detailed view of a single master song, including its artist, key, tags, and ChordPro content.
-   **[CreateMasterSongPage.tsx](cci:7://file:///c:/ChoirAppV2/packages/frontend/src/pages/CreateMasterSongPage.tsx:0:0-0:0)**: Provides a form for creating a new master song and adding it to the database.