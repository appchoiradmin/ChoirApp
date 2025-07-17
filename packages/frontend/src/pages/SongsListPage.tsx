import React, { useState, useEffect, useRef, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchSongs } from '../services/songService';
import { addSongToPlaylist, getPlaylistTemplatesByChoirId, getPlaylistsByChoirId } from '../services/playlistService';
import { useUser } from '../hooks/useUser';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import { usePlaylistContext } from '../context/PlaylistContext';
import { toast } from 'react-hot-toast';
import { PlaylistTemplate } from '../types/playlist';
import { SongDto, SongSearchParams, SongVisibilityType } from '../types/song';
import { Button, Card, LoadingSpinner, Navigation } from '../components/ui';
import Layout from '../components/ui/Layout';
import { MagnifyingGlassIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, XMarkIcon, CheckIcon, DocumentTextIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import './SongsListPage.scss';
import './SongsListPage.enhanced.scss';

interface SongsListPageProps {
  playlistId?: string;
  refreshPlaylist?: () => void;
}

interface FilterState {
  search: string;
  sortBy: 'title' | 'artist' | 'tags';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_SONGS_PER_PAGE = 12;

// Detect if we're on mobile
const isMobile = window.innerWidth < 768;

// Adjust songs per page for mobile
const songsPerPage = isMobile ? 6 : DEFAULT_SONGS_PER_PAGE;

const SongsListPage: FC<SongsListPageProps> = ({ playlistId, refreshPlaylist }) => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();
  const { sections, selectedTemplate, setSelectedTemplate } = usePlaylistContext();
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  const { token, user } = useUser();
  const isGeneralUser = !user?.choirId;

  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  
  // Infinite scroll state
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [availableTemplates, setAvailableTemplates] = useState<PlaylistTemplate[]>([]);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState<boolean>(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(playlistId || null);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [isAddingSongs, setIsAddingSongs] = useState<boolean>(false);
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
      try {
        setLoading(true);
        // Use token from the useUser hook
        // No need to create a separate variable
        
        // Prepare search parameters
        const searchParams: SongSearchParams = {
          searchTerm: filters.search || '', // Empty string is now handled by backend
          skip: 0,
          take: songsPerPage,
          visibility: SongVisibilityType.PublicAll
        };
        
        // Add title/artist search if we have a search term
        if (filters.search) {
          searchParams.title = filters.search;
          searchParams.artist = filters.search;
        }
        
        const fetchedSongs = await searchSongs(searchParams, token || '');
        
        setSongs(fetchedSongs || []);
        setHasMore(fetchedSongs.length === songsPerPage);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load songs. Please try again later.');
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
  }, [token, user?.choirId, songsPerPage, filters.search]);

  // Apply filters and sorting - for search functionality only
  // We don't filter or sort the loaded songs since we're using infinite scroll
  const handleFilteredSearch = async () => {
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
        // Prepare search parameters
        const searchParams: SongSearchParams = {
          searchTerm: filters.search || '', // Empty string is now handled by backend
          skip: 0,
          take: songsPerPage,
          visibility: SongVisibilityType.PublicAll
        };
        
        // Add title/artist search if we have a search term
        if (filters.search) {
          searchParams.title = filters.search;
          searchParams.artist = filters.search;
        }
        
        const songsData = await searchSongs(searchParams, token || '');
        setSongs(songsData || []);
        setPage(1);
        setHasMore(songsData.length === songsPerPage);
      } catch (error) {
        console.error('Error searching songs:', error);
        setError('Failed to search songs. Please try again later.');
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
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && hasMore && !loadingMore) {
          // Add a small delay to prevent multiple triggers
          if (timeoutId) window.clearTimeout(timeoutId);
          
          timeoutId = window.setTimeout(() => {
            loadMoreSongs();
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading]);
  
  // Load more songs for infinite scroll
  const loadMoreSongs = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      // Prepare search parameters
      const searchParams: SongSearchParams = {
        searchTerm: filters.search || '', // Empty string is now handled by backend
        skip: page * songsPerPage,
        take: songsPerPage,
        visibility: SongVisibilityType.PublicAll
      };
      
      // Add title/artist search if we have a search term
      if (filters.search) {
        searchParams.title = filters.search;
        searchParams.artist = filters.search;
      }
      
      const moreSongs = await searchSongs(searchParams, token || '');
      
      if (moreSongs.length === 0) {
        setHasMore(false);
      } else {
        setSongs(prev => [...prev, ...moreSongs]);
        setPage(prev => prev + 1);
        setHasMore(moreSongs.length === songsPerPage);
      }
    } catch (error) {
      console.error('Error loading more songs:', error);
      setError('Failed to load more songs. Please try again later.');
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Toggle song selection
  const toggleSongSelection = (songId: string) => {
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
  
  // Add selected songs to a playlist section
  const handleAddToSection = async (sectionId: string) => {
    // Get the active choir ID - either from user context or the first choir in the list
    const activeChoirId = user?.choirId || (user?.choirs && user.choirs.length > 0 ? user.choirs[0].id : null);
    
    if (!token || !activeChoirId) {
      toast.error('You must be logged in and in a choir context to add songs to a playlist');
      return;
    }
    
    if (!activePlaylistId && !playlistId) {
      toast.error('No active playlist available');
      return;
    }
    
    const targetPlaylistId = playlistId || activePlaylistId;
    
    try {
      setIsAddingSongs(true);
      
      // Add each selected song to the playlist section
      const promises = Array.from(selectedSongs).map(songId =>
        addSongToPlaylist(targetPlaylistId!, { songId, sectionId }, token)
      );
      
      await Promise.all(promises);
      toast.success(`Added ${selectedSongs.size} song(s) to playlist`);
      
      // Clear selection after adding
      setSelectedSongs(new Set());
      
      // Refresh the playlist to show the new songs
      if (refreshPlaylist) {
        refreshPlaylist();
      }
      
      // Close all dropdowns
      setDropdownOpen(null);
    } catch (err) {
      console.error('Error adding songs to playlist:', err);
      toast.error('Failed to add songs to playlist');
    } finally {
      setIsAddingSongs(false);
    }
  };
  
  // Load available templates and active playlist
  useEffect(() => {
    const fetchData = async () => {
      // Get the active choir ID - either from user context or the first choir in the list
      const activeChoirId = user?.choirId || (user?.choirs && user.choirs.length > 0 ? user.choirs[0].id : null);
      
      if (token && activeChoirId) {
        setIsLoadingPlaylists(true);
        try {
          // Fetch templates
          const templates = await getPlaylistTemplatesByChoirId(activeChoirId, token);
          setAvailableTemplates(templates);
          
          // If we don't have a playlistId from props, try to find the most recent playlist
          if (!playlistId) {
            const playlists = await getPlaylistsByChoirId(activeChoirId, token);
            if (playlists && playlists.length > 0) {
              // Sort by date (newest first) and take the first one
              const sortedPlaylists = [...playlists].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA;
              });
              
              setActivePlaylistId(sortedPlaylists[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoadingPlaylists(false);
        }
      }
    };
    
    fetchData();
  }, [token, user, playlistId]);

  // Handle template selection
  const handleTemplateSelection = (template: PlaylistTemplate) => {
    setSelectedTemplate(template);
    setTemplateDropdownOpen(false);
  };
  
  // Toggle dropdown for a specific song
  const toggleDropdown = (songId: string) => {
    setDropdownOpen(prev => prev === songId ? null : songId);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilteredSearch();
  };
  
  return (
    <Layout 
      navigation={<Navigation title="Songs Library" showBackButton={true} />}
    >
      <div className="songs-page">
        <div className="songs-page__header">
          <h1 className="songs-page__title">Songs Library</h1>
          
          <div className="songs-page__actions">
            <form onSubmit={handleSearchSubmit} className="songs-page__search">
              <MagnifyingGlassIcon />
              <input 
                type="text" 
                placeholder="Search songs..." 
                value={filters.search}
                onChange={handleSearchChange}
              />
            </form>
            
            {user && !isGeneralUser && (
              <Button 
                variant="primary"
                onClick={() => navigate('/songs/create')}
                leftIcon={<PlusIcon />}
              >
                Create Song
              </Button>
            )}
          </div>
        </div>
        
        {/* Template selection if in playlist context */}
        {playlistId && user?.choirId && (
          <div className="template-selector">
            <div className="template-selector__label">
              <span>Template:</span>
              <div className="template-selector__dropdown">
                <button 
                  onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                  className="template-selector__current"
                >
                  {selectedTemplate ? selectedTemplate.title : 'None'}
                  {templateDropdownOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                
                {templateDropdownOpen && (
                  <div className="template-selector__menu">
                    <div 
                      className="template-selector__item"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateDropdownOpen(false);
                      }}
                    >
                      None
                    </div>
                    {availableTemplates.length > 0 ? (
                      availableTemplates.map(template => (
                        <div 
                          key={template.id}
                          className="template-selector__item"
                          onClick={() => handleTemplateSelection(template)}
                        >
                          {template.title}
                        </div>
                      ))
                    ) : (
                      <div className="template-selector__item template-selector__item--disabled">
                        No templates available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Selection actions */}
        {playlistId && selectedSongs.size > 0 && (
          <div className="selection-actions">
            <span>{selectedSongs.size} song(s) selected</span>
            <Button 
              variant="secondary"
              onClick={() => setSelectedSongs(new Set())}
              leftIcon={<XMarkIcon />}
            >
              Clear Selection
            </Button>
          </div>
        )}
        
        {/* Songs grid */}
        {loading ? (
          <div className="songs-page__loading">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="songs-page__error">
            <p>{error}</p>
            <Button 
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : songs.length === 0 ? (
          <div className="songs-page__empty">
            <div className="songs-page__empty-icon">
              <MusicalNoteIcon />
            </div>
            <h3 className="songs-page__empty-title">No songs found</h3>
            <p className="songs-page__empty-message">
              {filters.search ? 
                `No songs match your search "${filters.search}". Try different keywords or clear your search.` : 
                'No songs are available. Try adjusting your filters or adding new songs.'}
            </p>
            {!isGeneralUser && (
              <Button
                variant="primary"
                onClick={() => navigate('/songs/create')}
                leftIcon={<PlusIcon />}
              >
                Create a Song
              </Button>
            )}
          </div>
        ) : (
          <div className="songs-page__grid">
            {songs.map(song => (
              <Card key={song.songId} className="songs-page__card">
                <div className="songs-page__card-content">
                  <h3 className="songs-page__song-title">{song.title}</h3>
                  <p className="songs-page__song-artist">{song.artist || 'Unknown Artist'}</p>
                  
                  {song.tags && song.tags.length > 0 && (
                    <div className="songs-page__song-tags">
                      {song.tags.map(tag => (
                        <span key={tag.tagId} className="songs-page__song-tag">
                          {tag.tagName}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="songs-page__card-actions">
                    <button onClick={() => navigate(`/songs/${song.songId}`)}>
                      <DocumentTextIcon /> View
                    </button>
                    
                    {user && user.choirs && user.choirs.length > 0 && (
                      <div className="songs-page__dropdown" ref={el => { dropdownRefs.current[song.songId] = el; }}>
                        <button onClick={() => toggleDropdown(song.songId)}>
                          {selectedSongs.has(song.songId) ? (
                            <>
                              <CheckCircleIcon /> Selected
                            </>
                          ) : (
                            <>
                              <PlusIcon /> Add To
                            </>
                          )}
                        </button>
                        
                        {dropdownOpen === song.songId && (
                          <div className="songs-page__dropdown-menu">
                            {selectedSongs.has(song.songId) ? (
                              <div 
                                className="songs-page__dropdown-menu-item"
                                onClick={() => toggleSongSelection(song.songId)}
                              >
                                <XMarkIcon /> Remove from selection
                              </div>
                            ) : (
                              <div 
                                className="songs-page__dropdown-menu-item"
                                onClick={() => toggleSongSelection(song.songId)}
                              >
                                <CheckIcon /> Select song
                              </div>
                            )}
                            
                            <div className="songs-page__dropdown-menu-header">
                              Add directly to section:
                            </div>
                            
                            {isLoadingPlaylists ? (
                              <div className="songs-page__dropdown-menu-item songs-page__dropdown-menu-item--disabled">
                                <LoadingSpinner size="sm" /> Loading...
                              </div>
                            ) : displayedSections.length > 0 ? (
                              displayedSections.map(section => (
                                <div 
                                  key={section.id}
                                  className="songs-page__dropdown-menu-item"
                                  onClick={() => {
                                    const targetPlaylistId = playlistId || activePlaylistId;
                                    if (!targetPlaylistId) {
                                      toast.error('No active playlist available');
                                      return;
                                    }
                                    if (selectedSongs.has(song.songId)) {
                                      handleAddToSection(section.id);
                                    } else {
                                      // Create a single song set and call handleAddToSection
                                      setSelectedSongs(new Set([song.songId]));
                                      setTimeout(() => {
                                        handleAddToSection(section.id);
                                      }, 0);
                                    }
                                  }}
                                >
                                  <MusicalNoteIcon /> {section.title}
                                </div>
                              ))
                            ) : (
                              <div className="songs-page__dropdown-menu-item songs-page__dropdown-menu-item--disabled">
                                No sections available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Infinite scroll loader */}
        {!loading && hasMore && (
          <div ref={loaderRef} className="songs-page__loader">
            {loadingMore && <LoadingSpinner size="sm" />}
          </div>
        )}
        
        {/* Back to top button */}
        {showBackToTop && (
          <button onClick={scrollToTop} className="songs-page__back-to-top">
            <ChevronUpIcon />
          </button>
        )}
      </div>
    </Layout>
  );
};

export default SongsListPage;
