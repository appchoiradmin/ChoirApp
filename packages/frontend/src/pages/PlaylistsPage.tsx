import React, { useState, useEffect, useRef, useContext } from 'react';
// Import SharedDateContext to access the shared date
import { SharedDateContext } from './ChoirDashboardPage';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { usePlaylistContext } from '../context/PlaylistContext';
import MovableSongItem from '../components/MovableSongItem';
import { PlaylistSong } from '../types/playlist';
import { SongDto } from '../types/song';
import { useUser } from '../hooks/useUser';
import { removeSongFromPlaylist, moveSongInPlaylist } from '../services/playlistService';
import { getSongById } from '../services/songService';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  MusicalNoteIcon,
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  TrashIcon
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
  showDeleteButton?: boolean;
  onDeleteClick?: () => void;
  isDeleting?: boolean;
}> = ({ title, date, totalSongs, totalSections, duration, isPrivate = true, showDeleteButton = false, onDeleteClick, isDeleting = false }) => {
  const { t, getCurrentLanguage } = useTranslation();
  
  // Get current language for reactive updates
  const currentLanguage = getCurrentLanguage();
  
  const formatDateWithCapitalization = (dateObj: Date) => {
    try {
      const dateString = dateObj.toLocaleDateString(currentLanguage, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    } catch (error) {
      // Fallback to English if there's an error
      const dateString = dateObj.toLocaleDateString('en', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
  };
  
  return (
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
              {formatDateWithCapitalization(date)}
            </span>
            <span className="meta-item">
              <MusicalNoteIcon className="meta-icon" />
              {t('playlists.songCount', { count: totalSongs })}
            </span>
            <span className="meta-item">
              <ClockIcon className="meta-icon" />
              {duration}
            </span>
            {isPrivate && (
              <span className="meta-item private-badge">
                <UserGroupIcon className="meta-icon" />
                {t('playlists.private')}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {showDeleteButton && (
            <Button
              variant="outlined"
              size="sm"
              leftIcon={<TrashIcon />}
              onClick={onDeleteClick}
              disabled={isDeleting}
              className="delete-playlist-btn is-danger"
            >
              {isDeleting ? t('playlists.deletingPlaylist') : t('playlists.deletePlaylistButton')}
            </Button>
          )}
        </div>
      </div>
      {/* Stats Cards - Mobile Optimized */}
      <div className="header-stats">
        <div className="stat-card">
          <span className="stat-number">{totalSections}</span>
          <span className="stat-label">{t('playlists.sections')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalSongs}</span>
          <span className="stat-label">{t('playlists.totalSongs')}</span>
        </div>

      </div>
    </div>
  );
};

const PlaylistsPage: React.FC = () => {
  // Use the shared date context
  const { selectedDate } = useContext(SharedDateContext);
  const { t, getCurrentLanguage } = useTranslation();
  const { 
    sections, 
    isInitializing, 
    error, 
    playlistId, 
    setSections,
    isPersisted,
    selectedTemplate,
    deletePlaylist,
    choirId
  } = usePlaylistContext();
  const { user } = useUser();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current language for reactive updates
  const currentLanguage = getCurrentLanguage();
  
  const formatDateTitle = (dateObj: Date) => {
    try {
      const dateString = dateObj.toLocaleDateString(currentLanguage, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    } catch (error) {
      // Fallback to English if there's an error
      const dateString = dateObj.toLocaleDateString('en', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
  };

  // Debug template synchronization
  useEffect(() => {
    console.log('🚨 DEBUG - PlaylistsPage template sync:', {
      selectedTemplate: selectedTemplate?.title || 'None',
      templateId: selectedTemplate?.id || 'None',
      sectionsCount: sections.length,
      isPersisted,
      selectedDate: selectedDate.toISOString().split('T')[0]
    });
  }, [selectedTemplate, sections, isPersisted, selectedDate]);

  // Fetch song details when sections are loaded
  useEffect(() => {
    const fetchSongDetails = async () => {
      console.log('🚨 DEBUG - PlaylistsPage fetching song details:', {
        sectionsCount: sections.length,
        selectedDate: selectedDate.toISOString().split('T')[0],
        isPersisted,
        playlistId,
        selectedTemplate: selectedTemplate?.title || 'None'
      });
      
      if (!user?.token || !sections.length) {
        console.log('🚨 DEBUG - PlaylistsPage: No token or sections, clearing songs');
        setSongs([]);
        return;
      }
      
      const songDetailsMap: Record<string, SongDto> = {};
      const songIds = new Set<string>();

      // Collect all unique song IDs from all sections
      sections.forEach(section => {
        section.songs.forEach(song => {
          if (song.songId) {
            songIds.add(song.songId);
          }
        });
      });

      console.log('🚨 DEBUG - PlaylistsPage: Found song IDs to fetch:', Array.from(songIds));

      // Fetch details for each unique song
      for (const songId of songIds) {
        try {
          const songDetail = await getSongById(songId, user.token);
          songDetailsMap[songId] = songDetail;
        } catch (error) {
          console.error(`Failed to fetch song ${songId}:`, error);
          toast.error(t('playlists.failedToFetchSong'));
        }
      }

      setSongs(Object.values(songDetailsMap));
      console.log('🚨 DEBUG - PlaylistsPage: Updated songs state with', Object.values(songDetailsMap).length, 'songs');
    };
    
    fetchSongDetails();
  }, [sections, user?.token, selectedDate, isPersisted, playlistId]); // Added selectedDate, isPersisted, playlistId to dependencies

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
      
      toast.success(t('playlists.songMovedSuccessfully'));
    } catch (error) {

      // Revert local state on error
      setSections(sections);
      toast.error(t('playlists.failedToMoveSong'));
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
      toast.success(t('playlists.songRemovedFromPlaylist'));
    } catch (error) {

      toast.error(t('playlists.failedToRemoveSong'));
    }
  };

  const handleAddSongs = () => {
    navigate('/songs');
  };

  // Delete playlist handlers
  const handleDeletePlaylist = async () => {
    if (!playlistId || !isPersisted) {
      toast.error(t('playlists.failedToDeletePlaylist'));
      return;
    }

    setIsDeleting(true);
    try {
      await deletePlaylist();
      toast.success(t('playlists.playlistDeleted'));
      setShowDeleteConfirm(false);
      // The context will automatically reset the state to allow template selection again
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error(t('playlists.failedToDeletePlaylist'));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeletePlaylist = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDeletePlaylist = () => {
    setShowDeleteConfirm(false);
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
            <p className="loading-text">{t('playlists.loadingPlaylist')}</p>
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
            <h2 className="error-title">{t('playlists.unableToLoadPlaylist')}</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                {t('playlists.tryAgain')}
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
            <p className="loading-text">{t('playlists.preparingPlaylist')}</p>
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
            <h2 className="error-title">{t('playlists.unableToLoadPlaylist')}</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                {t('playlists.tryAgain')}
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
              {t('playlists.virtualPlaylistBanner')}
            </span>
          </div>
        )}
        {/* Header Section */}
        <PlaylistHeader
          title={formatDateTitle(selectedDate)}
          date={selectedDate}
          totalSongs={getTotalSongs()}
          totalSections={sections.length}
          duration={getTotalDuration()}
          showDeleteButton={isPersisted && !!playlistId}
          onDeleteClick={confirmDeletePlaylist}
          isDeleting={isDeleting}
        />

        {/* Content Section */}
        <div className="playlist-content">
          {sections.length === 0 ? (
            <div className="empty-state">
              <MusicalNoteIcon className="empty-icon" />
              <h2 className="empty-title">{t('playlists.noSectionsYet')}</h2>
              <p className="empty-message">
                {t('playlists.startBuildingPlaylist')}
              </p>
              <div className="empty-actions">
                <Button 
                  variant="primary" 
                  leftIcon={<PlusIcon />}
                  onClick={handleAddSongs}
                  className="empty-cta"
                >
                  {t('playlists.addSongs')}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/choir/${choirId}/playlist-templates`)}
                >
                  {t('playlists.browseTemplates')}
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
                        {section.title || t('playlists.untitledSection')}
                      </h3>
                      <div className="section-meta">
                        <span className="song-count">
                          {t('playlists.songCount', { count: section.songs?.length || 0 })}
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
                        <p className="empty-text">{t('playlists.noSongsInSection')}</p>
                        <p className="section-add-instructions" dangerouslySetInnerHTML={{ __html: t('playlists.sectionAddInstructions') }}>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal is-active">
          <div className="modal-background" onClick={cancelDeletePlaylist}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">{t('playlists.confirmDeleteTitle')}</p>
              <button 
                className="delete" 
                aria-label="close" 
                onClick={cancelDeletePlaylist}
                disabled={isDeleting}
              ></button>
            </header>
            <section className="modal-card-body">
              <p className="mb-4">{t('playlists.confirmDeleteMessage')}</p>
              <div className="notification is-warning is-light">
                <strong>{t('playlists.confirmDelete')}</strong>
              </div>
            </section>
            <footer className="modal-card-foot">
              <Button
                variant="outlined"
                onClick={handleDeletePlaylist}
                disabled={isDeleting}
                className="is-danger"
                leftIcon={<TrashIcon />}
              >
                {isDeleting ? t('playlists.deletingPlaylist') : t('playlists.deletePlaylist')}
              </Button>
              <Button
                variant="ghost"
                onClick={cancelDeletePlaylist}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PlaylistsPage;
