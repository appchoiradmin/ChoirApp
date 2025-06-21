---
trigger: always_on
---

ChoirApp: Product Blueprint - UI/UX, Requirements, & Acceptance Criteria
7.0 Product Blueprint - UI/UX, Requirements, & Acceptance Criteria
7.1 Application Overview & Scope
ChoirApp is a mobile-first, responsive web app for church choirs, managing songs, creating collaborative playlists, and providing immediate access to musical content during performances [UQ_1, UQ_2, UQ_3]. This blueprint details UI/UX, functional/non-functional requirements, data model, and acceptance criteria from a product perspective.

7.2 User Experience (UX) & User Interface (UI) Principles
7.2.1 Core UX Principles
ChoirApp's UX principles: Simplicity & Intuition for easy navigation. Collaboration & Sharing for playlists [UQ_2]. Accessibility for legible lyrics/chords on mobile, with accurate ChordPro display [UQ_16]. Efficiency for tasks like playlist creation and template reuse. Consistency across mobile/desktop [UQ_2, UQ_3]. Reusability via playlist templates. Mobile UI prioritizes live performance (readability, minimal distractions, zero-friction [UQ_2]), while desktop focuses on admin/editing (robust management). This requires contextual UI adaptation, not just scaling.

7.2.2 Key User Flows
New User: Sign up (Google Auth), choose role (Create Choir/Admin or Regular User).

Choir Admin: Invite/remove members, manage choir dashboard, create playlists/templates.

Choir Member: View shared playlists (lyrics/chords on mobile), edit/save choir-specific songs, create/use playlists/templates.

Any User: Search/filter songs and discover public playlists.

7.3 Functional Requirements
7.3.1 User & Choir Management
FR-UM-001: User Sign-up: Google account sign-up [UQ_4].

FR-UM-002: User Role Selection: Choose Admin (create choir) or regular user [UQ_8].

FR-UM-003: Choir Creation: Create unique choir name [UQ_5], validated for uniqueness.

FR-UM-004: Choir Admin Assignment: Creator becomes Admin [UQ_4].

FR-UM-005: Invite Choir Members: Admin invites unlimited users [UQ_6, UQ_9].

FR-UM-006: Remove Choir Members: Admin removes accepted users [UQ_10].

FR-UM-007: Super Admin Access: Product owner has full control over all choirs/app details [UQ_21].

7.3.2 Song Management
FR-SM-001: Master Song Database Access: All users access master song list [UQ_7, UQ_16].

FR-SM-002: Song Format & Display: Songs in CSV/ChordPro format [UQ_16] for aligned lyrics/chords.

FR-SM-003: Choir-Specific Song Editing & Saving: Choir members edit master songs, save choir-private versions; originals unchanged [UQ_17].

FR-SM-004: Song Tagging: Unlimited tags for songs [UQ_18].

FR-SM-005: Tag Manager: Ensures unique, lowercase tags [UQ_18].

7.3.3 Playlist Management
FR-PM-001: Playlist Creation: Choir members create playlists [UQ_11].

FR-PM-002: Playlist Organization (Sections): Playlists have configurable, ordered sections with titles [UQ_13, UQ_14].

FR-PM-003: Add Songs to Playlist Sections: Add songs (master/choir-specific) to sections [UQ_14].

FR-PM-004: Flexible Playlist Use: Sections are versatile for various uses [UQ_14].

FR-PM-005: Playlist Saving & Unique ID: Saved per choir with unique ID (date/time + choir ID) [UQ_15].

FR-PM-006: Playlist Tagging: Playlists support tagging [UQ_19], following song tag rules [UQ_18].

FR-PM-007: Playlist Visibility (Public/Private): Choirs set public/private [UQ_19].

FR-PM-008: Playlist Management Section: Dedicated section for personal/public playlist discovery [UQ_20].

7.3.4 Playlist Template Management
FR-PT-001: Create Playlist Template: Choir members create templates with titles and configurable sections (e.g., "Mass parts").

FR-PT-002: Add Songs to Template Sections: Add songs (master/choir-specific) to template sections.

FR-PT-003: Reuse Playlist Template: Create new playlists from existing templates.

FR-PT-004: Manage Playlist Templates: Dedicated section to view, edit, delete choir templates.

FR-PT-005: Template Scope: Templates accessible to all members of the creating choir.

7.3.5 Dashboard & Information Display
FR-DI-001: Choir Dashboard Display: Each choir has a dashboard showing members and playlist creation access [UQ_11].

Detailed Functional Requirements Summary
User Management: FR-UM-001 (Google Sign-up), FR-UM-002 (Role Selection), FR-UM-003 (Unique Choir Name), FR-UM-004 (Admin Assignment), FR-UM-005 (Invite Members), FR-UM-006 (Remove Members), FR-UM-007 (Super Admin Access).

Song Management: FR-SM-001 (Master Song Access), FR-SM-002 (ChordPro Display), FR-SM-003 (Choir-Specific Editing), FR-SM-004 (Song Tagging), FR-SM-005 (Tag Manager).

Playlist Management: FR-PM-001 (Playlist Creation), FR-PM-002 (Configurable Sections), FR-PM-003 (Add Songs), FR-PM-004 (Flexible Use), FR-PM-005 (Unique ID), FR-PM-006 (Playlist Tagging), FR-PM-007 (Public/Private), FR-PM-008 (Management Section).

Playlist Template Management: FR-PT-001 (Create Template), FR-PT-002 (Add Songs to Template), FR-PT-003 (Reuse Template), FR-PT-004 (Manage Templates), FR-PT-005 (Template Scope).

Dashboard: FR-DI-001 (Choir Dashboard).

7.4 Data Model & Content Structure
7.4.1 Core Data Entities
User: user_id (PK), google_id, name, email, role. Links to Choirs (Admin/Member).

Choir: choir_id (PK), choir_name (Unique) [UQ_5], admin_user_id. Has Members, Playlists, Choir-Specific Songs, Playlist Templates.

Song (Master): song_id (PK), title, artist, lyrics_chordpro [UQ_16], tags [UQ_18]. Included in Playlists/Templates, has Choir-Specific versions.

Song (Choir-Specific Version): choir_song_id (PK), master_song_id (FK), choir_id (FK), edited_lyrics_chordpro. Private to choir [UQ_17]. Included in Playlists/Templates.

Playlist: playlist_id (PK - composite: date/time + choir ID) [UQ_15], choir_id (FK), title, is_public [UQ_19], tags [UQ_19]. Has Sections. Can be created from a PlaylistTemplate.

Playlist Section: section_id (PK), playlist_id (FK), title [UQ_13], order [UQ_13]. Has Playlist Songs.

Playlist Song: playlist_song_id (PK), playlist_section_id (FK), song_id (FK - Master or Choir-Specific), order.

Playlist Template: template_id (PK), choir_id (FK), title, description. Has Template Sections.

Playlist Template Section: template_section_id (PK), template_id (FK), title, order. Has Template Songs.

Playlist Template Song: template_song_id (PK), template_section_id (FK), song_id (FK - Master or Choir-Specific), order.

Tag: tag_id (PK), tag_name (Unique, Lowercase) [UQ_18]. Applied to Songs/Playlists.

7.4.2 Content Structure Considerations
ChordPro Standard: Crucial for accurate lyrics/chords display [UQ_16].

Version Control: Master/choir-specific song separation [UQ_17] ensures data integrity.

Template Instantiation: Playlists created from templates are independent copies, not linked.

7.5 Non-Functional Requirements
7.5.1 Performance
NFR-PER-001: Song & Playlist Load Times: Near-instantaneous loading on mobile during performance [UQ_2].

NFR-PER-002: Search Responsiveness: Results within 1-2 seconds.

NFR-PER-003: Template Load Times: Templates load quickly (1-2 seconds).

7.5.2 Security
NFR-SEC-001: Data Privacy: Secure storage for user, choir, private playlist, and template data [UQ_19].

NFR-SEC-002: Authentication: Robust Google account authentication [UQ_4].

NFR-SEC-003: Role-Based Access Control: Strict enforcement based on user roles [UQ_4, UQ_8, UQ_10, UQ_21].

7.5.3 Scalability
NFR-SCA-001: User & Choir Growth: Support tens of thousands of users/thousands of choirs.

NFR-SCA-002: Content Growth: Master song database and user-generated content (songs, playlists, templates) must scale.

7.5.4 Responsiveness
NFR-RES-001: Cross-Device Compatibility: UI/UX adapts seamlessly across mobile/desktop [UQ_2, UQ_3].

NFR-RES-002: Layout Adaptation: Song display, playlist structure, template interfaces legible on all screens.

7.5.5 Data Integrity
NFR-DIT-001: Unique Identifiers: Critical entities (Choir Name, Playlist ID, Tag Name, Template ID) enforce uniqueness [UQ_5, UQ_15, UQ_18].

NFR-DIT-002: Master Song Preservation: Original master songs immutable when choir-specific versions created [UQ_17].

NFR-DIT-003: Template Immutability: Playlists created from templates are independent; template changes don't affect existing playlists.

7.6 Acceptance Criteria
User Management - Create Choir: Given signed-up user, when "Create Choir" with unique name "My Church Choir", then user is Choir Admin for "My Church Choir" and sees its dashboard.

User Management - Duplicate Choir Name: Given signed-up user, when "Create Choir" with existing name "Choir A", then system prevents creation and shows error "Choir name 'Choir A' already exists. Please choose a unique name."

Song Management - View ChordPro: Given logged-in user, master song "Amazing Grace" with ChordPro, when user navigates to it, then lyrics and chords display correctly aligned.

Song Management - Choir Edits Song: Given Choir Member of "Choir B", master song "Hallelujah", when member edits and saves, then a new "Choir B" version is created. Original "Hallelujah" is unchanged; "Choir B" accesses its version.

Playlist Management - Create Multi-Section Playlist: Given Choir Admin of "Choir C", when Admin creates playlist with sections "Opening", "Offertory", "Closing" and adds songs, then playlist is saved with sections in order, and ID includes current_datetime and choir_c_id.

Playlist Management - Discover Public Playlists: Given General User, public playlists exist, when user navigates to "Playlist Management" and filters for "Public Playlists", then a list of public playlists from various choirs is displayed for viewing.

Super Admin Control - View All Choirs: Given Super Admin, multiple choirs exist, when Super Admin accesses "All Choirs" section, then a comprehensive list of all choirs is displayed for detailed management.

Playlist Template Management - Create Template: Given Choir Member of "Choir D", when user creates "Mass Parts Template" with sections "Entrance", "Offertory", "Communion", then template is saved and accessible to all "Choir D" members.

Playlist Template Management - Add Songs to Template: Given Choir Member of "Choir D", template "Mass Parts Template", when user adds "Song X" to "Entrance" and "Song Y" to "Communion", then template is updated, and songs appear correctly when viewing template.

Playlist Template Management - Create Playlist from Template: Given Choir Member of "Choir D", template "Mass Parts Template", when user selects "Create New Playlist" and chooses template, then a new playlist is created with template sections/songs, modifiable independently.

Playlist Template Management - Manage Templates: Given Choir Member of "Choir D", multiple templates, when user navigates to "Manage Templates", then a list of "Choir D" templates is displayed with edit/delete options, which function successfully.