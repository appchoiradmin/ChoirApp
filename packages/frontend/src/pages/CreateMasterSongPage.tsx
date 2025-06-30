import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMasterSong } from '../services/masterSongService';
import type { CreateMasterSongDto } from '../types/song';
import { UserContext } from '../contexts/UserContext';
import TagInput from '../components/TagInput';

const CreateMasterSongPage: React.FC = () => {
  const userContext = useContext(UserContext);
  const token = userContext?.token;
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [lyricsChordPro, setLyricsChordPro] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const songDto: CreateMasterSongDto = {
      title,
      artist: artist || null,
      lyricsChordPro,
      tags: tags,
    };

    try {
      if (!token) {
        setError('You must be logged in to create a song.');
        return;
      }
      const newSong = await createMasterSong(songDto, token);
      navigate(`/master-songs/${newSong.songId}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create song. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Create New Master Song</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="title">Title</label>
            <div className="control">
              <input
                id="title"
                className="input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="artist">Artist</label>
            <div className="control">
              <input
                id="artist"
                className="input"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>
          <fieldset className="field">
            <legend className="label">Tags</legend>
            <TagInput tags={tags} setTags={setTags} />
          </fieldset>
          <div className="field">
            <label className="label" htmlFor="lyricsChordPro">Content (ChordPro format)</label>
            <div className="control">
              <textarea
                id="lyricsChordPro"
                className="textarea"
                value={lyricsChordPro}
                onChange={(e) => setLyricsChordPro(e.target.value)}
                rows={15}
                required
              />
            </div>
          </div>
          {error && <div className="notification is-danger">{error}</div>}
          <div className="field">
            <div className="control">
              <button type="submit" className={`button is-primary ${isSubmitting ? 'is-loading' : ''}`} disabled={isSubmitting}>
                Create Song
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateMasterSongPage;
