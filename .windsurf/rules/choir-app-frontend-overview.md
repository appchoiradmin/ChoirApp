---
trigger: always_on
---

# ChoirApp Frontend Overview

This document provides a summary of the frontend architecture and the features that are currently implemented.

## Architecture

The frontend of ChoirApp is a modern web application built with **React** and **TypeScript**, using **Vite** as the build tool. This combination provides a fast and efficient development experience with strong type-safety.

The project follows a standard structure for a React application:

-   **`main.tsx`**: The entry point of the application, where the root React component is rendered.
-   **`App.tsx`**: The main application component, which sets up the routing and global layout.
-   **`pages`**: This directory contains the different views or pages of the application, with each file representing a distinct route.
-   **Styling**: CSS files (`App.css`, `index.css`) are used for styling the application components.

## Implemented Features

Based on the files in the `pages` directory, the following features are currently implemented in the frontend:

### Authentication

-   **`AuthCallbackPage.tsx`**: Handles the redirect from the Google OAuth flow after a user successfully signs in, likely to exchange the authorization code for a token.

### Onboarding and Setup

-   **`OnboardingPage.tsx`**: A page to guide new users through the initial setup process after they have signed up.
-   **`CreateChoirPage.tsx`**: A dedicated page for users to create a new choir.

### Core Application Views

-   **`HomePage.tsx`**: The main landing page for both authenticated and unauthenticated users.
-   **`DashboardPage.tsx`**: The central dashboard for authenticated users, which will likely display choir information, playlists, and other key data.
