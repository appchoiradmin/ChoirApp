import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistsByChoirId, createPlaylist, getPlaylistTemplatesByChoirId } from '../services/playlistService';
import { Playlist, PlaylistTemplate } from '../types/playlist';
import PlaylistDetail from '../components/PlaylistDetail';

const PlaylistsPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getNextSunday = () => {
    const date = new Date();
    const today = date.getDay();
    const daysUntilSunday = 7 - today;
    date.setDate(date.getDate() + daysUntilSunday);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  useEffect(() => {
    if (choirId && token) {
      const fetchPlaylistsAndTemplates = async () => {
        try {
          const [fetchedPlaylists, fetchedTemplates] = await Promise.all([
            getPlaylistsByChoirId(choirId, token),
            getPlaylistTemplatesByChoirId(choirId, token),
          ]);

          setPlaylists(fetchedPlaylists);
          setTemplates(fetchedTemplates);

          const nextSunday = getNextSunday();
          const existingPlaylist = fetchedPlaylists.find(
            (p) => new Date(p.date).getTime() === nextSunday.getTime()
          );

          if (existingPlaylist) {
            setSelectedPlaylist(existingPlaylist);
          } else if (fetchedTemplates.length > 0) {
            const newPlaylistDto = {
              choirId,
              date: nextSunday,
              isPublic: false,
              playlistTemplateId: fetchedTemplates[0].id,
            };
            const newPlaylist = await createPlaylist(newPlaylistDto, token);
            setPlaylists([...fetchedPlaylists, newPlaylist]);
            setSelectedPlaylist(newPlaylist);
          } else if (fetchedPlaylists.length > 0) {
            setSelectedPlaylist(fetchedPlaylists[0]);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch data');
        } finally {
          setLoading(false);
        }
      };
      fetchPlaylistsAndTemplates();
    }
  }, [choirId, token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1 className="title">Playlists</h1>
      <div className="columns">
        <div className="column is-one-quarter">
          <aside className="menu">
            <p className="menu-label">Playlists</p>
            <ul className="menu-list">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <a
                    className={selectedPlaylist?.id === playlist.id ? 'is-active' : ''}
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    {new Date(playlist.date).toLocaleDateString()}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
        <div className="column">
          {selectedPlaylist ? (
            <PlaylistDetail playlist={selectedPlaylist} />
          ) : (
            <p>No playlist selected. Create a template to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistsPage;
