import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:5014';

export const handlers = [
  http.get(`${API_BASE_URL}/api/master-songs`, () => {
    return HttpResponse.json([
      { id: '1', title: 'Test Song 1', artist: 'Test Artist 1', key: 'C', tags: [], content: '' },
      { id: '2', title: 'Test Song 2', artist: 'Test Artist 2', key: 'G', tags: [], content: '' },
    ]);
  }),
  http.get(`${API_BASE_URL}/api/master-songs/:id`, ({ params }) => {
    const { id } = params;

    if (id === '1') {
      return HttpResponse.json({
        id: '1',
        title: 'Test Song 1',
        artist: 'Test Artist 1',
        key: 'C',
        tags: [{ tagId: 't1', tagName: 'test' }],
        lyricsChordPro: '{title: Test Song 1}',
      });
    }

    if (id === '3') {
      return HttpResponse.json({
        id: '3',
        title: 'New Awesome Song',
        artist: 'The Testers',
        key: 'A',
        tags: [{ tagId: 't2', tagName: 'worship' }, { tagId: 't3', tagName: 'fast' }],
        content: '{{c:New song content}}',
      });
    }

    return new HttpResponse(null, { status: 404 });
  }),
  http.post(`${API_BASE_URL}/api/master-songs`, async ({ request }) => {
    const newSong = (await request.json()) as { title: string };
    return HttpResponse.json(
      { id: '3', title: newSong.title, artist: 'New Artist', key: 'D', tags: [], content: 'New Content' },
      { status: 201 }
    );
  }),
  http.get(`${API_BASE_URL}/api/me`, () => {
    return HttpResponse.json({
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
    });
  }),
];
