import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMasterSong } from '../services/masterSongService';
import type { CreateMasterSongDto } from '../types/song';
import { UserContext } from '../contexts/UserContext';
import TagInput from '../components/TagInput';
import { Layout, Navigation } from '../components/ui';
import styles from './CreateMasterSongPage.module.scss';

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

  const handleGoBack = () => {
    navigate('/master-songs');
  };

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
    <Layout>
      <Navigation 
        title="Create Master Song"
        showBackButton={true}
        onBackClick={handleGoBack}
        showUserProfile={true}
      />
      <section className={styles['create-song-section']}>
        <div className={styles['create-song-container']}>
          <form onSubmit={handleSubmit}>
            <div className={styles['form-group']}>
              <label className={styles['form-label']} htmlFor="title">Title</label>
              <input
                id="title"
                className={styles['form-input']}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className={styles['form-group']}>
              <label className={styles['form-label']} htmlFor="artist">Artist</label>
              <input
                id="artist"
                className={styles['form-input']}
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
            <fieldset className={styles['form-group']} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className={styles['form-label']}>Tags</legend>
              <TagInput tags={tags} setTags={setTags} />
            </fieldset>
            <div className={styles['form-group']}>
              <label className={styles['form-label']} htmlFor="lyricsChordPro">Content (ChordPro format)</label>
              <textarea
                id="lyricsChordPro"
                className={styles['form-textarea']}
                value={lyricsChordPro}
                onChange={(e) => setLyricsChordPro(e.target.value)}
                rows={15}
                required
              />
            </div>
            {error && <div className={styles['error-message']}>{error}</div>}
            <div className={styles['form-actions']}>
              <button type="submit" className={styles.button + ' button is-primary'} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Song'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default CreateMasterSongPage;
