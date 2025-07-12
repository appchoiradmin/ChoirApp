import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMasterSongById } from '../services/masterSongService';
import { createChoirSongVersion, getChoirSongById } from '../services/choirSongService';
import type { MasterSongDto } from '../types/song';
import { useUser } from '../hooks/useUser';
import ChordProViewer from '../components/ChordProViewer';
import styles from './MasterSongDetailPage.module.scss';

const MasterSongDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [song, setSong] = useState<MasterSongDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedChoirId, setSelectedChoirId] = useState<string | null>(null);
  const [choirSongExists, setChoirSongExists] = useState<boolean>(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState<boolean>(true);

  useEffect(() => {
    const fetchSong = async () => {
      if (userLoading) {
        return; // Wait for user to load
      }

      if (!id || !user?.token) {
        setLoading(false); // Nothing to fetch
        return;
      }

      try {
        const data = await getMasterSongById(id, user.token);
        console.log('Song data:', data);
        setSong(data);
      } catch (err) {
        if (err instanceof Error && err.message === 'Song not found') {
          setSong(null);
        } else {
          setError('Failed to fetch song details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id, user, userLoading]);

  useEffect(() => {
    if (user && user.choirs && user.choirs.length > 0) {
      setSelectedChoirId(user.choirs[0].id);
    }
  }, [user]);

  useEffect(() => {
    const checkVersionExists = async () => {
      if (!selectedChoirId || !id || !user?.token) return;

      setIsCheckingVersion(true);
      try {
        await getChoirSongById(selectedChoirId, id, user.token);
        setChoirSongExists(true);
      } catch (error) {
        setChoirSongExists(false);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    checkVersionExists();
  }, [selectedChoirId, id, user?.token]);

  const handleCreateChoirVersion = async () => {
    if (!song || !selectedChoirId || !user?.token) return;

    setIsProcessing(true);
    try {
      await createChoirSongVersion(
        selectedChoirId,
        {
          masterSongId: song.songId,
          editedLyricsChordPro: song.lyricsChordPro,
        },
        user.token
      );
      navigate(`/choirs/${selectedChoirId}/songs/${song.songId}/edit`);
    } catch {
      setError('Failed to create choir version');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditOrCreate = () => {
    if (choirSongExists) {
      navigate(`/choirs/${selectedChoirId}/songs/${id}/edit`);
    } else {
      handleCreateChoirVersion();
    }
  };

  if (loading || userLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!song) {
    return <div>Song not found.</div>;
  }

  // Check if user is a general user (no choir ID) or has choirs
  const isGeneralUser = !user?.choirId;
  const canManageVersions = user && user.choirs && user.choirs.length > 0 && !isGeneralUser;

  return (
    <section className={styles['song-detail-section']}>
      <div className={styles['song-detail-container']}>
        <div className={styles['song-actions']}>
          <button className={`${styles.button} button is-secondary`} onClick={() => navigate(-1)}>
            Go Back
          </button>
          {canManageVersions && user.choirs.length > 1 && (
            <label className={styles.label}>
              <span>For Choir:</span>
              <select
                className={styles['song-select-choir']}
                value={selectedChoirId || ''}
                onChange={(e) => setSelectedChoirId(e.target.value)}
                aria-label="Select choir"
              >
                {user.choirs.map((choir) => (
                  <option key={choir.id} value={choir.id}>
                    {choir.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {canManageVersions && (
            <button
              className={styles.button + ' button is-primary'}
              onClick={handleEditOrCreate}
              disabled={isProcessing || isCheckingVersion || !selectedChoirId}
              style={{ minWidth: 180 }}
            >
              {isProcessing || isCheckingVersion ? 'Loading...' : (choirSongExists ? 'Edit Choir Version' : 'Create Choir Version')}
            </button>
          )}
        </div>

        <h1 className={styles['song-title']}>{song.title}</h1>
        <p className={styles['song-artist']}>Artist: {song.artist}</p>

        <div className={styles['song-tags']}>
          {song.tags.map(tag => (
            <span key={tag.tagId} className={styles['song-tag']}>{tag.tagName}</span>
          ))}
        </div>
        <div className={styles['song-content']}>
          <ChordProViewer source={song.lyricsChordPro} />
        </div>
      </div>
    </section>
  );
};

export default MasterSongDetailPage;
