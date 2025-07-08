import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UserProvider } from './contexts/UserContext.tsx';
import { PlaylistProvider } from './context/PlaylistContext.tsx';
import { useUser } from './hooks/useUser';

function RootProviders({ children }: { children: React.ReactNode }) {
  const { user, token } = useUser();
  // Pick first choir as default, fallback to null
  const choirId = user?.choirs?.[0]?.id ?? null;
  // Use today's date as default
  const date = new Date();
  return (
    <PlaylistProvider choirId={choirId} date={date} token={token}>
      {children}
    </PlaylistProvider>
  );
}

import 'bulma/css/bulma.min.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <RootProviders>
          <App />
        </RootProviders>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
