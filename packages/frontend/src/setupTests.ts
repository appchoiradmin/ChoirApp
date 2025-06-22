import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { vi, type Mock } from 'vitest';
import * as userService from './services/userService';

vi.mock('./services/userService', () => ({
  getCurrentUser: vi.fn(),
}));

beforeEach(() => {
  const mockUser = {
    id: 'user-123',
    email: 'test.user@example.com',
    firstName: 'Test',
    lastName: 'User',
    choirs: [
      {
        id: 'choir-abc',
        name: 'The Test Choir',
        adminId: 'admin-456',
      },
    ],
  };
  (userService.getCurrentUser as Mock).mockResolvedValue(mockUser);
});
