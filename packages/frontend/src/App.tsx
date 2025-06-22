import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.tsx';
import OnboardingPage from './pages/OnboardingPage.tsx';
import CreateChoirPage from './pages/CreateChoirPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import AuthCallbackPage from './pages/AuthCallbackPage.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/create-choir" element={<CreateChoirPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
    </Routes>
  );
}

export default App;
