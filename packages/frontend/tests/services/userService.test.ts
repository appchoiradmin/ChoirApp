import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { getCurrentUser } from '../../src/services/userService';
import type { User } from '../../src/types/user';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const API_BASE_URL = 'http://localhost:5014';

describe('userService', () => {
  describe('getCurrentUser', () => {
    it('should fetch the current user successfully', async () => {
      const expectedUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        choirs: [],
      };

      server.use(
        http.get(`${API_BASE_URL}/api/me`, () => {
          return HttpResponse.json(expectedUser);
        })
      );

      localStorage.setItem('authToken', 'test-token');
      const user = await getCurrentUser();
      expect(user).toEqual(expectedUser);
    });

    it('should throw an error if no auth token is found', async () => {
      localStorage.removeItem('authToken');
      await expect(getCurrentUser()).rejects.toThrow('No auth token found');
    });

    it('should throw an error if the fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/me`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      localStorage.setItem('authToken', 'test-token');
      await expect(getCurrentUser()).rejects.toThrow('Failed to fetch current user');
    });
  });
});
