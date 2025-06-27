import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  createChoirSongVersion,
  getChoirSongsByChoirId,
  getChoirSongById,
  updateChoirSongVersion,
} from '../../src/services/choirSongService';
import type { ChoirSongVersionDto, CreateChoirSongVersionDto, UpdateChoirSongVersionDto } from '../../src/types/choir';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const API_BASE_URL = 'http://localhost:5014';

describe('choirSongService', () => {
  describe('createChoirSongVersion', () => {
    it('should create a choir song version successfully', async () => {
      const choirId = 'choir-1';
      const createDto: CreateChoirSongVersionDto = { masterSongId: 'song-1', editedLyricsChordPro: 'C' };
      const expectedResponse: ChoirSongVersionDto = {
        choirSongId: 'new-song-1',
        masterSongId: 'song-1',
        choirId: 'choir-1',
        editedLyricsChordPro: 'C',
        lastEditedDate: new Date().toISOString(),
        editorUserId: 'user-1',
      };

      server.use(
        http.post(`${API_BASE_URL}/api/choirs/${choirId}/songs`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      localStorage.setItem('token', 'test-token');
      const result = await createChoirSongVersion(choirId, createDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error if no token is found', async () => {
      localStorage.removeItem('token');
      const choirId = 'choir-1';
      const createDto: CreateChoirSongVersionDto = { masterSongId: 'song-1', editedLyricsChordPro: 'C' };
      await expect(createChoirSongVersion(choirId, createDto)).rejects.toThrow('No token found');
    });

    it('should throw an error if the fetch fails', async () => {
      const choirId = 'choir-1';
      const createDto: CreateChoirSongVersionDto = { masterSongId: 'song-1', editedLyricsChordPro: 'C' };
      server.use(
        http.post(`${API_BASE_URL}/api/choirs/${choirId}/songs`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      localStorage.setItem('token', 'test-token');
      await expect(createChoirSongVersion(choirId, createDto)).rejects.toThrow('Failed to create choir song version');
    });
  });

  describe('getChoirSongsByChoirId', () => {
    it('should fetch choir songs successfully', async () => {
      const choirId = 'choir-1';
      const expectedResponse: ChoirSongVersionDto[] = [
        {
          choirSongId: 'song-1',
          masterSongId: 'ms-1',
          choirId: 'choir-1',
          editedLyricsChordPro: 'G C D',
          lastEditedDate: new Date().toISOString(),
          editorUserId: 'user-1',
        },
      ];

      server.use(
        http.get(`${API_BASE_URL}/api/choirs/${choirId}/songs`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      localStorage.setItem('token', 'test-token');
      const result = await getChoirSongsByChoirId(choirId);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error if no token is found', async () => {
      localStorage.removeItem('token');
      const choirId = 'choir-1';
      await expect(getChoirSongsByChoirId(choirId)).rejects.toThrow('No token found');
    });

    it('should throw an error if the fetch fails', async () => {
      const choirId = 'choir-1';
      server.use(
        http.get(`${API_BASE_URL}/api/choirs/${choirId}/songs`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      localStorage.setItem('token', 'test-token');
      await expect(getChoirSongsByChoirId(choirId)).rejects.toThrow('Failed to fetch choir songs');
    });
  });

  describe('getChoirSongById', () => {
    it('should fetch a single choir song successfully', async () => {
      const choirId = 'choir-1';
      const songId = 'song-1';
      const expectedResponse: ChoirSongVersionDto = {
        choirSongId: 'song-1',
        masterSongId: 'ms-1',
        choirId: 'choir-1',
        editedLyricsChordPro: 'G C D',
        lastEditedDate: new Date().toISOString(),
        editorUserId: 'user-1',
      };

      server.use(
        http.get(`${API_BASE_URL}/api/choirs/${choirId}/songs/${songId}`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      localStorage.setItem('token', 'test-token');
      const result = await getChoirSongById(choirId, songId);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error if no token is found', async () => {
      localStorage.removeItem('token');
      const choirId = 'choir-1';
      const songId = 'song-1';
      await expect(getChoirSongById(choirId, songId)).rejects.toThrow('No token found');
    });

    it('should throw an error if the fetch fails', async () => {
      const choirId = 'choir-1';
      const songId = 'song-1';
      server.use(
        http.get(`${API_BASE_URL}/api/choirs/${choirId}/songs/${songId}`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      localStorage.setItem('token', 'test-token');
      await expect(getChoirSongById(choirId, songId)).rejects.toThrow('Failed to fetch choir song');
    });
  });

  describe('updateChoirSongVersion', () => {
    it('should update a choir song version successfully', async () => {
      const choirId = 'choir-1';
      const songId = 'song-1';
      const updateDto: UpdateChoirSongVersionDto = { editedLyricsChordPro: 'A D E' };
      const expectedResponse: ChoirSongVersionDto = {
        choirSongId: 'song-1',
        masterSongId: 'ms-1',
        choirId: 'choir-1',
        editedLyricsChordPro: 'A D E',
        lastEditedDate: new Date().toISOString(),
        editorUserId: 'user-1',
      };

      server.use(
        http.put(`${API_BASE_URL}/api/choirs/${choirId}/songs/${songId}`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      localStorage.setItem('token', 'test-token');
      const result = await updateChoirSongVersion(choirId, songId, updateDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error if no token is found', async () => {
      localStorage.removeItem('token');
      const choirId = 'choir-1';
      const songId = 'song-1';
      const updateDto: UpdateChoirSongVersionDto = { editedLyricsChordPro: 'A D E' };
      await expect(updateChoirSongVersion(choirId, songId, updateDto)).rejects.toThrow('No token found');
    });

    it('should throw an error if the fetch fails', async () => {
      const choirId = 'choir-1';
      const songId = 'song-1';
      const updateDto: UpdateChoirSongVersionDto = { editedLyricsChordPro: 'A D E' };
      server.use(
        http.put(`${API_BASE_URL}/api/choirs/${choirId}/songs/${songId}`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      localStorage.setItem('token', 'test-token');
      await expect(updateChoirSongVersion(choirId, songId, updateDto)).rejects.toThrow('Failed to update choir song version');
    });
  });
});

