import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistById, deletePlaylist } from '../services/playlistService';
import { getSongsForChoir } from '../services/songService';
import { Playlist } from '../types/playlist';
import { SongDto } from '../types/song';
import { useTranslation } from '../hooks/useTranslation';

const PlaylistDetailPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { token } = useUser();
  const { t } = useTranslation();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<SongDto[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlistId && token) {
      const fetchPlaylist = async () => {
        try {
          const fetchedPlaylist = await getPlaylistById(playlistId, token);
          setPlaylist(fetchedPlaylist);
          if (fetchedPlaylist) {
            const fetchedSongs = await getSongsForChoir(fetchedPlaylist.choirId, token);
            setSongs(fetchedSongs);
          }
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
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <h1 className="title">{playlist.title}</h1>
        <div>
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
            // Find the song in our songs array using the unified model
            const songData = songs.find(s => s.songId === song.songId);
            
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
