import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.tsx';
import OnboardingPage from './pages/OnboardingPage.tsx';
import CreateChoirPage from './pages/CreateChoirPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import AuthCallbackPage from './pages/AuthCallbackPage.tsx';
import AuthErrorPage from './pages/AuthErrorPage.tsx';
import MasterSongsListPage from './pages/MasterSongsListPage.tsx';
import CreateMasterSongPage from './pages/CreateMasterSongPage.tsx';
import MasterSongDetailPage from './pages/MasterSongDetailPage.tsx';
import MasterSongList from './components/MasterSongList.tsx';
import ChoirSongEditorPage from './pages/ChoirSongEditorPage.tsx';
import ChoirAdminPage from './pages/ChoirAdminPage.tsx';
import PlaylistsPage from './pages/PlaylistsPage.tsx';
import PlaylistDetailPage from './pages/PlaylistDetailPage.tsx';
import CreatePlaylistPage from './pages/CreatePlaylistPage.tsx';
import EditPlaylistPage from './pages/EditPlaylistPage.tsx';
import PlaylistTemplatesPage from './pages/PlaylistTemplatesPage.tsx';
import CreatePlaylistTemplatePage from './pages/CreatePlaylistTemplatePage.tsx';
import PlaylistTemplateDetailPage from './pages/PlaylistTemplateDetailPage.tsx';
import EditPlaylistTemplatePage from './pages/EditPlaylistTemplatePage.tsx';
import ChoirDashboardPage from './pages/ChoirDashboardPage.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/create-choir" element={<CreateChoirPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/error" element={<AuthErrorPage />} />
      <Route path="/master-songs" element={<MasterSongsListPage />} />
      <Route path="/master-songs/create" element={<CreateMasterSongPage />} />
      <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
      <Route path="/choir/:choirId" element={<ChoirDashboardPage />}>
        <Route path="songs" element={<MasterSongList />} />
        <Route path="playlists" element={<PlaylistsPage />} />
        <Route path="admin" element={<ChoirAdminPage />} />
      </Route>
      <Route path="/choir/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
      <Route path="/playlists" element={<PlaylistsPage />} />
      <Route path="/playlists/new" element={<CreatePlaylistPage />} />
      <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
      <Route path="/playlists/:playlistId/edit" element={<EditPlaylistPage />} />
      <Route path="/choir/:choirId/playlist-templates" element={<PlaylistTemplatesPage />} />
      <Route path="/playlist-templates/new" element={<CreatePlaylistTemplatePage />} />
      <Route path="/playlist-templates/:templateId" element={<PlaylistTemplateDetailPage />} />
      <Route path="/playlist-templates/:templateId/edit" element={<EditPlaylistTemplatePage />} />
    </Routes>
  );
}

export default App;
