import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import MasterSongsListPage from '../src/pages/MasterSongsListPage';
import { server } from '../src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MasterSongsListPage', () => {
  it('renders a list of master songs', async () => {
    render(
      <BrowserRouter>
        <MasterSongsListPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.getByText('Test Song 2')).toBeInTheDocument();
    });

    expect(screen.getByText(/create new song/i)).toBeInTheDocument();
  });
});
