import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import DashboardPage from '../src/pages/DashboardPage';

describe('DashboardPage', () => {
  it('renders the dashboard content and navigation links', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Choir Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to your choir's central hub!/i)).toBeInTheDocument();

    const masterSongsLink = screen.getByRole('link', { name: /Manage Master Songs/i });
    expect(masterSongsLink).toBeInTheDocument();
    expect(masterSongsLink).toHaveAttribute('href', '/master-songs');

    const choirSongsLink = screen.getByRole('link', { name: /Manage Choir Songs/i });
    expect(choirSongsLink).toBeInTheDocument();
    expect(choirSongsLink).toHaveAttribute('href', '/choir-songs');
  });
});
