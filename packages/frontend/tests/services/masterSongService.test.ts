import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  getAllMasterSongs,
  getMasterSongById,
  createMasterSong,
  searchMasterSongs,
} from '../../src/services/masterSongService';
import type { MasterSongDto, CreateMasterSongDto } from '../../src/types/song';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const API_BASE_URL = 'http://localhost:5014';

describe('masterSongService', () => {
  describe('getAllMasterSongs', () => {
    it('should fetch all master songs successfully', async () => {
      const expectedResponse: MasterSongDto[] = [
        { id: '1', title: 'Song 1', artist: 'Artist 1', lyricsChordPro: 'C', tags: [] },
        { id: '2', title: 'Song 2', artist: 'Artist 2', lyricsChordPro: 'G', tags: [] },
      ];

      server.use(
        http.get(`${API_BASE_URL}/api/master-songs`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      const result = await getAllMasterSongs();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getMasterSongById', () => {
    it('should fetch a single master song successfully', async () => {
      const songId = '1';
      const expectedResponse: MasterSongDto = { id: '1', title: 'Song 1', artist: 'Artist 1', lyricsChordPro: 'C', tags: [] };

      server.use(
        http.get(`${API_BASE_URL}/api/master-songs/${songId}`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      const result = await getMasterSongById(songId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('createMasterSong', () => {
    it('should create a master song successfully', async () => {
      const createDto: CreateMasterSongDto = { title: 'New Song', artist: 'New Artist', lyricsChordPro: 'D', tags: [] };
      const expectedResponse: MasterSongDto = { id: '3', ...createDto, tags: [] };

      server.use(
        http.post(`${API_BASE_URL}/api/master-songs`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      const result = await createMasterSong(createDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('searchMasterSongs', () => {
    it('should search for master songs successfully', async () => {
      const searchParams = { title: 'Song' };
      const expectedResponse: MasterSongDto[] = [
        { id: '1', title: 'Song 1', artist: 'Artist 1', lyricsChordPro: 'C', tags: [] },
      ];

      server.use(
        http.get(`${API_BASE_URL}/api/songs/search`, () => {
          return HttpResponse.json(expectedResponse);
        })
      );

      const result = await searchMasterSongs(searchParams);
      expect(result).toEqual(expectedResponse);
    });
  });
});
