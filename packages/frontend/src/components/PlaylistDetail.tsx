import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Playlist } from '../types/playlist';
import { SongDto } from '../types/song';
import { getSongById } from '../services/songService';
import { deletePlaylist } from '../services/playlistService';
import { useUser } from '../hooks/useUser';
import { UserRole } from '../constants/roles';
import { useTranslation } from '../hooks/useTranslation';

interface PlaylistDetailProps {
  playlist: Playlist;
  onPlaylistDeleted: (playlistId: string) => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlist, onPlaylistDeleted }) => {
  const { t } = useTranslation();
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
        console.log('🚨 DEBUG - PlaylistDetail fetching song details for playlist:', playlist.id);
        console.log('🚨 DEBUG - Playlist sections:', playlist.sections);
        const details: Record<string, SongDto> = {};
        for (const section of playlist.sections) {
          console.log('🚨 DEBUG - Processing section:', section.title, 'with', section.songs.length, 'songs');
          for (const song of section.songs) {
            console.log('🚨 DEBUG - Processing song:', song);
            if (song.songId && !details[song.songId]) {
              try {
                console.log('🚨 DEBUG - Fetching song details for songId:', song.songId);
                const songDetail = await getSongById(song.songId, token);
                console.log('🚨 DEBUG - Fetched song detail:', songDetail);
                details[song.songId] = songDetail;
              } catch (error) {
                console.error(`Failed to fetch song ${song.songId}`, error);
              }
            }
          }
        }
        console.log('🚨 DEBUG - Final song details:', details);
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
            <Link to={`/playlists/${playlist.id}/edit`} className="button is-link">{t('playlistDetail.edit')}</Link>
            <button onClick={handleDelete} className="button is-danger ml-2">{t('playlistDetail.delete')}</button>
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
                {song.songId ? (
                  songDetails[song.songId] ? (
                    <Link 
                      to={`/songs/${song.songId}`} 
                      className="has-text-link"
                    >
                      {songDetails[song.songId].title}
                    </Link>
                  ) : (
                    t('playlistDetail.loading')
                  )
                ) : (
                  t('playlistDetail.unknownSong')
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PlaylistDetail;
