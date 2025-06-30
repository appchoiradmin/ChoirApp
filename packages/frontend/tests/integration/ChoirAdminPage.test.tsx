import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import ChoirAdminPage from '../../src/pages/ChoirAdminPage';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { User } from '../../src/types/user';
import { ChoirDetails } from '../../src/types/choir';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  choirs: [{ id: 'choir-1', name: 'Test Choir', role: 'Admin' }],
  role: 'ChoirAdmin',
  hasCompletedOnboarding: true,
  isNewUser: false,
};

const mockChoirDetails: ChoirDetails = {
  id: 'choir-1',
  name: 'Test Choir',
  role: 'Admin',
  members: [
    { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
    { id: 'user-2', name: 'Member User', email: 'member@example.com', role: 'Member' },
  ],
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/choir/choir-1/admin']}>
      <UserProvider>
        <Routes>
          <Route path="/choir/:choirId/admin" element={ui} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );
};

describe('ChoirAdminPage', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    server.use(
      http.get('*/api/users/me', () => {
        return HttpResponse.json(mockUser);
      }),
      http.get('*/api/choirs/choir-1', () => {
        return HttpResponse.json(mockChoirDetails);
      })
    );
  });

  it('should display the choir admin page with members and songs', async () => {
    renderWithProviders(<ChoirAdminPage />);

    expect(await screen.findByRole('heading', { name: /Test Choir - Admin/i })).toBeInTheDocument();
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(await screen.findByText('Member User')).toBeInTheDocument();
  });

  it('should allow inviting a new member', async () => {
    server.use(
      http.post('*/api/choirs/choir-1/invitations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    renderWithProviders(<ChoirAdminPage />);

    expect(await screen.findByRole('heading', { name: /Test Choir - Admin/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(screen.getByText('Send Invitation'));

    expect(await screen.findByText('Invite New Member')).toBeInTheDocument();
  });

  it('should allow promoting a member to admin', async () => {
    server.use(
      http.put('*/api/choirs/choir-1/members/user-2/role', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    renderWithProviders(<ChoirAdminPage />);

    // Wait for the loading state to finish by checking for the table row with the member's email
    expect(await screen.findByText((content, element) =>
      content.includes('member@example.com')
    )).toBeInTheDocument();

    fireEvent.click(screen.getByText('Promote to Admin'));

    expect(await screen.findByText('Demote to Member')).toBeInTheDocument();
  });
});
