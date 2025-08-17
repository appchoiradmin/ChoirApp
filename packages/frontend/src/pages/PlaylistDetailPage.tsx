import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistById, deletePlaylist } from '../services/playlistService';
import { Playlist } from '../types/playlist';
import { useTranslation } from '../hooks/useTranslation';
import { PlaylistOfflineStatus, OfflineStatusCompact } from '../components/OfflineStatus';
import SimpleOfflineTest from '../components/SimpleOfflineTest';

const PlaylistDetailPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { token } = useUser();
  const { t } = useTranslation();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlistId && token) {
      const fetchPlaylist = async () => {
        try {
          const fetchedPlaylist = await getPlaylistById(playlistId, token);
          setPlaylist(fetchedPlaylist);
        } catch (err: any) {
          setError(err.message || t('playlistDetail.failedToFetch'));
        } finally {
          setLoading(false);
        }
      };
      fetchPlaylist();
    }
  }, [playlistId, token]);

  if (loading) {
    return <div>{t('playlistDetail.loading')}</div>;
  }

  if (error) {
    return <div>{t('playlistDetail.error', { message: error })}</div>;
  }

  if (!playlist) {
    return <div>{t('playlistDetail.notFound')}</div>;
  }

  const handleDelete = async () => {
    if (window.confirm(t('playlistDetail.deleteConfirm'))) {
      if (playlistId && token) {
        try {
          await deletePlaylist(playlistId, token);
          navigate('/playlists');
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  return (
    <div className="container">
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
        <div>
          <h1 className="title">{playlist.title}</h1>
          {playlistId && <PlaylistOfflineStatus playlistId={playlistId} />}
        </div>
        <div className="is-flex is-align-items-center">
          <SimpleOfflineTest />
          <div style={{ marginLeft: '1rem' }}>
            <OfflineStatusCompact className="mr-3" />
          </div>
          <Link to={`/playlists/${playlistId}/edit`} className="button is-primary mr-2">
            {t('playlistDetail.editPlaylist')}
          </Link>
          <button onClick={handleDelete} className="button is-danger">
            {t('playlistDetail.deletePlaylist')}
          </button>
        </div>
      </div>
      {playlist.sections.map((section) => (
        <div key={section.id} className="mb-4">
          <h2 className="subtitle">{section.title}</h2>
          {section.songs.map((song) => {
            // Use the embedded song data directly from the playlist response
            const songData = song.song;
            
            return (
              <div key={song.id} className="box">
                <Link to={`/songs/${song.songId}`}>
                  {songData?.title || t('playlistDetail.unknownSong')}
                </Link>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PlaylistDetailPage;
