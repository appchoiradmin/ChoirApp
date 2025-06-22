import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMasterSongById } from '../services/masterSongService';
import { createChoirSongVersion } from '../services/choirSongService';
import type { MasterSongDto } from '../types/song';
import { useUser } from '../contexts/UserContext.tsx';

const MasterSongDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: userLoading } = useUser();
  const [song, setSong] = useState<MasterSongDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [creationSuccess, setCreationSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      try {
        const data = await getMasterSongById(id);
        setSong(data);
      } catch (err) {
        setError('Failed to fetch song details');
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id]);

  const handleCreateChoirVersion = async () => {
    if (!song || !user || !user.choirs || user.choirs.length === 0) return;

    const choirId = user.choirs[0].id;

    setIsCreating(true);
    setCreationSuccess(false);

    try {
      await createChoirSongVersion(choirId, {
        masterSongId: song.id,
        editedLyricsChordPro: song.content,
      });
      setCreationSuccess(true);
    } catch (err) {
      setError('Failed to create choir version');
    } finally {
      setIsCreating(false);
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

  const canCreateVersion = user && user.choirs && user.choirs.length > 0;

  return (
    <section className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <div>
              <h1 className="title">{song.title}</h1>
              <h2 className="subtitle">By {song.artist}</h2>
            </div>
          </div>
          <div className="level-right">
            {canCreateVersion && (
              <div className="field">
                <div className="control">
                  <button
                    className={`button is-primary ${isCreating ? 'is-loading' : ''}`}
                    onClick={handleCreateChoirVersion}
                    disabled={isCreating || creationSuccess}
                  >
                    {creationSuccess ? 'Version Created!' : 'Create Choir Version'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {creationSuccess && (
          <div className="notification is-success is-light">
            Successfully created a new version for your choir.
          </div>
        )}

        <div className="tags">
          <span className="tag is-info">Key: {song.key}</span>
          {song.tags.map(tag => (
            <span key={tag.tagId} className="tag is-primary">{tag.tagName}</span>
          ))}
        </div>
        <div className="content">
          <pre>{song.content}</pre>
        </div>
      </div>
    </section>
  );
};

export default MasterSongDetailPage;
