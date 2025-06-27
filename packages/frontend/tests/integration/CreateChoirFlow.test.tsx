import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import HomePage from '../../src/pages/HomePage.tsx';
import OnboardingPage from '../../src/pages/OnboardingPage.tsx';
import CreateChoirPage from '../../src/pages/CreateChoirPage.tsx';

// Mock the userService to prevent actual API calls
vi.mock('../../src/services/userService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null), // Mock no user initially
}));

// Create a test router with memory router to ensure we start at root
const createTestRouter = () => {
  return createMemoryRouter([
    {
      path: "/",
      element: <HomePage />
    },
    {
      path: "/onboarding",
      element: <OnboardingPage />
    },
    {
      path: "/create-choir",
      element: <CreateChoirPage />
    }
  ], {
    initialEntries: ["/"], // Always start at root
    initialIndex: 0
  });
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow user to complete the full create choir flow', async () => {
    const user = userEvent.setup();

    // Render the test wrapper with routes
    render(<TestWrapper />);

    // Step 1: Verify we start on HomePage
    expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();
    expect(screen.getByText(/Your digital tool for managing songs and playlists/i)).toBeInTheDocument();

    // Step 2: Navigate to onboarding
    const onboardingLink = screen.getByRole('link', { name: /Proceed to Onboarding/i });
    await user.click(onboardingLink);

    // Step 3: Verify we're on OnboardingPage
    expect(screen.getByRole('heading', { name: /Onboarding/i })).toBeInTheDocument();
    expect(screen.getByText(/What would you like to do?/i)).toBeInTheDocument();

    // Step 4: Click "Create a Choir" button
    const createChoirButton = screen.getByRole('link', { name: /Create a Choir/i });
    await user.click(createChoirButton);

    // Step 5: Verify we're on CreateChoirPage
    expect(screen.getByRole('heading', { name: /Create a New Choir/i })).toBeInTheDocument();

    // Step 6: Fill out the choir creation form
    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'Integration Test Choir');

    // Step 7: Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(submitButton);

    // Step 8: Verify the choir was created successfully
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Choir created successfully!');
    }, { timeout: 2000 });

    // Verify the input value is still there (form hasn't been reset)
    expect(choirNameInput).toHaveValue('Integration Test Choir');
  });

  it('should handle choir creation validation errors in the full flow', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Step 1: Verify we start on HomePage
    expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();

    // Step 2: Navigate to onboarding
    const onboardingLink = screen.getByRole('link', { name: /Proceed to Onboarding/i });
    await user.click(onboardingLink);

    // Step 3: Verify we're on OnboardingPage and navigate to create choir
    expect(screen.getByRole('heading', { name: /Onboarding/i })).toBeInTheDocument();
    
    const createChoirButton = screen.getByRole('link', { name: /Create a Choir/i });
    await user.click(createChoirButton);

    // Try to create a choir with a name that's too short
    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'AB'); // Only 2 characters

    const submitButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(submitButton);

    // Verify validation error appears
    await waitFor(() => {
      expect(screen.getByText(/Choir name must be at least 3 characters long/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify the form is still interactive
    expect(choirNameInput).toHaveClass('is-danger');
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should handle "taken" choir name error in the full flow', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Step 1: Verify we start on HomePage
    expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();

    // Step 2: Navigate to onboarding
    const onboardingLink = screen.getByRole('link', { name: /Proceed to Onboarding/i });
    await user.click(onboardingLink);

    // Step 3: Verify we're on OnboardingPage and navigate to create choir
    expect(screen.getByRole('heading', { name: /Onboarding/i })).toBeInTheDocument();
    
    const createChoirButton = screen.getByRole('link', { name: /Create a Choir/i });
    await user.click(createChoirButton);

    // Try to create a choir with the special "taken" name
    const choirNameInput = screen.getByLabelText(/Choir Name/i);
    await user.type(choirNameInput, 'taken');

    const submitButton = screen.getByRole('button', { name: /Create Choir/i });
    await user.click(submitButton);

    // Verify the "taken" error appears
    await waitFor(() => {
      expect(screen.getByText(/This choir name is already taken/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(window.alert).not.toHaveBeenCalled();
  });
});
