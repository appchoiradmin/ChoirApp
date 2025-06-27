import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi, type Mock } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChoirSongEditorPage from '../src/pages/ChoirSongEditorPage';
import * as choirSongService from '../src/services/choirSongService';
import type { ChoirSongVersionDto } from '../src/types/choir';

// Mock the choirSongService
vi.mock('../src/services/choirSongService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ choirId: '1', songId: '123' }),
    };
});

const mockSong: ChoirSongVersionDto = {
    choirSongId: '123',
    masterSongId: 'ms1',
    choirId: '1',
    editedLyricsChordPro: '[A]Our God is an awesome God He [D]reigns from heaven above',
    lastEditedDate: new Date().toISOString(),
    editorUserId: 'user1',
    masterSong: {
        id: 'ms1',
        title: 'Awesome God',
        artist: 'Rich Mullins',
        lyricsChordPro: '[G]Our God is an awesome God He [C]reigns from heaven above',
        tags: [],
    },
};

describe('ChoirSongEditorPage', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should render a loading state initially', () => {
        (choirSongService.getChoirSongById as Mock).mockReturnValue(new Promise(() => {}));
        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText(/loading editor.../i)).toBeInTheDocument();
    });

    it('should display an error message if fetching the song fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (choirSongService.getChoirSongById as Mock).mockRejectedValue(new Error('Failed to fetch'));
        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/failed to fetch song details/i)).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Failed to fetch'));
        consoleErrorSpy.mockRestore();
    });

    it('should display the song details and lyrics editor when fetched', async () => {
        (choirSongService.getChoirSongById as Mock).mockResolvedValue(mockSong);
        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/edit song: awesome god/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue(mockSong.editedLyricsChordPro!)).toBeInTheDocument();
        });
    });

    it('should allow the user to edit the lyrics', async () => {
        (choirSongService.getChoirSongById as Mock).mockResolvedValue(mockSong);
        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );

        const textarea = await screen.findByDisplayValue(mockSong.editedLyricsChordPro!);
        fireEvent.change(textarea, { target: { value: 'New lyrics' } });
        expect(textarea).toHaveValue('New lyrics');
    });

    it('should save the changes and navigate on save button click', async () => {
        (choirSongService.getChoirSongById as Mock).mockResolvedValue(mockSong);
        (choirSongService.updateChoirSongVersion as Mock).mockResolvedValue(undefined);

        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );

        const saveButton = await screen.findByText(/save changes/i);
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(choirSongService.updateChoirSongVersion).toHaveBeenCalledWith('1', '123', {
                editedLyricsChordPro: mockSong.editedLyricsChordPro,
            });
            expect(mockNavigate).toHaveBeenCalledWith('/choirs/1');
        });
    });

    it('should display an error message if saving fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (choirSongService.getChoirSongById as Mock).mockResolvedValue(mockSong);
        (choirSongService.updateChoirSongVersion as Mock).mockRejectedValue(new Error('Failed to save'));

        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );

        const saveButton = await screen.findByText(/save changes/i);
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Failed to save'));
        consoleErrorSpy.mockRestore();
    });

    it('should navigate back on cancel button click', async () => {
        (choirSongService.getChoirSongById as Mock).mockResolvedValue(mockSong);
        render(
            <MemoryRouter initialEntries={['/choirs/1/songs/123/edit']}>
                <Routes>
                    <Route path="/choirs/:choirId/songs/:songId/edit" element={<ChoirSongEditorPage />} />
                </Routes>
            </MemoryRouter>
        );

        const cancelButton = await screen.findByText(/cancel/i);
        fireEvent.click(cancelButton);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
