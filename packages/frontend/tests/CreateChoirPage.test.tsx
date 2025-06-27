import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateChoirPage from '../src/pages/CreateChoirPage';

describe('CreateChoirPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows creating a choir successfully', async () => {
    const user = userEvent.setup();
    render(<CreateChoirPage />);

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'My New Choir');

    const createButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Choir created successfully!');
    }, { timeout: 2000 });
  });

  it('shows an error if choir name is too short', async () => {
    const user = userEvent.setup();
    render(<CreateChoirPage />);

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'My');

    const createButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Choir name must be at least 3 characters long./i)).toBeInTheDocument();
      expect(createButton).not.toHaveClass('is-loading');
    }, { timeout: 2000 });
  });

  it('shows an error if choir name is already taken', async () => {
    const user = userEvent.setup();
    render(<CreateChoirPage />);

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'taken'); // Mocked to be taken

    const createButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/This choir name is already taken./i)).toBeInTheDocument();
      expect(createButton).not.toHaveClass('is-loading');
    }, { timeout: 2000 });
  });
});

