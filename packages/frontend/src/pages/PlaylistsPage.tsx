import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaylistContext } from '../context/PlaylistContext';
import MovableSongItem from '../components/MovableSongItem';
import { PlaylistSong } from '../types/playlist';
import { ChoirSongVersionDto } from '../types/choir';
import { MasterSongDto } from '../types/song';
import { useUser } from '../hooks/useUser';
import { removeSongFromPlaylist, moveSongInPlaylist } from '../services/playlistService';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  MusicalNoteIcon,
  PlayIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import './PlaylistsPage.scss';

const PlaylistsPage: React.FC = () => {
  const { 
    sections, 
    isInitializing, 
    error, 
    isPlaylistReady, 
    playlistId, 
    setSections
  } = usePlaylistContext();
  const { user } = useUser();
  const navigate = useNavigate();
  const [choirSongs] = useState<ChoirSongVersionDto[]>([]);
  const [masterSongs] = useState<MasterSongDto[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
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

  const handleMoveSong = async (song: PlaylistSong, fromSectionId: string, toSectionId: string) => {
    if (!playlistId || !user?.token) return;

    try {
      // Update local state immediately
      const updatedSections = sections.map(section => {
        if (section.id === fromSectionId) {
          return {
            ...section,
            songs: section.songs.filter(s => s.id !== song.id)
          };
        }
        if (section.id === toSectionId) {
          return {
            ...section,
            songs: [...section.songs, { ...song, order: section.songs.length }]
          };
        }
        return section;
      });

      setSections(updatedSections);

      // Use the dedicated move endpoint instead of updating the entire playlist
      await moveSongInPlaylist(playlistId, song.id, {
        fromSectionId,
        toSectionId
      }, user.token);
      
      toast.success('Song moved successfully');
    } catch (error) {
      console.error('Failed to move song:', error);
      // Revert local state on error
      setSections(sections);
      toast.error('Failed to move song');
    }
  };

  const handleRemoveSong = async (sectionId: string, songId: string) => {
    if (!playlistId || !user?.token) return;

    try {
      // Update backend first
      await removeSongFromPlaylist(playlistId, songId, user.token);

      // Update local state after successful backend call
      const updatedSections = sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            songs: section.songs.filter(s => s.id !== songId)
          };
        }
        return section;
      });

      setSections(updatedSections);
      toast.success('Song removed from playlist');
    } catch (error) {
      console.error('Failed to remove song:', error);
      toast.error('Failed to remove song');
    }
  };

  const handleAddSongs = () => {
    navigate('/master-songs');
  };

  const handlePlaylist = () => {
    // TODO: Implement playlist playback
    toast.success('Playlist playback feature coming soon!');
    console.log('Play playlist');
  };

  const handleSharePlaylist = () => {
    // TODO: Implement playlist sharing
    toast.success('Playlist sharing feature coming soon!');
    console.log('Share playlist');
  };

  const handleExportPlaylist = () => {
    // TODO: Implement playlist export
    toast.success('Playlist export feature coming soon!');
    console.log('Export playlist');
  };

  const handleDuplicatePlaylist = () => {
    // TODO: Implement playlist duplication
    toast.success('Playlist duplication feature coming soon!');
    console.log('Duplicate playlist');
  };

  const handleEditPlaylist = () => {
    if (playlistId) {
      navigate(`/playlists/${playlistId}/edit`);
    }
  };

  const toggleDropdown = (type: string) => {
    setDropdownOpen(dropdownOpen === type ? null : type);
  };

  const getTotalSongs = () => {
    return sections.reduce((total, section) => total + section.songs.length, 0);
  };

  const getTotalDuration = () => {
    // TODO: Calculate total duration when song duration is available
    return '~25 min';
  };

  // Loading state
  if (isInitializing) {
    return (
      <Layout>
        <div className="playlists-container">
          <div className="playlist-loading">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Loading playlist...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="playlists-container">
          <div className="playlist-error">
            <InformationCircleIcon className="error-icon" />
            <h2 className="error-title">Unable to Load Playlist</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isPlaylistReady) {
    return (
      <Layout>
        <div className="playlists-container">
          <div className="playlist-loading">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Preparing playlist...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="playlists-container">
        {/* Header Section */}
        <div className="playlist-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="playlist-title">
                <MusicalNoteIcon className="title-icon" />
                Current Playlist
              </h1>
              <div className="playlist-meta">
                <span className="meta-item">
                  <CalendarIcon className="meta-icon" />
                  {new Date().toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="meta-item">
                  <MusicalNoteIcon className="meta-icon" />
                  {getTotalSongs()} song{getTotalSongs() !== 1 ? 's' : ''}
                </span>
                <span className="meta-item">
                  <ClockIcon className="meta-icon" />
                  {getTotalDuration()}
                </span>
                <span className="meta-item public-badge">
                  <UserGroupIcon className="meta-icon" />
                  Public
                </span>
              </div>
            </div>
            <div className="header-actions">
              <div className="action-buttons">
                <Button 
                  variant="primary" 
                  leftIcon={<PlayIcon />}
                  onClick={handlePlaylist}
                  className="play-button"
                >
                  Play
                </Button>
                <Button 
                  variant="outlined" 
                  leftIcon={<PlusIcon />}
                  onClick={handleAddSongs}
                  className="add-songs-button"
                >
                  Add Songs
                </Button>
              </div>
              <div className="dropdown-container" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  onClick={() => toggleDropdown('playlist')}
                  className="dropdown-trigger"
                  title="More options"
                >
                  <EllipsisVerticalIcon />
                </Button>
                {dropdownOpen === 'playlist' && (
                  <div className="dropdown-menu" role="menu">
                    <button 
                      className="dropdown-item" 
                      onClick={handleEditPlaylist}
                      role="menuitem"
                    >
                      <Cog6ToothIcon className="dropdown-icon" />
                      Edit Playlist
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={handleSharePlaylist}
                      role="menuitem"
                    >
                      <ShareIcon className="dropdown-icon" />
                      Share Playlist
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={handleDuplicatePlaylist}
                      role="menuitem"
                    >
                      <DocumentDuplicateIcon className="dropdown-icon" />
                      Duplicate
                    </button>
                    <button 
                      className="dropdown-item" 
                      onClick={handleExportPlaylist}
                      role="menuitem"
                    >
                      <ArrowDownTrayIcon className="dropdown-icon" />
                      Export
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Cards - Mobile Optimized */}
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{sections.length}</span>
              <span className="stat-label">Sections</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{getTotalSongs()}</span>
              <span className="stat-label">Total Songs</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{getTotalDuration()}</span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">3</span>
              <span className="stat-label">Contributors</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="playlist-content">
          {sections.length === 0 ? (
            <div className="empty-state">
              <MusicalNoteIcon className="empty-icon" />
              <h2 className="empty-title">No Sections Yet</h2>
              <p className="empty-message">
                Start building your playlist by adding songs to sections.
                Use templates or create custom sections to organize your music.
              </p>
              <div className="empty-actions">
                <Button 
                  variant="primary" 
                  leftIcon={<PlusIcon />}
                  onClick={handleAddSongs}
                  className="empty-cta"
                >
                  Add Songs
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/playlist-templates')}
                >
                  Browse Templates
                </Button>
              </div>
            </div>
          ) : (
            <div className="playlist-sections">
              {sections.map((section, idx) => (
                <div key={section.id || idx} className="section-card">
                  <Card>
                    <div className="section-header">
                      <h3 className="section-title">
                        {section.title || 'Untitled Section'}
                      </h3>
                      <div className="section-meta">
                        <span className="song-count">
                          {section.songs?.length || 0} song{(section.songs?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {section.songs && section.songs.length > 0 ? (
                      <div className="section-songs">
                        {section.songs.map((song, songIdx) => (
                          <MovableSongItem
                            key={song.id || songIdx}
                            song={song}
                            section={section}
                            sections={sections}
                            choirSongs={choirSongs}
                            masterSongs={masterSongs}
                            onMoveSong={handleMoveSong}
                            onRemoveSong={handleRemoveSong}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="section-empty">
                        <p className="empty-text">No songs in this section yet.</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          leftIcon={<PlusIcon />}
                          onClick={handleAddSongs}
                        >
                          Add Songs
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlaylistsPage;
