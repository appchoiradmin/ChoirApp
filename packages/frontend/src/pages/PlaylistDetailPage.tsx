import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistById, deletePlaylist } from '../services/playlistService';
import { getChoirSongsByChoirId } from '../services/choirSongService';
import { Playlist } from '../types/playlist';
import { ChoirSongVersionDto } from '../types/choir';

const PlaylistDetailPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { token } = useUser();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [choirSongs, setChoirSongs] = useState<ChoirSongVersionDto[]>([]);
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
            const fetchedSongs = await getChoirSongsByChoirId(fetchedPlaylist.choirId, token);
            setChoirSongs(fetchedSongs);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch playlist');
        } finally {
          setLoading(false);
        }
      };
      fetchPlaylist();
    }
  }, [playlistId, token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!playlist) {
    return <div>Playlist not found.</div>;
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
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
            Edit Playlist
          </Link>
          <button onClick={handleDelete} className="button is-danger">
            Delete Playlist
          </button>
        </div>
      </div>
      {playlist.sections.map((section) => (
        <div key={section.id} className="mb-4">
          <h2 className="subtitle">{section.title}</h2>
          {section.songs.map((song) => {
            const songData = choirSongs.find(cs => cs.choirSongId === song.choirSongVersionId);
            return (
              <div key={song.id} className="box">
                <Link to={`/master-songs/${song.masterSongId}`}>
                  {songData?.masterSong?.title}
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
