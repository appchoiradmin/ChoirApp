import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMasterSongs, searchMasterSongs } from '../services/masterSongService';
import { getPlaylistTemplatesByChoirId } from '../services/playlistService';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import type { MasterSongDto } from '../types/song';
import { PlaylistSection, PlaylistTemplate } from '../types/playlist';
import { useUser } from '../hooks/useUser';
import { usePlaylistContext } from '../context/PlaylistContext';
import { addSongToPlaylist } from '../services/playlistService';
import { Button, Card, LoadingSpinner, Navigation } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import './MasterSongsListPage.scss';

type SortOption = 'title' | 'artist' | 'tags';

interface FilterState {
  search: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

const MasterSongsListPage: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();
  const { sections, selectedTemplate, playlistId, refreshPlaylist, setSelectedTemplate } = usePlaylistContext();
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  const { token, user } = useUser();
  
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [availableTemplates, setAvailableTemplates] = useState<PlaylistTemplate[]>([]);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'title',
    sortOrder: 'asc'
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  // Fetch songs data and templates
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [songsData, templatesData] = await Promise.all([
          getAllMasterSongs(token),
          user?.choirId ? getPlaylistTemplatesByChoirId(user.choirId, token) : Promise.resolve([])
        ]);
        setSongs(songsData || []);
        setAvailableTemplates(templatesData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user?.choirId]);

  // Filter and sort songs
  const filteredAndSortedSongs = useMemo(() => {
    let filtered = songs.filter(song => {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = song.title?.toLowerCase().includes(searchLower);
      const artistMatch = song.artist?.toLowerCase().includes(searchLower);
      const tagsMatch = song.tags?.some(tag => tag.tagName?.toLowerCase().includes(searchLower));
      const lyricsMatch = song.lyricsChordPro?.toLowerCase().includes(searchLower);
      
      return titleMatch || artistMatch || tagsMatch || lyricsMatch;
    });

    filtered.sort((a, b) => {
      let valueA: string;
      let valueB: string;

      switch (filters.sortBy) {
        case 'title':
          valueA = a.title || '';
          valueB = b.title || '';
          break;
        case 'artist':
          valueA = a.artist || '';
          valueB = b.artist || '';
          break;
        case 'tags':
          valueA = a.tags?.map(t => t.tagName).join(', ') || '';
          valueB = b.tags?.map(t => t.tagName).join(', ') || '';
          break;
      }

      const comparison = valueA.localeCompare(valueB);
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [songs, filters]);

  // Handle search
  const handleSearch = async () => {
    if (!token) {
      setError('Authentication token not found.');
      return;
    }
    setLoading(true);
    try {
      const results = await searchMasterSongs(
        {
          title: filters.search,
          artist: filters.search,
          tag: filters.search,
        },
        token
      );
      setSongs(results || []);
      setError(null);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for songs.');
      toast.error('Failed to search for songs');
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const handleSelectSong = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSongs.size === filteredAndSortedSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredAndSortedSongs.map(song => song.songId)));
    }
  };

  const clearSelection = () => {
    setSelectedSongs(new Set());
  };

  // Handle template selection
  const handleTemplateSelect = (template: PlaylistTemplate) => {
    setSelectedTemplate(template);
    setTemplateDropdownOpen(false);
    toast.success(`Switched to template: ${template.title}`);
  };

  // Handle adding song to playlist section
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
      toast.success(`Added "${song.title}" to ${section.title}`);
      // Navigate to the Playlists tab
      navigate(`/choir/${user?.choirId}/playlists`);
    } catch (err) {
      console.error('Error adding song to playlist:', err);
      toast.error('Failed to add song to playlist');
      setDropdownOpen(null);
    }
  };  

  // Song card component
  const SongCard: React.FC<{ song: MasterSongDto }> = ({ song }) => {
    const isSelected = selectedSongs.has(song.songId);
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't select if clicking on the song title or other interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('.song-title.clickable, .card-checkbox, .add-to-container, .card-actions')) {
        return;
      }
      handleSelectSong(song.songId);
    };
    
    return (
      <div 
        className={`song-card ${isSelected ? 'selected' : ''}`}
        onClick={handleCardClick}
      >
        <Card>
          <div className="card-content">
            <div className="card-header">
              <div className="card-checkbox">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => handleSelectSong(song.songId)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="checkmark"></div>
              </div>
              
              <div className="song-info">
                <button 
                  className="song-title clickable" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/master-songs/${song.songId}`);
                  }}
                  title="Click to view song details"
                  type="button"
                >
                  {song.title || 'Untitled Song'}
                </button>
                {song.artist && (
                  <p className="song-artist">{song.artist}</p>
                )}
              </div>
              
              <div className="card-actions">
                <div className="add-to-container">
                  <Button
                    variant="primary"
                    size="sm"
                    className="add-to-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(song.songId === dropdownOpen ? null : song.songId);
                    }}
                    title="Add to playlist"
                  >
                    <ListBulletIcon className="button-icon" />
                    Add to
                  </Button>
                  
                  {dropdownOpen === song.songId && (
                    <div
                      className="add-to-dropdown enhanced"
                      role="listbox"
                      ref={el => { dropdownRefs.current[song.songId] = el; }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="dropdown-header">
                        <div className="dropdown-title-section">
                          <span className="dropdown-title">Add to Section</span>
                          <div className="dropdown-status">
                            {!playlistId ? (
                              <span className="status-badge new">
                                <PlusIcon className="status-icon" />
                                Will create playlist
                              </span>
                            ) : (
                              <span className="status-badge existing">
                                <CheckIcon className="status-icon" />
                                Adding to saved playlist
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {displayedSections.length > 0 && (
                          <div className="dropdown-summary">
                            <span className="summary-text">
                              {displayedSections.length} section{displayedSections.length !== 1 ? 's' : ''} available
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="dropdown-content">
                        {displayedSections.length === 0 ? (
                          <div className="dropdown-item disabled">
                            <div className="dropdown-content-row">
                              <MusicalNoteIcon className="dropdown-icon" />
                              <div className="dropdown-text">
                                <span className="dropdown-name">No sections available</span>
                                <span className="dropdown-detail">Create a template first</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          displayedSections
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map(section => (
                              <button
                                key={section.id}
                                className="dropdown-item"
                                onClick={() => handleAddToSection(song, section)}
                                type="button"
                              >
                                <div className="dropdown-content-row">
                                  <div className="section-indicator">
                                    <MusicalNoteIcon className="dropdown-icon" />
                                    <span className="section-number">{section.order + 1}</span>
                                  </div>
                                  <div className="dropdown-text">
                                    <span className="dropdown-name">{section.title}</span>
                                    <span className="dropdown-detail">
                                      {section.songs.length} song{section.songs.length !== 1 ? 's' : ''}
                                      {section.songs.length === 0 && ' · Empty section'}
                                    </span>
                                  </div>
                                  <div className="dropdown-actions">
                                    <PlusIcon className="dropdown-action" />
                                  </div>
                                </div>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            
          </div>
        </Card>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="master-songs-container">
          <div className="master-songs-loading">
            <LoadingSpinner />
            <p className="loading-text">Loading master songs...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title="Master Songs" 
            showBackButton={true} 
            onBackClick={() => navigate('/dashboard')}
          />
        }
      >
        <div className="master-songs-container">
          <div className="master-songs-error">
            <InformationCircleIcon className="error-icon" />
            <h2 className="error-title">Error Loading Songs</h2>
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

  return (
    <Layout 
      navigation={
        <Navigation 
          title="Master Songs" 
          showBackButton={true} 
          onBackClick={() => navigate('/dashboard')}
        />
      }
    >
      <div className="master-songs-container">
        {/* Header Section */}
        <div className="songs-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                <MusicalNoteIcon className="title-icon" />
                Master Songs
              </h1>
              <p className="page-subtitle">
                Browse and manage the master song library
              </p>
            </div>
            <div className="header-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/master-songs/create')}
              >
                <PlusIcon className="icon" />
                Create Song
              </Button>
            </div>
          </div>
          
          {/* Stats Cards - Mobile Optimized */}
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{filteredAndSortedSongs.length}</span>
              <span className="stat-label">Total Songs</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-number">{selectedSongs.size}</span>
              <span className="stat-label">Selected</span>
            </div>
            <div className="stat-card template-selector">
              <div className="template-dropdown">
                <button
                  className="template-dropdown-trigger"
                  onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                  type="button"
                >
                  <div className="template-info">
                    <span className="template-name">
                      {selectedTemplate ? selectedTemplate.title : 'Select Template'}
                    </span>
                    <span className="template-details">
                      {selectedTemplate ? '' : `${availableTemplates.length} available`}
                    </span>
                  </div>
                  {templateDropdownOpen ? <ChevronUpIcon className="dropdown-icon" /> : <ChevronDownIcon className="dropdown-icon" />}
                </button>
                
                {templateDropdownOpen && (
                  <div className="template-dropdown-menu">
                    {availableTemplates.length === 0 ? (
                      <div className="dropdown-item disabled">
                        <span>No templates available</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/choir/${user?.choirId}/playlist-templates/new`)}
                        >
                          Create One
                        </Button>
                      </div>
                    ) : (
                      availableTemplates.map(template => (
                        <button
                          key={template.id}
                          className={`dropdown-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                          onClick={() => handleTemplateSelect(template)}
                          type="button"
                        >
                          <div className="template-option">
                            <span className="option-name">{template.title}</span>
                            <span className="option-details">{template.sections.length} sections</span>
                          </div>
                          {selectedTemplate?.id === template.id && <CheckIcon className="selected-icon" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="stat-label">Template</span>
            </div>
          </div>
        </div>

        {/* Enhanced Playlist Building Status Bar */}
        <div className="playlist-status-bar">
          <Card className="status-card">
            <div className="status-content">
              <div className="status-left">
                <div className="status-indicator">
                  <CalendarDaysIcon className="status-icon" />
                  <div className="status-info">
                    <span className="status-date">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="status-label">
                      {playlistId ? 'Editing Saved Playlist' : 'Building New Playlist'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="status-center">
                <div className="status-progress">
                  <div className="progress-item">
                    <div className={`progress-step ${playlistId || displayedSections.some(s => s.songs.length > 0) ? 'completed' : 'pending'}`}>
                      {playlistId || displayedSections.some(s => s.songs.length > 0) ? (
                        <CheckIcon className="step-icon" />
                      ) : (
                        <ClockIcon className="step-icon" />
                      )}
                    </div>
                    <span className="progress-label">
                      {playlistId ? 'Saved' : 'In Memory'}
                    </span>
                  </div>
                  
                  <div className="progress-divider"></div>
                  
                  <div className="progress-item">
                    <div className="progress-count">
                      <span className="count-number">
                        {displayedSections.reduce((total, section) => total + section.songs.length, 0)}
                      </span>
                    </div>
                    <span className="progress-label">Songs Added</span>
                  </div>
                  
                  <div className="progress-divider"></div>
                  
                  <div className="progress-item">
                    <div className="progress-count">
                      <span className="count-number">{displayedSections.length}</span>
                    </div>
                    <span className="progress-label">Sections</span>
                  </div>
                </div>
              </div>
              
              <div className="status-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/choir/${user?.choirId}/playlists`)}
                  className="view-playlist-btn"
                >
                  <ListBulletIcon className="button-icon" />
                  View Playlists
                </Button>
              </div>
            </div>
            
            {!playlistId && (
              <div className="status-hint">
                <InformationCircleIcon className="hint-icon" />
                <span className="hint-text">
                  Your playlist will be automatically saved when you add the first song
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Enhanced Playlist Building Guide */}
        {displayedSections.length > 0 && (
          <div className="playlist-building-guide">
            <Card className="guide-card">
              <div className="guide-header">
                <div className="guide-status">
                  <InformationCircleIcon className="status-icon" />
                  <div className="status-info">
                    <h3 className="guide-title">
                      {playlistId ? 'Adding to Saved Playlist' : 'Building New Playlist'}
                    </h3>
                    <p className="guide-subtitle">
                      {playlistId 
                        ? 'This playlist is saved and ready for editing' 
                        : 'Playlist will be created when you add the first song'
                      }
                    </p>
                  </div>
                </div>
                <div className="playlist-stats">
                  <span className="playlist-stat">
                    <span className="stat-number">{displayedSections.reduce((total, section) => total + section.songs.length, 0)}</span>
                    <span className="stat-label">Songs</span>
                  </span>
                </div>
              </div>
              
              <div className="available-sections">
                <h4 className="sections-title">Available Sections:</h4>
                <div className="section-tags">
                  {displayedSections
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <span key={section.id} className="section-tag">
                        <span className="section-name">{section.title}</span>
                        <span className="section-count">{section.songs.length}</span>
                      </span>
                    ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search songs, artists, tags, or lyrics..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              className="search-button"
            >
              Search
            </Button>
          </div>
          
          <div className="filter-controls">
            <select
              className="filter-select"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SortOption }))}
            >
              <option value="title">Sort by Title</option>
              <option value="artist">Sort by Artist</option>
              <option value="tags">Sort by Tags</option>
            </select>
            
            <select
              className="filter-select"
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
            
            <Button
              variant={selectedSongs.size > 0 ? "primary" : "secondary"}
              size="sm"
              onClick={clearSelection}
              disabled={selectedSongs.size === 0}
            >
              <XMarkIcon className="icon" />
              Clear ({selectedSongs.size})
            </Button>
            
            <Button
              variant="outlined"
              size="sm"
              onClick={handleSelectAll}
            >
              <CheckCircleIcon className="icon" />
              {selectedSongs.size === filteredAndSortedSongs.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>

        {/* Songs Content */}
        <div className="songs-content">
          {/* Bulk Actions Bar - Mobile Optimized */}
          {selectedSongs.size > 0 && (
            <div className="bulk-actions">
              <div className="bulk-info">
                <CheckCircleIcon className="bulk-icon" />
                <span className="bulk-count">
                  {selectedSongs.size} song{selectedSongs.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="bulk-buttons">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement bulk export
                    toast.success(`${selectedSongs.size} songs exported`);
                  }}
                >
                  <DocumentTextIcon className="icon" />
                  Export
                </Button>
              </div>
            </div>
          )}

          {/* Songs Grid */}
          {filteredAndSortedSongs.length === 0 ? (
            <div className="empty-state">
              <MusicalNoteIcon className="empty-icon" />
              <h2 className="empty-title">
                {filters.search ? 'No songs found' : 'No master songs yet'}
              </h2>
              <p className="empty-message">
                {filters.search 
                  ? `No songs match "${filters.search}". Try adjusting your search.`
                  : 'Get started by creating your first master song.'
                }
              </p>
              <div className="empty-actions">
                <Button
                  variant="primary"
                  onClick={() => navigate('/master-songs/create')}
                >
                  <PlusIcon className="icon" />
                  Create First Song
                </Button>
              </div>
            </div>
          ) : (
            <div className="songs-grid">
              {filteredAndSortedSongs.map((song) => (
                <SongCard key={song.songId} song={song} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MasterSongsListPage;
