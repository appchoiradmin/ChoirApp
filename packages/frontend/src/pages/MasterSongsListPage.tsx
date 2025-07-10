import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllMasterSongs, searchMasterSongs } from '../services/masterSongService';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import type { MasterSongDto } from '../types/song';
import { PlaylistSection } from '../types/playlist';
import { useUser } from '../hooks/useUser';
import { usePlaylistContext } from '../context/PlaylistContext';
import { addSongToPlaylist } from '../services/playlistService';
import styles from './MasterSongsListPage.module.scss';

const MasterSongsListPage: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if any dropdown is open and if click is outside
      if (dropdownOpen) {
        const ref = dropdownRefs.current[dropdownOpen];
        if (ref && !ref.contains(event.target as Node)) {
          setDropdownOpen(null);
        }
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  const navigate = useNavigate();
  const { sections, selectedTemplate } = usePlaylistContext();
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  const { token } = useUser();
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTag, setSearchTag] = useState('');


  useEffect(() => {
    const fetchSongs = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      try {
        const data = await getAllMasterSongs(token);
        setSongs(data);
      } catch {
        setError('Failed to fetch songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [token]);

  const handleSearch = async () => {
    if (!token) {
      setError('Authentication token not found.');
      return;
    }
    setLoading(true);
    try {
      const results = await searchMasterSongs(
        {
          title: searchTitle,
          artist: searchArtist,
          tag: searchTag,
        },
        token
      );
      setSongs(results);
      setError(null);
    } catch (err) {
      setError('Failed to search for songs.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding song to playlist section and switch tab
  const { playlistId, refreshPlaylist } = usePlaylistContext();
  const { user } = useUser();

  // DEBUG LOGS
  console.log('sections from context:', sections);
  console.log('displayedSections:', displayedSections);

  const handleAddToSection = async (song: MasterSongDto, section: PlaylistSection) => {
    if (!token || !playlistId) return;
    try {
      await addSongToPlaylist(
        playlistId,
        {
          songId: song.songId,
          sectionId: section.id
        },
        token
      );
      await refreshPlaylist();
      setDropdownOpen(null);
      // Navigate to the Playlists tab
      navigate(`/choir/${user?.choirId}/playlists`);
    } catch (err) {
      // TODO: Show error notification
      setDropdownOpen(null);
    }
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <section className={styles['master-songs-section']}>
      <div className={styles['master-songs-container']}>
        <h1 className={styles['master-songs-title']}>Master Songs</h1>
        <div className={styles['search-box']}>
          <div className={styles['search-fields']}>
            <input
              className={styles['search-input']}
              type="text"
              placeholder="Title"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
            <input
              className={styles['search-input']}
              type="text"
              placeholder="Artist"
              value={searchArtist}
              onChange={(e) => setSearchArtist(e.target.value)}
            />
            <input
              className={styles['search-input']}
              type="text"
              placeholder="Tag"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
            />
            <button className={styles['search-button']} onClick={handleSearch}>Search</button>
          </div>
        </div>
        <div className={styles['actions-row']}>
          <button className={styles['search-button'] + ' button is-light'} onClick={() => navigate(-1)}>Go Back</button>
          <Link to="/master-songs/create" className={styles['search-button'] + ' button is-primary'}>Create New Song</Link>
        </div>
        {/* Show playlist/template sections as a guide for adding songs */}
        {displayedSections.length > 0 && (
          <div className={styles['section-tags']}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Add songs to these sections:</p>
            {displayedSections
              .slice()
              .sort((a: PlaylistSection, b: PlaylistSection) => a.order - b.order)
              .map((section: PlaylistSection) => (
                <span key={section.id} className={styles['section-tag']}>{section.title}</span>
              ))}
          </div>
        )}
        <div className={styles['song-list']}>
          {songs.map(song => (
            <div key={song.songId} className={styles['song-list-item-row']}>
              <Link to={`/master-songs/${song.songId}`} className={styles['song-list-item']}>
                {song.title}
              </Link>
              <div className={styles['add-to-container']}>
                <button
                  className={styles['add-to-btn']}
                  onClick={() => setDropdownOpen(song.songId === dropdownOpen ? null : song.songId)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen === song.songId}
                  type="button"
                >
                  Add to
                </button>
                {dropdownOpen === song.songId && (
                  <div
                    className={styles['add-to-dropdown']}
                    role="listbox"
                    ref={el => { dropdownRefs.current[song.songId] = el; }}
                    onClick={e => e.stopPropagation()} // Prevent bubbling to document
                  >
                    {displayedSections.length === 0 ? (
                      <div className={styles['add-to-dropdown-item']}><em>No playlist sections</em></div>
                    ) : (
                      displayedSections.map(section => (
                        <div
                          key={section.id}
                          className={styles['add-to-dropdown-item']}
                          role="option"
                          tabIndex={0}
                          onClick={() => handleAddToSection(song, section)}
                          onKeyPress={e => {
                            if (e.key === 'Enter') handleAddToSection(song, section);
                          }}
                        >
                          {section.title}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MasterSongsListPage;
