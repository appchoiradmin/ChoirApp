import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getSongById, createSongVersion, getSongsForChoir, createSong } from '../services/songService';
import type { SongDto, CreateSongDto } from '../types/song';
import { SongVisibilityType } from '../types/song';
import { useUser } from '../hooks/useUser';
import ChordProViewer from '../components/ChordProViewer';
import ChordProGuide from '../components/ChordProGuide';
import styles from './SongDetailPage.module.scss';
import Layout from '../components/ui/Layout';
import Navigation from '../components/ui/Navigation';

const SongDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isCreateMode = location.pathname === '/songs/create';
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [song, setSong] = useState<SongDto | null>(null);
  const [loading, setLoading] = useState<boolean>(!isCreateMode);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedChoirId, setSelectedChoirId] = useState<string | null>(null);
  const [songVersionExists, setSongVersionExists] = useState<boolean>(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState<boolean>(!isCreateMode);
  
  // Form state for creating a new song
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [chordProContent, setChordProContent] = useState('');
  const [visibility, setVisibility] = useState<typeof SongVisibilityType.PublicAll>(SongVisibilityType.PublicAll);

  useEffect(() => {
    const fetchSong = async () => {
      if (userLoading) {
        return; // Wait for user to load
      }

      if (isCreateMode || !id || !user?.token) {
        setLoading(false); // Nothing to fetch in create mode
        setIsCheckingVersion(false);
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

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      setError('You must be logged in to create a song');
      return;
    }

    setIsProcessing(true);
    try {
      const newSong: CreateSongDto = {
        title,
        artist,
        content: chordProContent,
        visibility
      };
      const createdSong = await createSong(newSong, user.token);
      navigate(`/songs/${createdSong.songId}`);
    } catch (err) {
      setError('Failed to create song');
      console.error('Error creating song:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCreateForm = () => (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Create New Song</h2>
      <form onSubmit={handleCreateSong}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="Enter song title"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="artist" className={styles.label}>Artist</label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className={styles.input}
            placeholder="Enter artist name (optional)"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="visibility" className={styles.label}>Visibility</label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(Number(e.target.value) as typeof SongVisibilityType.PublicAll)}
            className={styles.select}
          >
            <option value={SongVisibilityType.PublicAll}>Public</option>
            <option value={SongVisibilityType.Private}>Private</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="chordProContent" className={styles.label}>ChordPro Content</label>
          <ChordProGuide />
          <textarea
            id="chordProContent"
            value={chordProContent}
            onChange={(e) => setChordProContent(e.target.value)}
            className={styles.textarea}
            placeholder="Enter your song in ChordPro format"
            rows={10}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={styles.submitButton}
        >
          {isProcessing ? 'Creating...' : 'Create Song'}
        </button>
      </form>
    </div>
  );

  if (loading || userLoading) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title="Loading..." 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title="Error" 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        <div className={styles.error}>{error}</div>
      </Layout>
    );
  }

  if (isCreateMode) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title="Create Song" 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        {renderCreateForm()}
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title="Not Found" 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        <div className={styles.notFound}>Song not found</div>
      </Layout>
    );
  }

  return (
    <Layout 
      navigation={
        <Navigation 
          title={song?.title || 'Song Details'} 
          showBackButton={true}
          onBackClick={() => navigate(-1)}
        />
      }
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{song?.title}</h1>
          <p className={styles.artist}>{song?.artist || 'Unknown Artist'}</p>
          
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
          {song?.tags && song.tags.map((tag) => (
            <span key={tag.tagId} className={styles.tag}>
              {tag.tagName}
            </span>
          ))}
        </div>
        
        <div className={styles.content}>
          {song && <ChordProViewer source={song.content} />}
        </div>
      </div>
    </Layout>
  );
};

export default SongDetailPage;
