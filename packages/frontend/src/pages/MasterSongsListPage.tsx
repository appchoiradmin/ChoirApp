import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMasterSongs } from '../services/masterSongService';
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
import './MasterSongsListPage.enhanced.scss';

type SortOption = 'title' | 'artist' | 'tags';

interface FilterState {
  search: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

const MasterSongsListPage: React.FC<{}> = () => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();
  const { sections, selectedTemplate, playlistId, refreshPlaylist, setSelectedTemplate } = usePlaylistContext();
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  const { token, user } = useUser();
  const isGeneralUser = !user?.choirId;

  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  
  // Infinite scroll state
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const songsPerPage = 12;
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
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

  // Initial fetch for first page of songs
  useEffect(() => {
    const fetchInitialSongs = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const templatesData = user?.choirId ? 
          await getPlaylistTemplatesByChoirId(user.choirId, token) : 
          [];
        
        const songsData = await searchMasterSongs({
          skip: 0,
          take: songsPerPage
        }, token);
        
        setSongs(songsData || []);
        setAvailableTemplates(templatesData || []);
        setPage(1); // We've loaded the first page
        setHasMore(songsData.length === songsPerPage); // If we got fewer songs than requested, there are no more
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialSongs();
    
    // Add scroll event listener for back to top button
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    
    // Call it once to set initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [token, user?.choirId, songsPerPage]);

  // Apply filters and sorting - for search functionality only
  // We don't filter or sort the loaded songs since we're using infinite scroll
  const handleFilteredSearch = () => {
    // Reset pagination and fetch with new filters
    setPage(0);
    setSongs([]);
    setHasMore(true);
    setLoading(true);
    
    const fetchFilteredSongs = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      
      try {
        // Use search parameters if any are set
        const searchParams: any = {
          skip: 0,
          take: songsPerPage
        };
        
        if (filters.search) {
          searchParams.title = filters.search;
          searchParams.artist = filters.search;
          // We can also search by tag if needed
          searchParams.tag = filters.search;
        }
        
        const songsData = await searchMasterSongs(searchParams, token);
        setSongs(songsData || []);
        setPage(1);
        setHasMore(songsData.length === songsPerPage);
      } catch (err) {
        console.error('Error searching songs:', err);
        toast.error('Failed to search songs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilteredSongs();
  };
  
  // Handle back to top button click
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Don't set up observer if we're still loading initial songs
    if (loading) return undefined;
    
    let timeoutId: number | null = null;
    
    // Create a new observer with a very small threshold to only trigger when close to the element
    const observer = new IntersectionObserver(
      (entries) => {
        // Only proceed if we have entries and we're not already loading
        if (entries.length === 0 || loadingMore || !hasMore) return;
        
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Debounce the load more call to prevent multiple rapid calls
          if (timeoutId) window.clearTimeout(timeoutId);
          
          timeoutId = window.setTimeout(() => {
            // Only load more if we're not already loading and there are more to load
            if (!loadingMore && hasMore) {
              loadMoreSongs();
            }
          }, 300); // Small delay to prevent multiple triggers
        }
      },
      // Use a very small threshold with minimal rootMargin to only trigger when element is visible
      { threshold: 0.1, rootMargin: '100px' }
    );

    // Get the current loader reference
    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    // Clean up the observer and any timeouts when the component unmounts
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, loadingMore, loading, loaderRef.current]);
  
  // Function to load more songs
  const loadMoreSongs = async () => {
    if (!token || !hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      // Store current scroll position before loading more
      const scrollPositionBeforeLoad = window.scrollY;
      
      // Use current page value
      const skip = page * songsPerPage;
      
      // Use search parameters if any are set
      const searchParams: any = {
        skip,
        take: songsPerPage
      };
      
      if (filters.search) {
        searchParams.title = filters.search;
        searchParams.artist = filters.search;
        searchParams.tag = filters.search;
      }
      
      const newSongs = await searchMasterSongs(searchParams, token);
      
      if (newSongs.length === 0 || newSongs.length < songsPerPage) {
        setHasMore(false);
      }
      
      // Only add new songs if we got any
      if (newSongs.length > 0) {
        setSongs(prevSongs => [...prevSongs, ...newSongs]);
        // Increment page counter after successful fetch
        setPage(page + 1);
        
        // Use requestAnimationFrame to restore scroll position after DOM update
        window.requestAnimationFrame(() => {
          // Add a small delay to ensure DOM has updated
          setTimeout(() => {
            // Restore scroll position to prevent auto-scrolling
            window.scrollTo({
              top: scrollPositionBeforeLoad,
              behavior: 'auto' // Use 'auto' to avoid smooth scrolling here
            });
          }, 10);
        });
      }
    } catch (err) {
      console.error('Error loading more songs:', err);
      toast.error('Failed to load more songs');
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    // Use the handleFilteredSearch function to reset and search
    handleFilteredSearch();
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
    if (selectedSongs.size === songs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(songs.map(song => song.songId)));
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

              {/* Hide Add to Playlist for general users */}
              {!isGeneralUser && (
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
        <div className="master-songs-container">
          <div className="master-songs-loading">
            <LoadingSpinner />
            <p className="loading-text">Loading master songs...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state (improved for general users)
  if (error) {
    let errorTitle = "Error Loading Songs";
    let errorMessage = error;
    let showTryAgain = true;
    // If the error is about authentication, show a friendlier message
    if (error.toLowerCase().includes("authentication token")) {
      errorTitle = "Not Signed In";
      errorMessage = "You must be signed in to view the master songs library. Please log in and try again.";
      showTryAgain = false;
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
          <div className="master-songs-error">
            <InformationCircleIcon className="error-icon" />
            <h2 className="error-title">{errorTitle}</h2>
            <p className="error-message">{errorMessage}</p>
            <div className="error-actions">
              {showTryAgain && (
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              )}
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
                {isGeneralUser ? 'Browse the master song library' : 'Browse and manage the master song library'}
              </p>
            </div>
            <div className="header-actions">
              {!isGeneralUser && (
                <>
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
                </>
              )}
            </div>
          </div>
          
          {/* Stats Cards - Mobile Optimized - Only shown for choir members */}
          {!isGeneralUser && (
            <div className="header-stats">
              <div className="stat-card">
                <span className="stat-number">{songs.length}</span>
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
          )}
          {isGeneralUser && (
            <div className="header-stats simple">
              <div className="stat-card">
                <span className="stat-number">{songs.length}</span>
                <span className="stat-label">Total Songs</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Playlist Building Status Bar - Only shown for choir members */}
        {!isGeneralUser && (
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
        )}

        {/* Enhanced Playlist Building Guide - Only shown for choir members */}
        {!isGeneralUser && displayedSections.length > 0 && (
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

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search songs..."
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
              {isGeneralUser ? (
                <>
                  <MagnifyingGlassIcon className="icon" />
                  <span className="sr-only">Search</span>
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
          
          <div className="filter-controls enhanced">
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
            
            {!isGeneralUser && (
              <>
                <Button
                  variant={selectedSongs.size > 0 ? "primary" : "secondary"}
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedSongs.size === 0}
                  className="clear-button"
                >
                  <XMarkIcon className="icon" />
                  Clear ({selectedSongs.size})
                </Button>
                
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleSelectAll}
                  className="select-all-button"
                >
                  <CheckCircleIcon className="icon" />
                  {selectedSongs.size === songs.length ? 'Deselect All' : 'Select All'}
                </Button>
              </>
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
          {songs.length === 0 ? (
            <div className="empty-state">
              <MusicalNoteIcon className="empty-icon" />
              <h2 className="empty-title">
                {filters.search ? 'No songs found' : 'No master songs yet'}
              </h2>
              <p className="empty-message">
                {filters.search 
                  ? `No songs match "${filters.search}". Try adjusting your search.`
                  : isGeneralUser ? 'There are no master songs available yet.' : 'Get started by creating your first master song.'
                }
              </p>
              {!isGeneralUser && (
                <div className="empty-actions">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/master-songs/create')}
                  >
                    <PlusIcon className="icon" />
                    Create First Song
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="songs-grid">
              {songs.map((song) => (
                <SongCard key={song.songId} song={song} />
              ))}
              
              {/* Infinite scroll loader - always visible with sufficient height for mobile */}
              <div 
                ref={loaderRef} 
                className="loader-container" 
                style={{ 
                  minHeight: '80px', 
                  marginTop: '20px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '20px 0'
                }}
              >
                {loadingMore && (
                  <div className="loader">
                    <LoadingSpinner />
                    <span style={{ marginTop: '10px' }}>Loading more songs...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Back to top button - with inline styles for guaranteed visibility on mobile */}
      {showBackToTop && (
        <button 
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '1rem',
            backgroundColor: '#4a69bd',
            color: 'white',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            border: 'none',
            transition: 'transform 0.2s ease',
            transform: 'scale(1)',
            opacity: 0.9,
            touchAction: 'manipulation'
          }}
          onMouseOver={(e) => {
            const target = e.currentTarget;
            target.style.transform = 'scale(1.1)';
            target.style.opacity = '1';
          }}
          onMouseOut={(e) => {
            const target = e.currentTarget;
            target.style.transform = 'scale(1)';
            target.style.opacity = '0.9';
          }}
        >
          <ChevronUpIcon style={{ width: '2rem', height: '2rem' }} />
        </button>
      )}
    </Layout>
  );

};

export default MasterSongsListPage;
