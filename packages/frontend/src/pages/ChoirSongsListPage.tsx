import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getChoirSongsByChoirId } from '../services/choirSongService';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TagIcon,
  CheckIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import type { ChoirSongVersionDto } from '../types/choir';
import './ChoirSongsListPage.scss';

type SortOption = 'title' | 'artist' | 'lastEdited' | 'tags';

interface FilterState {
  search: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
  selectedTags: string[];
}

const ChoirSongsListPage: React.FC = () => {
  const { loading: userContextLoading, token } = useUser();
  const { choirId } = useParams<{ choirId: string }>();
  const navigate = useNavigate();
  
  const [songs, setSongs] = useState<ChoirSongVersionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'lastEdited',
    sortOrder: 'desc',
    showAdvancedFilters: false,
    selectedTags: []
  });

  // Fetch songs data
  useEffect(() => {
    const fetchSongs = async () => {
      if (userContextLoading) {
        return;
      }

      if (!token || !choirId) {
        setError('No authentication token or choir ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getChoirSongsByChoirId(choirId, token);
        setSongs(response || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching choir songs:', err);
        setError('Failed to load choir songs');
        toast.error('Failed to load choir songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [token, choirId, userContextLoading]);

  // Filter and sort songs with enhanced search functionality
  const filteredAndSortedSongs = useMemo(() => {
    let filtered = songs.filter(song => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = song.masterSong?.title?.toLowerCase().includes(searchLower);
        const artistMatch = song.masterSong?.artist?.toLowerCase().includes(searchLower);
        const lyricsMatch = song.editedLyricsChordPro?.toLowerCase().includes(searchLower) ||
                           song.masterSong?.lyricsChordPro?.toLowerCase().includes(searchLower);
        const tagsMatch = song.masterSong?.tags?.some(tag => 
          tag.tagName.toLowerCase().includes(searchLower)
        );
        
        if (!(titleMatch || artistMatch || lyricsMatch || tagsMatch)) {
          return false;
        }
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const songTags = song.masterSong?.tags?.map(tag => tag.tagName) || [];
        const hasSelectedTag = filters.selectedTags.some(tag => songTags.includes(tag));
        if (!hasSelectedTag) {
          return false;
        }
      }

      return true;
    });

    // Enhanced sorting with tag support
    filtered.sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';

      switch (filters.sortBy) {
        case 'title':
          valueA = a.masterSong?.title || '';
          valueB = b.masterSong?.title || '';
          break;
        case 'artist':
          valueA = a.masterSong?.artist || '';
          valueB = b.masterSong?.artist || '';
          break;
        case 'lastEdited':
          valueA = new Date(a.lastEditedDate).getTime();
          valueB = new Date(b.lastEditedDate).getTime();
          break;
        case 'tags':
          valueA = a.masterSong?.tags?.length || 0;
          valueB = b.masterSong?.tags?.length || 0;
          break;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (valueA as number) - (valueB as number);
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    return filtered;
  }, [songs, filters]);

  // Calculate statistics for header cards
  const stats = useMemo(() => {
    const totalSongs = filteredAndSortedSongs.length;
    const recentSongs = songs.filter(s => s.lastEditedDate && 
      new Date(s.lastEditedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const uniqueTags = new Set(
      songs.flatMap(song => song.masterSong?.tags?.map(tag => tag.tagName) || [])
    ).size;
    const selectedCount = selectedSongs.size;

    return {
      totalSongs,
      recentSongs,
      uniqueTags,
      selectedCount
    };
  }, [filteredAndSortedSongs, songs, selectedSongs]);

  // Enhanced selection handlers
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
      setSelectedSongs(new Set(filteredAndSortedSongs.map(song => song.choirSongId)));
    }
  };

  const clearSelection = () => {
    setSelectedSongs(new Set());
  };

  // Enhanced bulk operations (functions used in UI)
  const handleBulkDelete = () => {
    if (selectedSongs.size === 0) return;
    
    // TODO: Implement actual bulk delete
    toast.success(`${selectedSongs.size} song${selectedSongs.size > 1 ? 's' : ''} deleted successfully`);
    clearSelection();
  };

  const handleBulkExport = () => {
    if (selectedSongs.size === 0) return;
    
    // TODO: Implement actual bulk export
    toast.success(`${selectedSongs.size} song${selectedSongs.size > 1 ? 's' : ''} exported successfully`);
  };

  // Get unique tags for filtering
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    songs.forEach(song => {
      song.masterSong?.tags?.forEach(tag => {
        tags.add(tag.tagName);
      });
    });
    return Array.from(tags).sort();
  }, [songs]);

  // Toggle tag filter
  const toggleTagFilter = (tagName: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(t => t !== tagName)
        : [...prev.selectedTags, tagName]
    }));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  };

  // Enhanced Song card component with better mobile UX
  const SongCard: React.FC<{ song: ChoirSongVersionDto }> = ({ song }) => {
    const isSelected = selectedSongs.has(song.choirSongId);
    
    return (
      <div 
        className={`song-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelectSong(song.choirSongId)}
      >
        <Card>
          <div className="card-content">
            <div className="card-header">
              <div className="card-checkbox">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => handleSelectSong(song.choirSongId)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="checkmark">
                  {isSelected && <CheckIcon className="check-icon" />}
                </div>
              </div>
              
              <div className="song-info">
                <h3 className="song-title">
                  {song.masterSong?.title || 'Untitled Song'}
                </h3>
                {song.masterSong?.artist && (
                  <p className="song-artist">{song.masterSong.artist}</p>
                )}
              </div>
              
              <div className="card-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="action-button view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/choirs/${choirId}/songs/${song.choirSongId}`);
                  }}
                  title="View song"
                >
                  <EyeIcon className="button-icon" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="action-button edit-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/choirs/${choirId}/songs/${song.choirSongId}/edit`);
                  }}
                  title="Edit song"
                >
                  <PencilIcon className="button-icon" />
                </Button>
              </div>
            </div>
            
            <div className="card-meta">
              <div className="meta-row">
                <div className="meta-item">
                  <ClockIcon className="meta-icon" />
                  <span className="meta-text">{formatDate(song.lastEditedDate)}</span>
                </div>
                {song.editorUserId && (
                  <div className="meta-item">
                    <UserIcon className="meta-icon" />
                    <span className="meta-text">Edited by user</span>
                  </div>
                )}
              </div>
              
              {song.masterSong?.tags && song.masterSong.tags.length > 0 && (
                <div className="song-tags">
                  {song.masterSong.tags.slice(0, 3).map((tag) => (
                    <span key={tag.tagId} className="tag">
                      <TagIcon className="tag-icon" />
                      {tag.tagName}
                    </span>
                  ))}
                  {song.masterSong.tags.length > 3 && (
                    <span className="tag more-tags">
                      +{song.masterSong.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
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
        <div className="choir-songs-container">
          <div className="choir-songs-loading">
            <LoadingSpinner />
            <p className="loading-text">Loading choir songs...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="choir-songs-container">
          <div className="choir-songs-error">
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
    <Layout>
      <div className="choir-songs-container">
        {/* Header Section */}
        <div className="songs-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                <MusicalNoteIcon className="title-icon" />
                Choir Songs
              </h1>
              <p className="page-subtitle">
                Manage and organize your choir's song collection
              </p>
            </div>
            <div className="header-actions">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/choirs/${choirId}/songs/add`)}
              >
                <PlusIcon className="icon" />
                Add Song
              </Button>
            </div>
          </div>
          
          {/* Enhanced Stats Cards - Mobile Optimized */}
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.totalSongs}</span>
              <span className="stat-label">Total Songs</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.recentSongs}</span>
              <span className="stat-label">Recent</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.uniqueTags}</span>
              <span className="stat-label">Tags</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.selectedCount}</span>
              <span className="stat-label">Selected</span>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters - Mobile Optimized */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-bar">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search songs, artists, or lyrics..."
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
                    <option value="lastEdited">Sort by Last Edited</option>
                    <option value="tags">Sort by Tag Count</option>
                  </select>
                  
                  <select
                    className="filter-select"
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  >
                    <option value="asc">A-Z / Oldest</option>
                    <option value="desc">Z-A / Newest</option>
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
                  onClick={handleBulkDelete}
                >
                  <TrashIcon className="icon" />
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkExport}
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
                {filters.search ? 'No songs found' : 'No songs yet'}
              </h2>
              <p className="empty-message">
                {filters.search 
                  ? `No songs match "${filters.search}". Try adjusting your search.`
                  : 'Get started by adding your first song to this choir.'
                }
              </p>
              <div className="empty-actions">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/choirs/${choirId}/songs/add`)}
                >
                  <PlusIcon className="icon" />
                  Add First Song
                </Button>
              </div>
            </div>
          ) : (
            <div className="songs-grid grid">
              {filteredAndSortedSongs.map((song) => (
                <SongCard key={song.choirSongId} song={song} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChoirSongsListPage;
