import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Playlist } from '../types/playlist';
import { SongDto } from '../types/song';
import { getSongById } from '../services/songService';
import { deletePlaylist } from '../services/playlistService';
import { useUser } from '../hooks/useUser';
import { UserRole } from '../constants/roles';

interface PlaylistDetailProps {
  playlist: Playlist;
  onPlaylistDeleted: (playlistId: string) => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlist, onPlaylistDeleted }) => {
  const { choirId } = useParams<{ choirId: string }>();
  const [songDetails, setSongDetails] = useState<Record<string, SongDto>>({});
  const { user, token } = useUser();

    const isAdmin = user?.choirs.some(c => c.id === choirId && c.role === UserRole.ChoirAdmin);

  const handleDelete = async () => {
    if (token) {
      await deletePlaylist(playlist.id, token);
      onPlaylistDeleted(playlist.id);
    }
  };

  useEffect(() => {
    const fetchSongDetails = async () => {
      if (token) {
        const details: Record<string, SongDto> = {};
        for (const section of playlist.sections) {
          for (const song of section.songs) {
            if (song.songId && !details[song.songId]) {
              try {
                const songDetail = await getSongById(song.songId, token);
                details[song.songId] = songDetail;
              } catch (error) {
                console.error(`Failed to fetch song ${song.songId}`, error);
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
      {playlist.sections
        .slice() // Create a shallow copy to avoid mutating the original array
        .sort((a, b) => a.order - b.order) // Sort sections by order
        .map((section) => (
        <div key={section.id} className="mb-4">
          <h3 className="title is-5">{section.title}</h3>
          <ul>
            {section.songs.map((song) => (
              <li key={song.id}>
                {song.songId ? songDetails[song.songId]?.title || 'Loading...' : 'N/A'}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PlaylistDetail;
