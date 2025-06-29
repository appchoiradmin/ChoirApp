import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from '../src/contexts/UserContext.tsx';
import CreateChoirPage from '../src/pages/CreateChoirPage';
import '../src/setupTests';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

// Mock services
vi.mock('../src/services/choirService', () => ({
  createChoir: vi.fn(),
}));
vi.mock('../src/hooks/useUser', () => ({
  useUser: vi.fn(),
}));

// Create a test router for the create choir page
const createTestRouter = () => {
  return createMemoryRouter(
    [
      { path: '/create-choir', element: <CreateChoirPage /> },
    ],
    {
      initialEntries: ['/create-choir'],
      initialIndex: 0,
    }
  );
};

const TestWrapper: React.FC = () => {
  const router = createTestRouter();
  return (
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
};

describe('CreateChoirPage', () => {
  const mockRefetchUser = vi.fn();
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'SuperAdmin' as const,
    choirs: [],
    hasCompletedOnboarding: true,
    isNewUser: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.setItem('authToken', 'test-token');
    const { useUser } = await import('../src/hooks/useUser');
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      loading: false,
      token: 'test-token',
      refetchUser: mockRefetchUser,
    });
    const choirService = await import('../src/services/choirService');
    vi.mocked(choirService.createChoir).mockReset();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('allows creating a choir successfully', async () => {
    const choirService = await import('../src/services/choirService');
    vi.mocked(choirService.createChoir).mockResolvedValue({ id: '1', name: 'My New Choir', role: 'Admin' });
    const user = userEvent.setup();
    render(<TestWrapper />);

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'My New Choir');

    const createButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(choirService.createChoir).toHaveBeenCalledWith('My New Choir', 'test-token');
      expect(mockRefetchUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows an error if choir name is too short', async () => {
    const choirService = await import('../src/services/choirService');
    const error = new Error('Choir name must be at least 3 characters long.');
    (error as any).response = { data: { message: 'Choir name must be at least 3 characters long' }, status: 400 };
    vi.mocked(choirService.createChoir).mockRejectedValue(error);
    const user = userEvent.setup();
    render(<TestWrapper />);

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'My');

    const createButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(choirService.createChoir).toHaveBeenCalledWith('My', 'test-token');
      expect(screen.getByText(/Choir name must be at least 3 characters long/i)).toBeInTheDocument();
    });
  });

  it('shows an error if choir name is already taken', async () => {
    const choirService = await import('../src/services/choirService');
    const error = new Error('A choir with this name already exists');
    (error as any).response = { data: { message: 'A choir with this name already exists' }, status: 409 };
    vi.mocked(choirService.createChoir).mockRejectedValue(error);
    const user = userEvent.setup();
    render(<TestWrapper />);

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'taken');

    const createButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(choirService.createChoir).toHaveBeenCalledWith('taken', 'test-token');
      expect(screen.getByText(/A choir with this name already exists/i)).toBeInTheDocument();
    });
  });
});
