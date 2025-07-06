import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Playlist } from '../types/playlist';
import { MasterSongDto } from '../types/song';
import { getMasterSongById } from '../services/masterSongService';
import { deletePlaylist } from '../services/playlistService';
import { useUser } from '../hooks/useUser';

interface PlaylistDetailProps {
  playlist: Playlist;
  onPlaylistDeleted: (playlistId: string) => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlist, onPlaylistDeleted }) => {
  const { choirId } = useParams<{ choirId: string }>();
  const [songDetails, setSongDetails] = useState<Record<string, MasterSongDto>>({});
  const { user, token } = useUser();

  const isAdmin = user?.choirs.some(c => c.id === choirId && c.role === 'Admin');

  const handleDelete = async () => {
    if (token) {
      await deletePlaylist(playlist.id, token);
      onPlaylistDeleted(playlist.id);
    }
  };

  useEffect(() => {
    const fetchSongDetails = async () => {
      if (token) {
        const details: Record<string, MasterSongDto> = {};
        for (const section of playlist.sections) {
          for (const song of section.songs) {
            if (song.masterSongId && !details[song.masterSongId]) {
              try {
                const songDetail = await getMasterSongById(song.masterSongId, token);
                details[song.masterSongId] = songDetail;
              } catch (error) {
                console.error(`Failed to fetch song ${song.masterSongId}`, error);
              }
            }
          }
        }
        setSongDetails(details);
      }
    };
    fetchSongDetails();
  }, [playlist, token]);

  return (
    <div>
      <div className="level">
        <div className="level-left">
          <h2 className="title is-4">{new Date(playlist.date).toLocaleDateString()}</h2>
        </div>
        {isAdmin && (
          <div className="level-right">
            <Link to={`/playlists/${playlist.id}/edit`} className="button is-link">Edit</Link>
            <button onClick={handleDelete} className="button is-danger ml-2">Delete</button>
          </div>
        )}
      </div>
      {playlist.sections.map((section) => (
        <div key={section.id} className="mb-4">
          <h3 className="title is-5">{section.title}</h3>
          <ul>
            {section.songs.map((song) => (
              <li key={song.id}>
                {song.masterSongId ? songDetails[song.masterSongId]?.title || 'Loading...' : 'N/A'}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PlaylistDetail;
