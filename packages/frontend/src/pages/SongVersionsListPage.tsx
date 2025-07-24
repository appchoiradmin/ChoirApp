import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { getSongsForChoir } from '../services/songService';
import { Button, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TagIcon,
  CheckIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { SongDto } from '../types/song';
import './SongVersionsListPage.scss';

type SortOption = 'title' | 'artist' | 'createdAt' | 'tags';

interface FilterState {
  search: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
  selectedTags: string[];
}

const SongVersionsListPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading: userContextLoading, token } = useUser();
  const { choirId } = useParams<{ choirId: string }>();
  const navigate = useNavigate();
  
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'createdAt',
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
        setError(t('errors.unauthorized'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getSongsForChoir(choirId, token);
        setSongs(response || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching song versions:', err);
        setError(t('songs.failedToLoadSongVersions'));
        toast.error(t('songs.failedToLoadSongVersions'));
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
        const titleMatch = song.title?.toLowerCase().includes(searchLower);
        const artistMatch = song.artist?.toLowerCase().includes(searchLower);
        const lyricsMatch = song.content?.toLowerCase().includes(searchLower);
        const tagsMatch = song.tags?.some(tag => 
          tag.tagName.toLowerCase().includes(searchLower)
        );
        
        if (!(titleMatch || artistMatch || lyricsMatch || tagsMatch)) {
          return false;
        }
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const songTags = song.tags?.map(tag => tag.tagName) || [];
        const hasSelectedTag = filters.selectedTags.some(selectedTag => 
          songTags.includes(selectedTag)
        );
        
        if (!hasSelectedTag) {
          return false;
        }
      }

      return true;
    });

    // Sort songs
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'artist':
          const artistA = a.artist || '';
          const artistB = b.artist || '';
          comparison = artistA.localeCompare(artistB);
          break;
        case 'createdAt':
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          comparison = dateA - dateB;
          break;
        case 'tags':
          const tagsA = a.tags?.length || 0;
          const tagsB = b.tags?.length || 0;
          comparison = tagsA - tagsB;
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [songs, filters]);

  // Get all unique tags from songs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    songs.forEach(song => {
      song.tags?.forEach(tag => {
        tagSet.add(tag.tagName);
      });
    });
    
    return Array.from(tagSet).sort();
  }, [songs]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  // Clear search
  const handleClearSearch = () => {
    setFilters(prev => ({ ...prev, search: '' }));
  };

  // Toggle advanced filters
  const handleToggleFilters = () => {
    setFilters(prev => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }));
  };

  // Handle sort change
  const handleSortChange = (sortBy: SortOption) => {
    setFilters(prev => {
      if (prev.sortBy === sortBy) {
        // Toggle sort order if clicking the same sort option
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      } else {
        // Default to descending order for new sort option
        return { ...prev, sortBy, sortOrder: 'desc' };
      }
    });
  };

  // Toggle tag selection
  const handleTagToggle = (tagName: string) => {
    setFilters(prev => {
      const isSelected = prev.selectedTags.includes(tagName);
      
      if (isSelected) {
        return {
          ...prev,
          selectedTags: prev.selectedTags.filter(tag => tag !== tagName)
        };
      } else {
        return {
          ...prev,
          selectedTags: [...prev.selectedTags, tagName]
        };
      }
    });
  };

  // Toggle song selection
  const handleSongSelect = (songId: string) => {
    setSelectedSongs(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(songId)) {
        newSelection.delete(songId);
      } else {
        newSelection.add(songId);
      }
      return newSelection;
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedSongs.size === filteredAndSortedSongs.length) {
      // If all songs are selected, deselect all
      setSelectedSongs(new Set());
    } else {
      // Otherwise, select all filtered songs
      const newSelected = new Set<string>();
      filteredAndSortedSongs.forEach(song => {
        newSelected.add(song.songId);
      });
      setSelectedSongs(newSelected);
    }
  };
  
  // Bulk selection functionality
  const handleBulkSelection = () => {
    // Select all filtered songs
    if (selectedSongs.size !== filteredAndSortedSongs.length) {
      setSelectedSongs(new Set(filteredAndSortedSongs.map(song => song.songId)));
    } else {
      // Deselect all if all are selected
      setSelectedSongs(new Set());
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      showAdvancedFilters: false,
      selectedTags: []
    });
  };

  // Navigate to create new song version
  const handleCreateSong = () => {
    navigate(`/choirs/${choirId}/create-song`);
  };

  // Navigate to edit song
  const handleEditSong = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/choirs/${choirId}/songs/${songId}/edit`);
  };

  // Navigate to view song
  const handleViewSong = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/choirs/${choirId}/songs/${songId}`);
  };

  // Handle song card click
  const handleSongCardClick = (songId: string) => {
    navigate(`/choirs/${choirId}/songs/${songId}`);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedSongs.size === 0) return;
    
    const confirmDelete = window.confirm(
      t('songs.confirmDeleteSongs', { count: selectedSongs.size })
    );
    
    if (confirmDelete) {
      try {
        // TODO: Implement actual delete API call
        // const deletePromises = Array.from(selectedSongs).map(id => 
        //   deleteSongVersion(id, token)
        // );
        // await Promise.all(deletePromises);
        
        toast.success(t('songs.songsDeletedSuccess', { count: selectedSongs.size }));
        setSelectedSongs(new Set());
        
        // Refresh song list
        const updatedSongs = songs.filter(song => !selectedSongs.has(song.songId));
        setSongs(updatedSongs);
      } catch (err) {
        console.error('Error deleting song versions:', err);
        toast.error(t('songs.errorDeletingSongs'));
        toast.error(t('songs.errorDeletingSongs'));
      }
    }
  };
  
  // Handle bulk export
  const handleBulkExport = () => {
    if (selectedSongs.size === 0) return;
    
    try {
      const selectedSongsData = songs
        .filter(song => selectedSongs.has(song.songId))
        .map(song => ({
          title: song.title,
          artist: song.artist || '',
          content: song.content,
          tags: song.tags?.map(tag => tag.tagName) || []
        }));
      
      // Create a JSON blob and download it
      const blob = new Blob([JSON.stringify(selectedSongsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `choir-songs-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(t('songs.exportSuccess', { count: selectedSongs.size }));
    } catch (err) {
      console.error('Error exporting song versions:', err);
      toast.error(t('songs.exportError'));
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Delete selected songs
  const handleDeleteSelected = () => {
    if (selectedSongs.size === 0) return;
    
    if (window.confirm(t('songs.deleteConfirmation', { count: selectedSongs.size }))) {
      // Implement delete functionality here
      toast.success(t('songs.deleteSuccess', { count: selectedSongs.size }));
      setSelectedSongs(new Set());
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Layout>
        <div className="song-versions-loading">
          <LoadingSpinner size="lg" />
          <p className="loading-text">{t('songs.loadingSongVersions')}</p>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout>
        <div className="song-versions-error">
          <InformationCircleIcon className="error-icon" />
          <h2 className="error-title">{t('songs.somethingWentWrong')}</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
            >
              {t('songs.tryAgain')}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/choirs/${choirId}`)}
            >
              {t('songs.backToChoir')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="song-versions-container">
        {/* Header */}
        <div className="songs-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">{t('songs.songs')}</h1>
              <p className="page-subtitle">
                {t('songs.songsAvailable', { count: filteredAndSortedSongs.length })}
              </p>
            </div>
            
            <div className="header-actions">
              <Button 
                variant="primary" 
                onClick={handleCreateSong}
                leftIcon={<PlusIcon className="button-icon" />}
                className="mr-2"
              >
                {t('songs.newSong')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleBulkSelection}
              >
                {selectedSongs.size === filteredAndSortedSongs.length ? t('songs.deselectAll') : t('common.selectAll')}
              </Button>
          </div>
          
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
                ? t('songs.deselectAllButton') 
                : t('songs.selectAllButton')
              }
            </Button>
              </div>
              
              {/* Search input */}
              <div className="search-container">
                <div className="search-input-wrapper">
                  <MagnifyingGlassIcon className="search-icon" />
                  <input
                    type="text"
                    placeholder={t('songs.searchSongsPlaceholder')}
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="search-input"
                  />
                  {filters.search && (
                    <button
                      className="clear-search-button"
                      onClick={handleClearSearch}
                      aria-label={t('songs.clearSearch')}
                    >
                      <XMarkIcon className="clear-icon" />
                    </button>
                  )}
                </div>
              </div>
              
              <button 
                className="filter-toggle" 
                onClick={handleToggleFilters}
              >
                <FunnelIcon className="filter-icon" />
                {filters.showAdvancedFilters ? t('songs.hideFilters') : t('songs.showFilters')}
              </button>
            </div>
            
            {filters.showAdvancedFilters && (
              <div className="advanced-filters">
                <div className="filter-section">
                  <h3 className="filter-title">{t('songs.sortByLabel')}</h3>
                  <div className="sort-options">
                    <button 
                      className={`sort-option ${filters.sortBy === 'title' ? 'active' : ''}`}
                      onClick={() => handleSortChange('title')}
                    >
                      {t('songs.titleSort')}
                      {filters.sortBy === 'title' && (
                        <span className="sort-direction">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                    <button 
                      className={`sort-option ${filters.sortBy === 'artist' ? 'active' : ''}`}
                      onClick={() => handleSortChange('artist')}
                    >
                      {t('songs.artistSort')}
                      {filters.sortBy === 'artist' && (
                        <span className="sort-direction">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                    <button 
                      className={`sort-option ${filters.sortBy === 'createdAt' ? 'active' : ''}`}
                      onClick={() => handleSortChange('createdAt')}
                    >
                      {t('songs.dateSort')}
                      {filters.sortBy === 'createdAt' && (
                        <span className="sort-direction">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                    <button 
                      className={`sort-option ${filters.sortBy === 'tags' ? 'active' : ''}`}
                      onClick={() => handleSortChange('tags')}
                    >
                      {t('songs.tagsSort')}
                      {filters.sortBy === 'tags' && (
                        <span className="sort-direction">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                {allTags.length > 0 && (
                  <div className="filter-section">
                    <h3 className="filter-title">{t('songs.filterByTagsLabel')}</h3>
                    <div className="tag-filters">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          className={`tag-filter ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
                          onClick={() => handleTagToggle(tag)}
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
                
                <div className="filter-actions">
                  <Button 
                    variant="outlined" 
                    onClick={handleClearFilters}
                    disabled={!filters.search && filters.selectedTags.length === 0 && filters.sortBy === 'createdAt'}
                  >
                    {t('songs.clearAllFilters')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedSongs.size > 0 && (
          <div className="bulk-actions">
            <div className="selection-info">
              <CheckCircleIcon className="selection-icon" />
              <span className="selection-count">{selectedSongs.size}</span> 
              {t('songs.songsSelected', { count: selectedSongs.size })}
            </div>
            
            <div className="action-buttons">
              <Button 
                variant="primary" 
                onClick={handleDeleteSelected}
                leftIcon={<TrashIcon className="button-icon" />}
              >
                {t('songs.deleteSelected')}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => setSelectedSongs(new Set())}
              >
                {t('songs.clearSelection')}
              </Button>
            </div>
          </div>
        )}
        
        {/* Bulk Actions Bar - Mobile Optimized */}
        {selectedSongs.size > 0 && (
          <div className="bulk-actions">
            <div className="bulk-info">
              <CheckCircleIcon className="bulk-icon" />
              <span className="bulk-count">
                {t('songs.songsSelected', { count: selectedSongs.size })}
              </span>
            </div>
            <div className="bulk-buttons">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDelete}
              >
                <TrashIcon className="icon" />
                {t('songs.delete')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkExport}
              >
                <DocumentTextIcon className="icon" />
                {t('songs.exportSelected')}
              </Button>
            </div>
          </div>
        )}
        
        {/* Songs Grid */}
        {filteredAndSortedSongs.length > 0 ? (
          <div className="songs-grid">
            {filteredAndSortedSongs.map(song => (
              <div 
                key={song.songId} 
                className={`song-card ${selectedSongs.has(song.songId) ? 'selected' : ''}`}
                onClick={() => handleSongCardClick(song.songId)}
              >
                <div 
                  className="card-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSongSelect(song.songId);
                  }}
                >
                  <div className={`checkbox-container ${selectedSongs.has(song.songId) ? 'selected' : ''}`}>
                    {selectedSongs.has(song.songId) && (
                      <CheckIcon className="check-icon" />
                    )}
                  </div>
                </div>
                
                <div className="card-content">
                  <h3 className="song-title">{song.title}</h3>
                  {song.artist && (
                    <p className="song-artist">{t('songs.songBy', { artist: song.artist })}</p>
                  )}
                  
                  {song.tags && song.tags.length > 0 && (
                    <div className="song-tags">
                      {song.tags.map(tag => (
                        <span key={tag.tagId} className="tag">
                          <TagIcon className="tag-icon" />
                          {tag.tagName}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="song-meta">
                    <div className="meta-left">
                      <span className="last-edited">
                        <ClockIcon className="time-icon" />
                        {formatDate(song.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="action-button edit"
                    onClick={(e) => handleEditSong(song.songId, e)}
                    aria-label={t('songs.editSongAriaLabel')}
                  >
                    <PencilIcon className="action-icon" />
                  </button>
                  
                  <button 
                    className="action-button view"
                    onClick={(e) => handleViewSong(song.songId, e)}
                    aria-label={t('songs.viewSongAriaLabel')}
                  >
                    <EyeIcon className="action-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <img 
              src="/icons/icon-96x96.png" 
              alt="ChoirApp" 
              className="empty-icon"
              style={{ 
                width: '64px', 
                height: '64px',
                opacity: 0.6,
                filter: 'grayscale(0.3)'
              }}
            />
            <h2 className="empty-title">{t('songs.noSongsFoundTitle')}</h2>
            <p className="empty-message">
              {filters.search || filters.selectedTags.length > 0 
                ? t('songs.noSongsMatchFilters')
                : t('songs.noSongsInChoir')}
            </p>
            {(filters.search || filters.selectedTags.length > 0) ? (
              <Button variant="secondary" onClick={handleClearFilters}>
                {t('songs.clearFiltersButton')}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreateSong} leftIcon={<PlusIcon className="button-icon" />}>
                {t('songs.createSongButton')}
              </Button>
            )}
          </div>
        )}
      </Layout>
    );
};

export default SongVersionsListPage;
