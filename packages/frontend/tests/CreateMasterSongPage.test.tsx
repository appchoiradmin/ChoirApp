import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import CreateMasterSongPage from '../src/pages/CreateMasterSongPage';
import MasterSongDetailPage from '../src/pages/MasterSongDetailPage';
import { UserProvider } from '../src/contexts/UserContext.tsx';
import { server } from '../src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CreateMasterSongPage', () => {
  it('creates a new song and redirects on submit', async () => {
    const user = userEvent.setup();
    render(
      <UserProvider>
        <MemoryRouter initialEntries={['/master-songs/create']}>
          <Routes>
            <Route
              path="/master-songs/create"
              element={<CreateMasterSongPage />}
            />
            <Route path="/master-songs/:id" element={<MasterSongDetailPage />} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    );

    await user.type(screen.getByLabelText(/title/i), 'New Awesome Song');
    await user.type(screen.getByLabelText(/artist/i), 'The Testers');

    await user.type(screen.getByLabelText(/tags/i), 'worship, fast');
    await user.type(screen.getByLabelText(/content/i), '{{c:New song content}');

    await user.click(screen.getByRole('button', { name: /create song/i }));

    await waitFor(() => {
      expect(screen.getByText('New Awesome Song')).toBeInTheDocument();
    });
  });
});
