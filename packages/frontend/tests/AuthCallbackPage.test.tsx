import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import AuthCallbackPage from '../src/pages/AuthCallbackPage';
import HomePage from '../src/pages/HomePage';
import DashboardPage from '../src/pages/DashboardPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockNavigate.mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('stores token and redirects to dashboard if token is present', async () => {
    const token = 'test-token-123';
    render(
      <MemoryRouter initialEntries={[`/auth/callback?token=${token}`]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', token);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('redirects to onboarding page if new user token is present', async () => {
    const token = 'test-token-123';
    render(
      <MemoryRouter initialEntries={[`/auth/callback?token=${token}&isNewUser=true`]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', token);
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true });
    });
  });

  it('redirects to dashboard page if returning user token is present', async () => {
    const token = 'test-token-123';
    render(
      <MemoryRouter initialEntries={[`/auth/callback?token=${token}&isNewUser=false`]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', token);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('redirects to error page if no token is present', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/auth/error?message=No+authentication+token+received');
    });
  });
});
