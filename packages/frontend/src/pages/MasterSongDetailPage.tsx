import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMasterSongById } from '../services/masterSongService';
import { createChoirSongVersion, getChoirSongById } from '../services/choirSongService';
import type { MasterSongDto } from '../types/song';
import { useUser } from '../hooks/useUser';
import ChordProViewer from '../components/ChordProViewer';

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
      if (!id) return;
      try {
        const data = await getMasterSongById(id);
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
  }, [id]);

  useEffect(() => {
    if (user && user.choirs && user.choirs.length > 0) {
      setSelectedChoirId(user.choirs[0].id);
    }
  }, [user]);

  useEffect(() => {
    const checkVersionExists = async () => {
      if (!selectedChoirId || !id) return;

      setIsCheckingVersion(true);
      try {
        await getChoirSongById(selectedChoirId, id);
        setChoirSongExists(true);
      } catch (error) {
        setChoirSongExists(false);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    checkVersionExists();
  }, [selectedChoirId, id]);

  const handleCreateChoirVersion = async () => {
    if (!song || !selectedChoirId) return;

    setIsProcessing(true);
    try {
      await createChoirSongVersion(selectedChoirId, {
        masterSongId: song.id,
        editedLyricsChordPro: song.lyricsChordPro,
      });
      navigate(`/choirs/${selectedChoirId}/songs/${song.id}/edit`);
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

  const canManageVersions = user && user.choirs && user.choirs.length > 0;

  return (
    <section className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <div>
              <h1 className="title">{song.title}</h1>
              <p className="subtitle is-6">Artist: {song.artist}</p>
            </div>
          </div>
          <div className="level-right">
            {canManageVersions && user.choirs.length > 1 && (
              <div className="field is-horizontal">
                <div className="field-label is-normal">
                  <label className="label">For Choir:</label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <div className="control">
                      <div className="select">
                        <select
                          value={selectedChoirId || ''}
                          onChange={(e) => setSelectedChoirId(e.target.value)}
                        >
                          {user.choirs.map((choir) => (
                            <option key={choir.id} value={choir.id}>
                              {choir.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {canManageVersions && (
              <div className="field ml-4">
                <div className="control">
                  <button
                    className={`button is-primary ${isProcessing || isCheckingVersion ? 'is-loading' : ''}`}
                    onClick={handleEditOrCreate}
                    disabled={isProcessing || isCheckingVersion || !selectedChoirId}
                  >
                    {choirSongExists ? 'Edit Choir Version' : 'Create Choir Version'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="tags">
          {song.tags.map(tag => (
            <span key={tag.tagId} className="tag is-primary">{tag.tagName}</span>
          ))}
        </div>
        <div className="content">
          <ChordProViewer source={song.lyricsChordPro} />
        </div>
      </div>
    </section>
  );
};

export default MasterSongDetailPage;
