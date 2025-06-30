import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  getInvitationsByChoir,
} from '../../src/services/invitationService';
import type { Invitation } from '../../src/types/invitation';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const API_BASE_URL = 'http://localhost:5014';

const mockInvitations: Invitation[] = [
  {
    invitationToken: 'token-1',
    choirId: 'choir-1',
    choirName: 'Test Choir',
    email: 'invitee@example.com',
    status: 'Pending',
    sentAt: new Date().toISOString(),
  },
];

describe('invitationService', () => {
  describe('getInvitations', () => {
    it('should fetch invitations successfully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/invitations`, () => {
          return HttpResponse.json(mockInvitations);
        })
      );
      const result = await getInvitations('test-token');
      expect(result).toEqual(mockInvitations);
    });
    it('should throw an error if the fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/invitations`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      await expect(getInvitations('test-token')).rejects.toThrow('Failed to fetch invitations');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept an invitation successfully', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/invitations/accept`, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );
      await expect(acceptInvitation('token-1', 'test-token')).resolves.toBeUndefined();
    });
    it('should throw an error if the accept fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/invitations/accept`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      await expect(acceptInvitation('token-1', 'test-token')).rejects.toThrow('Failed to accept invitation');
    });
  });

  describe('rejectInvitation', () => {
    it('should reject an invitation successfully', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/invitations/reject`, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );
      await expect(rejectInvitation('token-1', 'test-token')).resolves.toBeUndefined();
    });
    it('should throw an error if the reject fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/invitations/reject`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      await expect(rejectInvitation('token-1', 'test-token')).rejects.toThrow('Failed to reject invitation');
    });
  });

  describe('getInvitationsByChoir', () => {
    it('should fetch invitations by choir successfully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/choirs/choir-1/invitations`, () => {
          return HttpResponse.json(mockInvitations);
        })
      );
      const result = await getInvitationsByChoir('choir-1', 'test-token');
      expect(result).toEqual(mockInvitations);
    });
    it('should throw an error if the fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/choirs/choir-1/invitations`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );
      await expect(getInvitationsByChoir('choir-1', 'test-token')).rejects.toThrow('Failed to fetch invitations');
    });
  });
});
