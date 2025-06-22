import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import MasterSongDetailPage from '../src/pages/MasterSongDetailPage';
import { UserProvider } from '../src/contexts/UserContext.tsx';
import { server } from '../src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MasterSongDetailPage', () => {
  it('renders song details after fetching', async () => {
    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/1']}>
          <Routes>
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Song 1', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Artist: Test Artist 1/i)).toBeInTheDocument();
      
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Test Song 1', level: 2 })).toBeInTheDocument();
    });
  });
});
