import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from '../../src/contexts/UserContext.tsx';
import ChoirAdminPage from '../../src/pages/ChoirAdminPage';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { User } from '../../src/types/user';
import { ChoirDetails } from '../../src/types/choir';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

let currentChoirDetails: ChoirDetails;

beforeEach(() => {
  currentChoirDetails = {
    id: 'choir-1',
    name: 'Test Choir',
    role: 'Admin',
    members: [
      { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
      { id: 'user-2', name: 'Member User', email: 'member@example.com', role: 'Member' },
    ],
  };
  localStorage.setItem('authToken', 'test-token');
  server.use(
    http.get('*/api/users/me', () => HttpResponse.json(mockUser)),
    http.get('*/api/choirs/choir-1', () => HttpResponse.json(currentChoirDetails)),
    http.get('*/api/choirs/choir-1/invitations', () => HttpResponse.json([]))
  );
});

// Add a mock for invitationService to avoid conflicts with vi.mock in other tests
vi.mock('../../src/services/invitationService', () => ({
  getInvitations: vi.fn().mockResolvedValue([]),
  getInvitationsByChoir: vi.fn().mockResolvedValue([]),
  acceptInvitation: vi.fn().mockResolvedValue(undefined),
  rejectInvitation: vi.fn().mockResolvedValue(undefined),
}));

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
  it('should display the choir admin page with members and songs', async () => {
    renderWithProviders(<ChoirAdminPage />);

    expect(await screen.findByRole('heading', { name: /Test Choir - Admin/i })).toBeInTheDocument();
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(await screen.findByText('Member User')).toBeInTheDocument();
  });

  it('should allow inviting a new member', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
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

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Invitation sent successfully!');
    });
    alertMock.mockRestore();
  });

  it('should allow promoting a member to admin', async () => {
    server.use(
      http.put('*/api/choirs/choir-1/members/user-2/role', () => {
        currentChoirDetails.members[1].role = 'Admin';
        return new HttpResponse(null, { status: 200 });
      })
    );

    renderWithProviders(<ChoirAdminPage />);

    fireEvent.click(await screen.findByText('Member User'));
    fireEvent.click(await screen.findByText('Promote to Admin'));

    await waitFor(() => {
      // Robust: check for Demote button or Admin tag
      expect(
        screen.getByText((content) => content.toLowerCase().includes('demote to member'))
      ).toBeInTheDocument();
      // Optionally, check for updated role tag
      expect(
        screen.getAllByText((content) => content.toLowerCase().includes('admin')).length
      ).toBeGreaterThan(1); // Both users now admin
    });
  });

  it('should allow demoting an admin to member', async () => {
    // First, set user-2 as Admin
    currentChoirDetails.members[1].role = 'Admin';
    server.use(
      http.put('*/api/choirs/choir-1/members/user-2/role', () => {
        currentChoirDetails.members[1].role = 'Member';
        return new HttpResponse(null, { status: 200 });
      })
    );

    renderWithProviders(<ChoirAdminPage />);

    // Click on the member to open actions
    fireEvent.click(await screen.findByText('Member User'));

    // Should see 'Demote to Member' since user-2 is currently Admin
    fireEvent.click(await screen.findByRole('button', { name: /demote to member/i }));

    // Wait for the UI to update to show 'Promote to Admin' again
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /promote to admin/i })
      ).toBeInTheDocument();
    });
  });
});
