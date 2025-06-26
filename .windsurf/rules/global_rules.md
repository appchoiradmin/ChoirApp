---
trigger: always_on
---

# Global Rules for Windsurf AI

## 1. Code Style and Formatting

* **Language Specific Formatting:** Adhere to standard best practices for each language:
    * **C# (.NET Core):** Follow Microsoft's C# coding conventions. Use PascalCase for class names, method names, and public properties. Use camelCase for local variables and private fields. Use `var` judiciously.
    * **React (JavaScript/TypeScript):** Follow Airbnb JavaScript Style Guide or similar. Use functional components and hooks. Prefer explicit returns.
    * **CSS (Bulma):** Use Bulma's utility classes primarily. When custom CSS is needed, use kebab-case for class names.

* **Indentation:** 4 spaces for C#, 2 spaces for JavaScript/TypeScript, CSS.
* **Brace Style:** K&R style (opening brace on the same line).
* **Line Endings:** LF (Linux/macOS style).
* **Max Line Length:** Aim for 120 characters, but prioritize readability.

## 2. Naming Conventions

* **API Endpoints:** Adhere to RESTful principles: plural nouns for collections (e.g., `/api/users`, `/api/choirs`), nouns for resources. [cite_start]Use kebab-case for path segments (e.g., `/api/choir-members`). 
* [cite_start]**Database Columns:** Use `snake_case` for database column names (e.g., `user_id`, `choir_name`). 
* **C# Entities/DTOs:** Use PascalCase (e.g., `Choir`, `MasterSong`, `UserDto`).
* **React Components:** Use PascalCase (e.g., `ChoirList`, `SongViewer`).
* **Variables/Functions (JS):** Use camelCase.

## 3. Architecture & Design Principles

* **Mobile-First, Responsive Design:** Prioritize mobile UI/UX. [cite_start]Ensure distinct UI layouts for mobile (performance viewing, legibility, minimal distractions) and desktop (administrative, editing). 
* [cite_start]**Performance Optimization:** Emphasize near-instantaneous load times for songs/playlists on mobile.  [cite_start]Be mindful of potential cold starts in serverless functions. 
* **Data Integrity:** Prioritize data integrity. Master songs are immutable. [cite_start]Choir-specific songs are distinct copies.  [cite_start]Ensure unique identifiers for `Choir Name`, `Playlist ID`, `Tag Name`, `Template ID`. 
* **Security:** Implement secure Google authentication. [cite_start]Enforce strict role-based access control (RBAC: General, Choir Admin, Super Admin). 
* [cite_start]**Error Handling:** Implement robust error handling on both frontend (React error boundaries, user-friendly messages) and backend (global exception handling middleware, standardized responses). 
* [cite_start]**Asynchronous Operations:** Use asynchronous programming for all I/O-bound operations, especially data access. 
* **Modularity:** Break down features into smaller, reusable components (React) or services (ASP.NET Core).
* **Convention over Configuration:** Leverage framework conventions where possible to reduce boilerplate.

## 4. AI Interaction Guidelines

* **Be Specific:** Provide clear, concise prompts.
* **Leverage Context:** Use `@` mentions for files, functions, or directories when providing context.
* **Iterate:** Start with a high-level prompt, then refine with follow-up prompts.
* [cite_start]**Verify AI Output:** Always review AI-generated code for correctness, adherence to standards, security vulnerabilities, and technical debt. 
* **Prefer Free Features:** Utilize Windsurf Tab (autocomplete) and inline edits (`Ctrl+I`/`Cmd+I`) for quick suggestions before resorting to generative chat.
* **Use Cheaper Models:** For general questions or simpler code, prefer `Gemini Flash` or `DeepSeek R1` models in Windsurf Cascade.

## 5. Comments & Documentation

* Write clear, concise comments for complex logic, public APIs, and tricky algorithms.
* [cite_start]Ensure API endpoints have clear contracts (request/response JSON schemas).