import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchMasterSongs } from '../services/masterSongService';
import { addSongToPlaylist } from '../services/playlistService';
import { MasterSongDto } from '../types/song';
import { PlaylistSection } from '../types/playlist';
import { useUser } from '../hooks/useUser';
import { usePlaylist } from '../hooks/usePlaylist';

interface MasterSongListProps {
  choirId: string;
}

const MasterSongList: React.FC<MasterSongListProps> = ({ choirId }) => {
  const [songs, setSongs] = useState<MasterSongDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { token } = useUser();
  const { sections, selectedTemplate } = usePlaylist();

  useEffect(() => {
    if (token) {
      const fetchSongsAndPlaylists = async () => {
        try {
          setLoading(true);
          const fetchedSongs = await searchMasterSongs({ title: searchTerm }, token);
          setSongs(fetchedSongs);


          // No longer using selectedPlaylist
        } catch (err: any) {
          setError(err.message || 'Failed to fetch songs or playlists');
        } finally {
          setLoading(false);
        }
      };
      fetchSongsAndPlaylists();
    }
  }, [searchTerm, token, choirId]);

  const handleAddSongToPlaylist = async (song: MasterSongDto, sectionId: string) => {
    if (!token) return;
    try {
      await addSongToPlaylist(
        sections[0].id,
        {
          songId: song.songId,
          sectionId,
          choirSongVersionId: song.choirSongVersionId,
        },
        token
      );
      // Optionally, show a success message
    } catch (error) {
      // Optionally, show an error message
    }
  };

  return (
    <div className="container">
      <h1 className="title">Master Songs</h1>
      <div className="field">
        <div className="control">
          <input
            className="input"
            type="text"
            placeholder="Filter by title or artist"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="has-text-danger">{error}</p>
      ) : (
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Add to Playlist</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song) => (
              <tr key={song.songId}>
                <td>
                  <Link to={`/master-songs/${song.songId}`}>{song.title}</Link>
                </td>
                <td>{song.artist}</td>
                <td>
                  <div className={`dropdown ${activeDropdown === song.songId ? 'is-active' : ''}`}>
                    <div className="dropdown-trigger">
                      <button
                        className="button"
                        aria-haspopup="true"
                        aria-controls={`dropdown-menu-${song.songId}`}
                        onClick={() => setActiveDropdown(activeDropdown === song.songId ? null : song.songId)}
                      >
                        <span>Add to...</span>
                        <span className="icon is-small">
                          <i className="fas fa-angle-down" aria-hidden="true"></i>
                        </span>
                      </button>
                    </div>
                    <div className="dropdown-menu" id={`dropdown-menu-${song.songId}`} role="menu">
                      <div className="dropdown-content">
                        {sections && sections.length > 0 ? (
                          sections
                            .sort((a, b) => a.order - b.order)
                            .map((section: PlaylistSection) => (
                              <a
                                href="#"
                                className="dropdown-item"
                                key={section.id}
                                onClick={() => {
                                  handleAddSongToPlaylist(song, section.id);
                                  // handleAddSongToPlaylist(song, playlistId, section.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                {(selectedTemplate ? selectedTemplate.title : 'Playlist') + ' - ' + section.title}
                              </a>
                            ))
                        ) : (
                          <div className="dropdown-item">No playlist selected</div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MasterSongList;
