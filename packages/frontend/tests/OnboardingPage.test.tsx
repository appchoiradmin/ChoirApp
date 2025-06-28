import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OnboardingPage from '../src/pages/OnboardingPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
global.fetch = vi.fn();

// Mock the API_BASE_URL by defining import.meta
Object.defineProperty(import.meta, 'env', {
  value: { VITE_API_BASE_URL: 'http://localhost:5014' },
  writable: true,
});

describe('OnboardingPage', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockNavigate.mockClear();
    vi.mocked(fetch).mockClear();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('test-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders welcome message and user type options', () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome to ChoirApp!/i)).toBeInTheDocument();
    expect(screen.getByText(/Choir Administrator/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select General User/i })).toBeInTheDocument();
  });

  it('allows user to select administrator option and complete onboarding', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const adminButton = screen.getByText('Select Administrator');
    fireEvent.click(adminButton);

    const completeButton = screen.getByText('Create My Choir');
    expect(completeButton).toBeInTheDocument();

    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5014/complete-onboarding',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/create-choir');
    });
  });

  it('allows user to select general user option and complete onboarding', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const generalButton = screen.getByText('Select General User');
    fireEvent.click(generalButton);

    const completeButton = screen.getByText('Start Exploring');
    expect(completeButton).toBeInTheDocument();

    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5014/complete-onboarding',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles onboarding completion failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
    } as Response);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const adminButton = screen.getByText('Select Administrator');
    fireEvent.click(adminButton);

    const completeButton = screen.getByText('Create My Choir');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/error?message=Failed+to+complete+onboarding');
    });
  });

  it('redirects to error if no auth token found', async () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const adminButton = screen.getByText('Select Administrator');
    fireEvent.click(adminButton);

    const completeButton = screen.getByText('Create My Choir');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/error?message=Authentication+required');
    });
  });
});
