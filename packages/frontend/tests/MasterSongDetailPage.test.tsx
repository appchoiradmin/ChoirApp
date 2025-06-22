import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import MasterSongDetailPage from '../src/pages/MasterSongDetailPage';
import { UserProvider } from '../src/contexts/UserContext';
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
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.getByText(/by test artist 1/i)).toBeInTheDocument();
      expect(screen.getByText(/key: c/i)).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('{title: Test Song 1}')).toBeInTheDocument();
    });
  });
});
