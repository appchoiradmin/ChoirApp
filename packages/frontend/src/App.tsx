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
import ChoirSongsListPage from './pages/ChoirSongsListPage.tsx';
import ChoirSongEditorPage from './pages/ChoirSongEditorPage.tsx';

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
      <Route path="/choir-songs" element={<ChoirSongsListPage />} />
      <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
    </Routes>
  );
}

export default App;
