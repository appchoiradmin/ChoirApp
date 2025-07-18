import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { PlaylistProvider } from './context/PlaylistContext';
import { useUser } from './hooks/useUser';
import HomePage from './pages/HomePage.tsx';
import OnboardingPage from './pages/OnboardingPage.tsx';
import CreateChoirPage from './pages/CreateChoirPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import AuthCallbackPage from './pages/AuthCallbackPage.tsx';
import AuthErrorPage from './pages/AuthErrorPage.tsx';
import SongsListPage from './pages/SongsListPage.tsx';
import SongVersionEditorPage from './pages/SongVersionEditorPage.tsx';
import SongVersionsListPage from './pages/SongVersionsListPage.tsx';
import ChoirAdminPage from './pages/ChoirAdminPage.tsx';
import SongDetailPage from './pages/SongDetailPage.tsx';
import ChoirPlaylistsTab from './pages/ChoirPlaylistsTab';
import PlaylistDetailPage from './pages/PlaylistDetailPage.tsx';
import CreatePlaylistPage from './pages/CreatePlaylistPage.tsx';
import EditPlaylistPage from './pages/EditPlaylistPage.tsx';
import PlaylistTemplatesPage from './pages/PlaylistTemplatesPage.tsx';
import CreatePlaylistTemplatePage from './pages/CreatePlaylistTemplatePage.tsx';
import PlaylistTemplateDetailPage from './pages/PlaylistTemplateDetailPage.tsx';
import EditPlaylistTemplatePage from './pages/EditPlaylistTemplatePage.tsx';
import ChoirDashboardPage from './pages/ChoirDashboardPage.tsx';

const PUBLIC_ROUTES = ['/', '/auth/callback', '/auth/error'];

function App() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

    if (!user && !isPublicRoute) {
      // If user is not logged in and on a private route, redirect to home
      navigate('/');
    } else if (user && location.pathname === '/') {
      // If user is logged in and on the homepage, redirect to dashboard
      navigate('/dashboard');
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/create-choir" element={<CreateChoirPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/error" element={<AuthErrorPage />} />
      <Route path="/songs" element={
        <PlaylistProvider choirId={null} date={null} token={user?.token || null}>
          <SongsListPage />
        </PlaylistProvider>
      } />
      <Route path="/choir/:choirId" element={<ChoirDashboardPage />}>
        <Route path="songs" element={<SongsListPage />} />
        <Route path="song-versions" element={<SongVersionsListPage />} />
        <Route path="playlists" element={<ChoirPlaylistsTab />} />
        <Route path="admin" element={<ChoirAdminPage />} />
        <Route path="playlists/:playlistId/edit" element={<EditPlaylistPage />} />
      </Route>
      <Route path="/choir/:choirId/song-versions/:songId/edit" element={<SongVersionEditorPage />} />
      <Route path="/playlists" element={<ChoirPlaylistsTab />} />
      <Route path="/playlists/new" element={<CreatePlaylistPage />} />
      <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
      <Route path="/playlists/:playlistId/edit" element={<EditPlaylistPage />} />
      <Route path="/songs/create" element={<SongDetailPage />} />
      <Route path="/songs/:songId" element={<SongDetailPage />} />
      <Route path="/choir/:choirId/playlist-templates" element={<PlaylistTemplatesPage />} />
      <Route path="/playlist-templates/new" element={<CreatePlaylistTemplatePage />} />
      <Route path="/playlist-templates/:templateId" element={<PlaylistTemplateDetailPage />} />
      <Route path="/playlist-templates/:templateId/edit" element={<EditPlaylistTemplatePage />} />
    </Routes>
  );
}

export default App;
