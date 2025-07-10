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
  TagIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import type { ChoirSongVersionDto } from '../types/choir';
import './ChoirSongsListPage.scss';

type SortOption = 'title' | 'artist' | 'lastEdited';

interface FilterState {
  search: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  showFilters: boolean;
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
    showFilters: false
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

  // Filter and sort songs
  const filteredAndSortedSongs = useMemo(() => {
    let filtered = songs.filter(song => {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = song.masterSong?.title?.toLowerCase().includes(searchLower);
      const artistMatch = song.masterSong?.artist?.toLowerCase().includes(searchLower);
      const lyricsMatch = song.editedLyricsChordPro?.toLowerCase().includes(searchLower) ||
                         song.masterSong?.lyricsChordPro?.toLowerCase().includes(searchLower);
      
      return titleMatch || artistMatch || lyricsMatch;
    });

    filtered.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

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
      setSelectedSongs(new Set(filteredAndSortedSongs.map(song => song.choirSongId)));
    }
  };

  const clearSelection = () => {
    setSelectedSongs(new Set());
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

  // Song card component
  const SongCard: React.FC<{ song: ChoirSongVersionDto }> = ({ song }) => {
    const isSelected = selectedSongs.has(song.choirSongId);
    
    return (
      <div 
        className={`song-card ${isSelected ? 'is-selected' : ''}`}
        onClick={() => handleSelectSong(song.choirSongId)}
      >
        <Card>
          <div className="card-content">
            <div className="song-header">
              <div className="song-info">
                <h3 className="song-title">
                  {song.masterSong?.title || 'Untitled Song'}
                </h3>
                {song.masterSong?.artist && (
                  <p className="song-artist">{song.masterSong.artist}</p>
                )}
                <div className="song-meta">
                  <div className="meta-item">
                    <ClockIcon className="icon" />
                    <span>{formatDate(song.lastEditedDate)}</span>
                  </div>
                  {song.editorUserId && (
                    <div className="meta-item">
                      <UserIcon className="icon" />
                      <span>Edited</span>
                    </div>
                  )}
                  {song.masterSong?.tags && song.masterSong.tags.length > 0 && (
                    <div className="meta-item">
                      <TagIcon className="icon" />
                      <span>{song.masterSong.tags.length} tags</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="song-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/choirs/${choirId}/songs/${song.choirSongId}`);
                  }}
                  title="View song"
                >
                  <EyeIcon className="icon" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/choirs/${choirId}/songs/${song.choirSongId}/edit`);
                  }}
                  title="Edit song"
                >
                  <PencilIcon className="icon" />
                </Button>
              </div>
            </div>
            
            {song.masterSong?.tags && song.masterSong.tags.length > 0 && (
              <div className="song-tags">
                {song.masterSong.tags.slice(0, 3).map((tag) => (
                  <span key={tag.tagId} className="tag">
                    {tag.tagName}
                  </span>
                ))}
                {song.masterSong.tags.length > 3 && (
                  <span className="tag">+{song.masterSong.tags.length - 3} more</span>
                )}
              </div>
            )}
            
            {isSelected && (
              <div className="selection-indicator">
                <CheckIconSolid className="check-icon" />
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="choir-songs-page">
          <div className="loading-overlay">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="choir-songs-page">
          <div className="empty-state">
            <InformationCircleIcon className="empty-icon" />
            <h2 className="empty-title">Error Loading Songs</h2>
            <p className="empty-message">{error}</p>
            <div className="empty-action">
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
      <div className="choir-songs-page">
        {/* Mobile-First Header */}
        <div className="page-header">
          <div className="header-main">
            <h1 className="page-title">
              <MusicalNoteIcon className="title-icon" />
              Choir Songs
            </h1>
            <Button
              variant="primary"
              size="sm"
              className="add-song-btn"
              onClick={() => navigate(`/choirs/${choirId}/songs/add`)}
            >
              <PlusIcon className="icon" />
              <span className="btn-text">Add Song</span>
            </Button>
          </div>
          
          {/* Stats Cards - Mobile Optimized */}
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{filteredAndSortedSongs.length}</span>
              <span className="stat-label">Total Songs</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {songs.filter(s => s.lastEditedDate && 
                  new Date(s.lastEditedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </span>
              <span className="stat-label">Recent</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{availableTags.length}</span>
              <span className="stat-label">Tags</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{selectedSongs.size}</span>
              <span className="stat-label">Selected</span>
            </div>
          </div>
        </div>

        {/* Mobile-First Search & Filters */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-input">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                className="input"
                placeholder="Search songs, artists, or lyrics..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="filter-row">
            <div className="select">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SortOption }))}
              >
                <option value="title">Sort by Title</option>
                <option value="artist">Sort by Artist</option>
                <option value="lastEdited">Sort by Last Edited</option>
              </select>
            </div>
            
            <div className="select">
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
              >
                <option value="asc">A-Z / Oldest</option>
                <option value="desc">Z-A / Newest</option>
              </select>
            </div>
          </div>
          
          <div className="action-buttons">
            <Button
              variant={selectedSongs.size > 0 ? "primary" : "secondary"}
              size="sm"
              onClick={clearSelection}
              disabled={selectedSongs.size === 0}
            >
              <XMarkIcon className="icon" />
              Clear Selection
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
            <div className="empty-action">
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
          <div className="songs-grid">
            {filteredAndSortedSongs.map((song) => (
              <SongCard key={song.choirSongId} song={song} />
            ))}
          </div>
        )}

        {/* Bulk Actions Bar - Mobile Optimized */}
        {selectedSongs.size > 0 && (
          <div className="bulk-actions">
            <div className="actions-content">
              <div className="selection-info">
                {selectedSongs.size} song{selectedSongs.size !== 1 ? 's' : ''} selected
              </div>
              <div className="action-buttons">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement bulk delete
                    toast.success(`${selectedSongs.size} songs deleted`);
                    setSelectedSongs(new Set());
                  }}
                >
                  <TrashIcon className="icon" />
                  Delete
                </Button>
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChoirSongsListPage;
