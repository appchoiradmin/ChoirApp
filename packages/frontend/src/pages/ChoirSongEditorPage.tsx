import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChoirSongById, updateChoirSongVersion } from '../services/choirSongService';
import type { ChoirSongVersionDto } from '../types/choir';

const ChoirSongEditorPage: React.FC = () => {
    const { choirId, songId } = useParams<{ choirId: string; songId: string }>();
    const navigate = useNavigate();
    const [song, setSong] = useState<ChoirSongVersionDto | null>(null);
    const [lyrics, setLyrics] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!choirId || !songId) {
            setError('Choir ID or Song ID is missing.');
            setIsLoading(false);
            return;
        }

        const fetchSong = async () => {
            try {
                const data = await getChoirSongById(choirId, songId);
                setSong(data);
                setLyrics(data.editedLyricsChordPro || data.masterSong?.lyricsChordPro || '');
            } catch (err) {
                setError('Failed to fetch song details.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSong();
    }, [choirId, songId]);

    const handleSave = async () => {
        if (!choirId || !songId) {
            setError('Cannot save without Choir ID or Song ID.');
            return;
        }

        try {
            await updateChoirSongVersion(choirId, songId, { editedLyricsChordPro: lyrics });
            navigate(`/choirs/${choirId}`); // Navigate back to the choir page or a relevant page
        } catch (err) {
            setError('Failed to save changes.');
            console.error(err);
        }
    };

    if (isLoading) {
        return <p>Loading editor...</p>;
    }

    if (error) {
        return <p className="has-text-danger">{error}</p>;
    }

    if (!song) {
        return <p>Song not found.</p>;
    }

    return (
        <div className="container">
            <h1 className="title">Edit Song: {song.masterSong?.title}</h1>
            <h2 className="subtitle">Artist: {song.masterSong?.artist}</h2>

            <div className="field">
                <label className="label">Lyrics (ChordPro)</label>
                <div className="control">
                    <textarea
                        className="textarea"
                        rows={20}
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                    ></textarea>
                </div>
            </div>

            <div className="field is-grouped">
                <div className="control">
                    <button className="button is-primary" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
                <div className="control">
                    <button className="button is-light" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChoirSongEditorPage;
