import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import HomePage from '../src/pages/HomePage';

describe('HomePage', () => {
  it('renders the welcome message and sign-in button', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Welcome to ChoirApp/i })).toBeInTheDocument();
    expect(screen.getByText(/Your digital tool for managing songs and playlists./i)).toBeInTheDocument();
    
    const signInButton = screen.getByRole('link', { name: /Sign In with Google/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute('href', expect.stringContaining('/api/auth/signin-google'));

    const onboardingLink = screen.getByRole('link', { name: /Proceed to Onboarding \(temp\)/i });
    expect(onboardingLink).toBeInTheDocument();
    expect(onboardingLink).toHaveAttribute('href', '/onboarding');
  });
});
