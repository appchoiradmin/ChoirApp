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
  const { sections, selectedTemplate, playlistId, isPlaylistReady, createPlaylistIfNeeded } = usePlaylist();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

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
    setError(null);
    // Debug: log sectionId and sections
    // eslint-disable-next-line no-console
    console.log('Adding song:', { songId: song.songId, sectionId, sections, playlistId });
    let finalPlaylistId: string | null = playlistId;
    let finalSectionId: string = sectionId;
    // --- Fix: Robust mapping from template section to backend section ---
    // Before playlist creation, find the section's title and order
    let intendedSectionTitle: string | undefined;
    let intendedSectionOrder: number | undefined;
    const originalSection = sections.find(s => s.id === sectionId);
    if (originalSection) {
      intendedSectionTitle = originalSection.title;
      intendedSectionOrder = originalSection.order;
    }
    try {
      if (!isPlaylistReady || !playlistId) {
        setIsCreatingPlaylist(true);
        const result = await createPlaylistIfNeeded();
        setIsCreatingPlaylist(false);
        if (!result) {
          setError('Failed to create playlist.');
          return;
        }
        finalPlaylistId = result.id;
        // Use the freshly returned sections from the playlist creation
        const backendSections = result.sections;
        // eslint-disable-next-line no-console
        console.log('Sections after playlist creation:', backendSections);
        let backendSectionId = '';
        if (intendedSectionTitle !== undefined && intendedSectionOrder !== undefined) {
          // Use the backend-returned sections array to find the right section
          const backendSection = (backendSections || []).find(s => s.title === intendedSectionTitle && s.order === intendedSectionOrder);
          if (backendSection) {
            backendSectionId = backendSection.id;
          } else {
            backendSectionId = (backendSections && backendSections.length > 0) ? backendSections[0].id : '';
          }
        }
        if (backendSectionId) {
          finalSectionId = backendSectionId;
        }
        // eslint-disable-next-line no-console
        console.log('Using backend sectionId:', finalSectionId);
      }
      // Final debug log
      // eslint-disable-next-line no-console
      const addPayload = { playlistId: finalPlaylistId, sectionId: finalSectionId, songId: song.songId, choirSongVersionId: song.choirSongVersionId };
      console.log('Final addSongToPlaylist call:', addPayload);

      // Add a 500ms delay to ensure playlist is persisted before adding a song
      await new Promise(res => setTimeout(res, 500));

      try {
        // For master songs, we always use the songId as masterSongId
        // choirSongVersionId should only be used when adding choir-specific versions
        await addSongToPlaylist(
          finalPlaylistId!,
          {
            songId: song.songId,  // This will be treated as masterSongId by the backend
            sectionId: finalSectionId,
            // Don't send choirSongVersionId for master songs
          },
          token
        );
      } catch (err: any) {
        // eslint-disable-next-line no-console
        if (err instanceof Error && err.message) {
          console.error('addSongToPlaylist error:', err.message);
        } else {
          console.error('addSongToPlaylist error:', err);
        }
        if (err && err.response) {
          try {
            const errorData = await err.response.json();
            // eslint-disable-next-line no-console
            console.error('addSongToPlaylist backend error data:', errorData);
          } catch {}
        }
        setError('Failed to add song to playlist');
        return;
      }
      // Optionally, show a success message
    } catch (error: any) {
      setIsCreatingPlaylist(false);
      setError(error?.message || 'Failed to add song to playlist');
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
      {isCreatingPlaylist ? (
        <p className="has-text-info mt-3">Creating playlist... Please wait.</p>
      ) : loading ? (
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
                              <button
                                key={section.id}
                                className="dropdown-item"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddSongToPlaylist(song, section.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                {(selectedTemplate ? selectedTemplate.title : 'Playlist') + ' - ' + section.title}
                              </button>
                            ))
                        ) : (
                          <div className="dropdown-item">No playlist sections</div>
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
