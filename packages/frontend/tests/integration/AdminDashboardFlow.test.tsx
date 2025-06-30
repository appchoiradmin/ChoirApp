import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../../src/pages/DashboardPage';
import ChoirAdminPage from '../../src/pages/ChoirAdminPage';
import { UserContext, UserContextType } from '../../src/contexts/UserContext';
import { User } from '../../src/types/user';
import '@testing-library/jest-dom';

describe('Admin Dashboard Flow', () => {
  const adminUser: User = {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    choirs: [
      { id: 'choir-1', name: 'Admin Choir', role: 'Admin' },
      { id: 'choir-2', name: 'Member Choir', role: 'Member' },
    ],
    hasCompletedOnboarding: true,
    role: 'General',
    isNewUser: false,
  };

  const userContextValue: UserContextType = {
    user: adminUser,
    loading: false,
    token: 'test-token',
    refetchUser: async () => {},
  };

  beforeEach(() => {
    // Mock getChoirDetails to return a valid choir for choir-1
    vi.mock('../../src/services/choirService', () => ({
      getChoirDetails: vi.fn().mockResolvedValue({
        id: 'choir-1',
        name: 'Admin Choir',
        role: 'Admin',
        members: [],
      }),
    }));
  });

  test('clicking on an admin choir navigates to the choir admin page and back', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <UserContext.Provider value={userContextValue}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/choir/:choirId/admin" element={<ChoirAdminPage />} />
          </Routes>
        </UserContext.Provider>
      </MemoryRouter>
    );

    // Navigate to admin page
    const adminChoirLink = screen.getByText('Admin Choir');
    await user.click(adminChoirLink);

    // Wait for the admin page heading (matches the actual heading in ChoirAdminPage)
    expect(await screen.findByRole('heading', { name: /Admin Choir - Admin/i })).toBeInTheDocument();

    // Navigate back to dashboard
    const goBackButton = screen.getByText('Go Back to Dashboard');
    await user.click(goBackButton);

    expect(await screen.findByText('My Choirs (Admin)')).toBeInTheDocument();
  });
});
