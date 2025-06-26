import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import OnboardingPage from '../src/pages/OnboardingPage';

describe('OnboardingPage', () => {
  it('renders the onboarding options and links', () => {
    render(
      <BrowserRouter>
        <OnboardingPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Onboarding/i })).toBeInTheDocument();
    expect(screen.getByText(/What would you like to do\?/i)).toBeInTheDocument();

    const createChoirButton = screen.getByRole('link', { name: /Create a Choir/i });
    expect(createChoirButton).toBeInTheDocument();
    expect(createChoirButton).toHaveAttribute('href', '/create-choir');

    const joinUserButton = screen.getByRole('button', { name: /Join as a Regular User/i });
    expect(joinUserButton).toBeInTheDocument();
  });
});
