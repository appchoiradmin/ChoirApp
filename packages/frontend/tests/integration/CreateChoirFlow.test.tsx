import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import HomePage from '../../src/pages/HomePage.tsx';
import OnboardingPage from '../../src/pages/OnboardingPage.tsx';
import CreateChoirPage from '../../src/pages/CreateChoirPage.tsx';
import DashboardPage from '../../src/pages/DashboardPage.tsx';
import '../../src/setupTests.ts';


// Mock services
vi.mock('../../src/services/userService', () => ({
  getCurrentUser: vi.fn(),
  completeOnboarding: vi.fn(),
}));

vi.mock('../../src/services/choirService', () => ({
  createChoir: vi.fn(),
}));

// Create a test router with memory router for the create choir flow
const createTestRouter = () => {
  return createMemoryRouter(
    [
      { path: '/', element: <HomePage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/create-choir', element: <CreateChoirPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
    ],
    {
      initialEntries: ['/'], // Start at the root
      initialIndex: 0,
    }
  );
};

// Create a test wrapper that creates a fresh router for each test
const TestWrapper: React.FC = () => {
  const router = createTestRouter();
  return (
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
};

describe('Create Choir Flow - Integration Test', () => {
  beforeEach(async () => {
    localStorage.setItem('authToken', 'test-token');

    const userService = await import('../../src/services/userService');
    vi.mocked(userService.getCurrentUser).mockResolvedValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'General',
      choirs: [],
      hasCompletedOnboarding: false,
      isNewUser: true,
    });

    const choirService = await import('../../src/services/choirService');
    vi.mocked(choirService.createChoir).mockImplementation(async (name, token) => {
      if (name === 'taken') {
        const error = new Error('A choir with this name already exists');
        (error as any).response = { data: { message: 'A choir with this name already exists' }, status: 409 };
        throw error;
      }
      if (name.length < 3) {
        const error = new Error('Choir name must be at least 3 characters long');
        (error as any).response = { data: { message: 'Choir name must be at least 3 characters long' }, status: 400 };
        throw error;
      }
      return Promise.resolve({ id: 'choir-123', name, role: 'Admin' });
    });

    const { completeOnboarding } = await import('../../src/services/userService');
    vi.mocked(completeOnboarding).mockImplementation(async () => {
      // Ensure the promise resolves asynchronously
      await new Promise(res => setTimeout(res, 0));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should allow user to complete the full create choir flow', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    try {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();
      });
    } catch (e) {
      // Print the DOM for debugging
      // eslint-disable-next-line no-console
      console.log('DOM after initial render:', screen.debug());
      throw e;
    }

    const onboardingLink = screen.getByRole('link', { name: /Proceed to Onboarding/i });
    await user.click(onboardingLink);

    try {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome to ChoirApp!/i })).toBeInTheDocument();
      });
    } catch (e) {
      console.log('DOM after onboarding click:', screen.debug());
      throw e;
    }

    // Select Administrator before clicking Create My Choir
    const selectAdminButton = await screen.findByRole('button', { name: /Select Administrator/i });
    await user.click(selectAdminButton);

    const createMyChoirButton = await screen.findByRole('button', { name: /Create My Choir/i });
    await user.click(createMyChoirButton);

    try {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Create a New Choir/i })).toBeInTheDocument();
      });
    } catch (e) {
      console.log('DOM after clicking Create My Choir:', screen.debug());
      throw e;
    }

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'Integration Test Choir');

    const submitButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(submitButton);

    // After creating a choir, the user is updated. We need to mock this for the dashboard.
    const userService = await import('../../src/services/userService');
    vi.mocked(userService.getCurrentUser).mockResolvedValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ChoirAdmin',
      choirs: [{ id: 'choir-123', name: 'Integration Test Choir', role: 'Admin' }],
      hasCompletedOnboarding: true,
      isNewUser: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    });
  });

  it('should handle choir creation validation errors in the full flow', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    // Wait for the initial page to load
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /Proceed to Onboarding/i }));
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome to ChoirApp!/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Select Administrator/i }));
    await user.click(screen.getByRole('button', { name: /Create My Choir/i }));

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Create a New Choir/i })).toBeInTheDocument();
    });

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'AB');

    const submitButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Choir name must be at least 3 characters long/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /Create a New Choir/i })).toBeInTheDocument();
    
  });

  it('should handle "taken" choir name error in the full flow', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    // Wait for the initial page to load
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /Proceed to Onboarding/i }));
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome to ChoirApp!/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Select Administrator/i }));
    await user.click(screen.getByRole('button', { name: /Create My Choir/i }));

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Create a New Choir/i })).toBeInTheDocument();
    });

    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'taken');

    const submitButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/A choir with this name already exists/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('heading', { name: /Create a New Choir/i })).toBeInTheDocument();
    
  });
});
