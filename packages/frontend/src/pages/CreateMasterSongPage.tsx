import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMasterSong } from '../services/masterSongService';
import type { CreateMasterSongDto } from '../types/song';

const CreateMasterSongPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const songDto: CreateMasterSongDto = {
      title,
      artist,
      key: songKey,
      content,
      tags: tags.split(',').map(tag => tag.trim()),
    };

    try {
      const newSong = await createMasterSong(songDto);
      navigate(`/master-songs/${newSong.id}`);
    } catch (err) {
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
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="songKey">Key</label>
            <div className="control">
              <input
                id="songKey"
                className="input"
                type="text"
                value={songKey}
                onChange={(e) => setSongKey(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <div className="control">
              <input
                id="tags"
                className="input"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="content">Content (ChordPro format)</label>
            <div className="control">
              <textarea
                id="content"
                className="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
