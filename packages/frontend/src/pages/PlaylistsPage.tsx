import React, { useState, useEffect, useRef, useContext } from 'react';
// Import SharedDateContext to access the shared date
import { SharedDateContext } from './ChoirDashboardPage';
import { useNavigate } from 'react-router-dom';
import { usePlaylistContext } from '../context/PlaylistContext';
import MovableSongItem from '../components/MovableSongItem';
import { PlaylistSong } from '../types/playlist';
import { SongDto } from '../types/song';
import { useUser } from '../hooks/useUser';
import { removeSongFromPlaylist, moveSongInPlaylist } from '../services/playlistService';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  MusicalNoteIcon,
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import './PlaylistsPage.scss';

// Reusable header component for playlist pages
const PlaylistHeader: React.FC<{
  title: string;
  date: Date;
  totalSongs: number;
  totalSections: number;
  duration: string;
  isPrivate?: boolean;
}> = ({ title, date, totalSongs, totalSections, duration, isPrivate = true }) => (
  <div className="playlist-header">
    <div className="header-content">
      <div className="header-left">
        <h1 className="playlist-title">
          <MusicalNoteIcon className="title-icon" />
          {title}
        </h1>
        <div className="playlist-meta">
          <span className="meta-item">
            <CalendarIcon className="meta-icon" />
            {date.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="meta-item">
            <MusicalNoteIcon className="meta-icon" />
            {totalSongs} song{totalSongs !== 1 ? 's' : ''}
          </span>
          <span className="meta-item">
            <ClockIcon className="meta-icon" />
            {duration}
          </span>
          {isPrivate && (
            <span className="meta-item private-badge">
              <UserGroupIcon className="meta-icon" />
              Private
            </span>
          )}
        </div>
      </div>
      <div className="header-actions">
        {/* ...existing code for header actions... */}
      </div>
    </div>
    {/* Stats Cards - Mobile Optimized */}
    <div className="header-stats">
      <div className="stat-card">
        <span className="stat-number">{totalSections}</span>
        <span className="stat-label">Sections</span>
      </div>
      <div className="stat-card">
        <span className="stat-number">{totalSongs}</span>
        <span className="stat-label">Total Songs</span>
      </div>

    </div>
  </div>
);

const PlaylistsPage: React.FC = () => {
  // Use the shared date context
  const { selectedDate } = useContext(SharedDateContext);
  const { 
    sections, 
    isInitializing, 
    error, 
    playlistId, 
    setSections,
    isPersisted
  } = usePlaylistContext();
  const { user } = useUser();
  const navigate = useNavigate();
  const [songs] = useState<SongDto[]>([]);
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
    navigate('/songs');
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

  // Show loading spinner only while initializing
  if (isInitializing) {
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

  // Show error if failed
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

  // Show playlist UI (virtual or persisted)
  return (
    <Layout>
      <div className="playlists-container">
        {/* If this is a virtual playlist (not persisted), show a badge/message */}
        {!isPersisted && !isInitializing && (
          <div className="virtual-playlist-banner">
            <InformationCircleIcon className="virtual-playlist-icon" />
            <span>
              This playlist is a preview based on your default template. It will be saved only after you add the first song.
            </span>
          </div>
        )}
        {/* Header Section */}
        <PlaylistHeader
          title={selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          date={selectedDate}
          totalSongs={getTotalSongs()}
          totalSections={sections.length}
          duration={getTotalDuration()}
        />

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
                            songs={songs}
                            onMoveSong={handleMoveSong}
                            onRemoveSong={() => handleRemoveSong(section.id, song.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="section-empty">
                        <p className="empty-text">No songs in this section yet.</p>
                        <p className="section-add-instructions">
                          To add songs, go to the <b>Songs</b> tab and add them to your playlist.
                        </p>
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
