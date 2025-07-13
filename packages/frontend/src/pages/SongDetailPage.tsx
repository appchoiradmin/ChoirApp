import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSongById, createSongVersion, getSongsForChoir } from '../services/songService';
import type { SongDto, SongVisibilityType } from '../types/song';
import { useUser } from '../hooks/useUser';
import ChordProViewer from '../components/ChordProViewer';
import styles from './SongDetailPage.module.scss';

const SongDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [song, setSong] = useState<SongDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedChoirId, setSelectedChoirId] = useState<string | null>(null);
  const [songVersionExists, setSongVersionExists] = useState<boolean>(false);
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
        const data = await getSongById(id, user.token);
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

  // Check if a version of this song already exists for the user's choir
  useEffect(() => {
    const checkExistingVersion = async () => {
      if (!user?.token || !user?.choirId || !id || !song) {
        setIsCheckingVersion(false);
        return;
      }

      try {
        const choirSongs = await getSongsForChoir(user.choirId, user.token);
        const existingVersion = choirSongs.find(s => s.baseSongId === id);
        setSongVersionExists(!!existingVersion);
      } catch (err) {
        console.error('Error checking for existing song version:', err);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    if (song) {
      checkExistingVersion();
    }
  }, [id, song, user]);

  const handleCreateVersion = async () => {
    if (!id || !user?.token || !user?.choirId || !selectedChoirId) {
      return;
    }

    setIsProcessing(true);
    try {
      const newVersion = await createSongVersion(
        id,
        {
          content: song?.content || '',
          visibility: SongVisibilityType.PublicChoirs,
          visibleToChoirs: [selectedChoirId]
        },
        user.token
      );

      navigate(`/songs/${newVersion.songId}/edit`);
    } catch (err) {
      console.error('Error creating song version:', err);
      setError('Failed to create song version');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || userLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!song) {
    return <div className={styles.notFound}>Song not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{song.title}</h1>
        <p className={styles.artist}>{song.artist || 'Unknown Artist'}</p>
        
        {user?.choirId && !songVersionExists && !isCheckingVersion && (
          <div className={styles.versionControls}>
            <select
              value={selectedChoirId || ''}
              onChange={(e) => setSelectedChoirId(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Select a choir</option>
              {user.choirs.map((choir) => (
                <option key={choir.id} value={choir.id}>
                  {choir.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateVersion}
              disabled={!selectedChoirId || isProcessing}
              className={styles.createVersionButton}
            >
              {isProcessing ? 'Creating...' : 'Create Version for My Choir'}
            </button>
          </div>
        )}
        
        {songVersionExists && (
          <div className={styles.versionExists}>
            <p>A version of this song already exists for your choir.</p>
          </div>
        )}
      </div>
      
      <div className={styles.tags}>
        {song.tags && song.tags.map((tag) => (
          <span key={tag.tagId} className={styles.tag}>
            {tag.tagName}
          </span>
        ))}
      </div>
      
      <div className={styles.content}>
        <ChordProViewer content={song.content} />
      </div>
    </div>
  );
};

export default SongDetailPage;
