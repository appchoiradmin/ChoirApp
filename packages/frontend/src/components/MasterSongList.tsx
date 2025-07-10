import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, LoadingSpinner } from './ui';
import { searchMasterSongs } from '../services/masterSongService';
import { addSongToPlaylist } from '../services/playlistService';
import { MasterSongDto } from '../types/song';
import { PlaylistSection } from '../types/playlist';
import { useUser } from '../hooks/useUser';
import { usePlaylist } from '../hooks/usePlaylist';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  TagIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ListBulletIcon,
  PlusIcon,
  CheckIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import './MasterSongList.scss';

interface MasterSongListProps {
  choirId: string;
}

type SortOption = 'title' | 'artist' | 'tags';

interface FilterState {
  search: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
  selectedTags: string[];
}

const MasterSongList: React.FC<MasterSongListProps> = ({ choirId }) => {
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'title',
    sortOrder: 'asc',
    showAdvancedFilters: false,
    selectedTags: []
  });

  const { token } = useUser();
  const { sections, selectedTemplate, playlistId, isPlaylistReady, createPlaylistIfNeeded } = usePlaylist();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // DEBUG LOGS
  // eslint-disable-next-line no-console
  console.log('sections from context:', sections);
  // eslint-disable-next-line no-console
  console.log('selectedTemplate:', selectedTemplate);
  // eslint-disable-next-line no-console
  console.log('playlistId:', playlistId);

  useEffect(() => {
    if (token) {
      const fetchSongsAndPlaylists = async () => {
        try {
          setLoading(true);
          const fetchedSongs = await searchMasterSongs({ title: filters.search }, token);
          setSongs(fetchedSongs);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch songs or playlists');
        } finally {
          setLoading(false);
        }
      };
      fetchSongsAndPlaylists();
    }
  }, [filters.search, token, choirId]);

  // Filter and sort songs with enhanced search functionality
  const filteredAndSortedSongs = useMemo(() => {
    let filtered = songs.filter(song => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = song.title?.toLowerCase().includes(searchLower);
        const artistMatch = song.artist?.toLowerCase().includes(searchLower);
        const tagsMatch = song.tags?.some(tag => tag.tagName?.toLowerCase().includes(searchLower));
        const lyricsMatch = song.lyricsChordPro?.toLowerCase().includes(searchLower);
        
        if (!(titleMatch || artistMatch || tagsMatch || lyricsMatch)) {
          return false;
        }
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const songTags = song.tags?.map(tag => tag.tagName) || [];
        const hasSelectedTag = filters.selectedTags.some(tag => songTags.includes(tag));
        if (!hasSelectedTag) {
          return false;
        }
      }

      return true;
    });

    // Enhanced sorting with tag support
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

  // Get unique tags for filtering
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    songs.forEach(song => {
      song.tags?.forEach(tag => {
        tags.add(tag.tagName);
      });
    });
    return Array.from(tags).sort();
  }, [songs]);

  // Calculate statistics for header cards
  const stats = useMemo(() => {
    const totalSongs = filteredAndSortedSongs.length;
    const totalTags = availableTags.length;
    const selectedCount = selectedSongs.size;
    const sectionsCount = sections.length;

    return {
      totalSongs,
      totalTags,
      selectedCount,
      sectionsCount
    };
  }, [filteredAndSortedSongs, availableTags, selectedSongs, sections]);

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
    if (selectedSongs.size === filteredAndSortedSongs.length && filteredAndSortedSongs.length > 0) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredAndSortedSongs.map(song => song.songId)));
    }
  };

  const clearSelection = () => {
    setSelectedSongs(new Set());
  };

  // Toggle tag filter
  const toggleTagFilter = (tagName: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(t => t !== tagName)
        : [...prev.selectedTags, tagName]
    }));
  };

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



  // Enhanced Song card component with better mobile UX
  const SongCard: React.FC<{ song: MasterSongDto }> = ({ song }) => {
    const isSelected = selectedSongs.has(song.songId);
    
    return (
      <div 
        className={`song-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelectSong(song.songId)}
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
                <div className="checkmark">
                  {isSelected && <CheckIcon className="check-icon" />}
                </div>
              </div>
              
              <div className="song-info">
                <button 
                  className="song-title clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to song detail page
                    if (typeof window !== 'undefined') {
                      window.location.href = `/master-songs/${song.songId}`;
                    }
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
                      setActiveDropdown(song.songId === activeDropdown ? null : song.songId);
                    }}
                    title="Add to playlist"
                    disabled={isCreatingPlaylist}
                  >
                    <ListBulletIcon className="button-icon" />
                    Add to
                  </Button>
                  
                  {activeDropdown === song.songId && (
                    <div
                      className="add-to-dropdown enhanced"
                      role="listbox"
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
                        
                        {sections.length > 0 && (
                          <div className="dropdown-summary">
                            <span className="summary-text">
                              {sections.length} section{sections.length !== 1 ? 's' : ''} available
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="dropdown-content">
                        {sections.length === 0 ? (
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
                          sections
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map(section => (
                              <button
                                key={section.id}
                                className="dropdown-item"
                                onClick={() => {
                                  handleAddSongToPlaylist(song, section.id);
                                  setActiveDropdown(null);
                                  toast.success(`Added "${song.title}" to ${section.title}`);
                                }}
                                type="button"
                                disabled={isCreatingPlaylist}
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
            
            <div className="card-meta">
              {song.tags && song.tags.length > 0 && (
                <div className="song-tags">
                  {song.tags.slice(0, 3).map((tag) => (
                    <span key={tag.tagId} className="tag">
                      <TagIcon className="tag-icon" />
                      {tag.tagName}
                    </span>
                  ))}
                  {song.tags.length > 3 && (
                    <span className="tag more-tags">+{song.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
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
              Browse and add songs to your playlist
            </p>
          </div>
        </div>
        
        {/* Enhanced Stats Cards - Mobile Optimized */}
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.totalSongs}</span>
            <span className="stat-label">Total Songs</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalTags}</span>
            <span className="stat-label">Tags</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.selectedCount}</span>
            <span className="stat-label">Selected</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.sectionsCount}</span>
            <span className="stat-label">Sections</span>
          </div>
        </div>
      </div>

      {/* Enhanced Playlist Building Status */}
      {isCreatingPlaylist && (
        <div className="playlist-status-bar">
          <Card className="status-card creating">
            <div className="status-content">
              <LoadingSpinner />
              <span className="status-text">Creating playlist... Please wait.</span>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Search and Filters - Mobile Optimized */}
      <div className="search-filters">
        <div className="search-row">
          <div className="search-bar">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search songs, artists, or tags..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="clear-search-btn"
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              >
                <XMarkIcon className="icon" />
              </Button>
            )}
          </div>
          
          <Button
            variant="outlined"
            size="sm"
            className="filter-toggle-btn"
            onClick={() => setFilters(prev => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }))}
          >
            <FunnelIcon className="icon" />
            Filters
            {(filters.selectedTags.length > 0) && (
              <span className="filter-count">{filters.selectedTags.length}</span>
            )}
          </Button>
        </div>
        
        {/* Advanced Filters */}
        {filters.showAdvancedFilters && (
          <div className="advanced-filters">
            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="filter-section">
                <label className="filter-label">Filter by Tags:</label>
                <div className="tag-filters">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      className={`tag-filter ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleTagFilter(tag)}
                    >
                      <TagIcon className="tag-icon" />
                      {tag}
                      {filters.selectedTags.includes(tag) && (
                        <CheckIcon className="check-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sort Controls */}
            <div className="filter-section">
              <label className="filter-label">Sort Options:</label>
              <div className="sort-controls">
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
              </div>
            </div>
          </div>
        )}
        
        {/* Selection Controls */}
        <div className="selection-controls">
          <Button
            variant="outlined"
            size="sm"
            onClick={handleSelectAll}
            className="select-all-btn"
          >
            <CheckCircleIcon className="icon" />
            {selectedSongs.size === filteredAndSortedSongs.length && filteredAndSortedSongs.length > 0 
              ? 'Deselect All' 
              : 'Select All'
            }
          </Button>
          
          {selectedSongs.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={clearSelection}
              className="clear-selection-btn"
            >
              <XMarkIcon className="icon" />
              Clear Selection ({selectedSongs.size})
            </Button>
          )}
        </div>
      </div>

      {/* Songs Content */}
      <div className="songs-content">
        {/* Loading state */}
        {loading && (
          <div className="master-songs-loading">
            <LoadingSpinner />
            <p className="loading-text">Loading master songs...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="master-songs-error">
            <InformationCircleIcon className="error-icon" />
            <h2 className="error-title">Error Loading Songs</h2>
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* Songs Grid */}
        {!loading && !error && (
          <>
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
              </div>
            ) : (
              <div className="songs-grid">
                {filteredAndSortedSongs.map((song) => (
                  <SongCard key={song.songId} song={song} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MasterSongList;
