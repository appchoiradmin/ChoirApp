import React, { useState, useEffect, useRef, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchSongs } from '../services/songService';
import { getPlaylistTemplatesByChoirId, addSongToPlaylist } from '../services/playlistService';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import { useUser } from '../hooks/useUser';
import { usePlaylistContext } from '../context/PlaylistContext';
import { toast } from 'react-hot-toast';
import { PlaylistTemplate } from '../types/playlist';
import { SongDto } from '../types/song';
import { Button, Card, LoadingSpinner } from '../components/ui';
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

interface SongFilters {
  search: string;
  tags: string[];
  visibility?: string;
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
  const { sections, selectedTemplate, playlistId: playlistIdFromContext, refreshPlaylist: refreshPlaylistFromContext, setSelectedTemplate } = usePlaylistContext();
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
        
        const fetchedSongs = await searchSongs({
          skip: 0,
          take: songsPerPage,
          title: filters.search !== '' ? filters.search : undefined,
          artist: undefined,
          tags: undefined,
          visibility: 1, // PublicAll - to get songs visible to everyone
        }, token);
        
        setSongs(fetchedSongs || []);
        setAvailableTemplates(templatesData || []);
        setPage(1); // We've loaded the first page
        setHasMore(fetchedSongs.length === songsPerPage); // If we got fewer songs than requested, there are no more
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
  }, [token, user?.choirId, songsPerPage, filters.search]);

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
          searchParams.tag = filters.search;
        }
        
        const songsData = await searchSongs(searchParams, token);
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
    if (!token || !hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const searchParams: any = {
        skip: page * songsPerPage,
        take: songsPerPage
      };
      
      if (filters.search) {
        searchParams.title = filters.search;
        searchParams.artist = filters.search;
        searchParams.tag = filters.search;
      }
      
      const moreSongs = await searchSongs(searchParams, token);
      
      if (moreSongs.length === 0) {
        setHasMore(false);
      } else {
        setSongs(prev => [...prev, ...moreSongs]);
        setPage(prev => prev + 1);
        setHasMore(moreSongs.length === songsPerPage);
      }
    } catch (err) {
      console.error('Error loading more songs:', err);
      toast.error('Failed to load more songs');
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
  
  // Add selected songs to playlist
  const addSelectedSongsToPlaylist = async (sectionId: string) => {
    if (!token || !playlistId || selectedSongs.size === 0) {
      return;
    }
    
    try {
      // Add each selected song to the playlist
      const promises = Array.from(selectedSongs).map(songId => 
        addSongToPlaylist(playlistId, { songId, sectionId }, token)
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
    }
  };
  
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
    <Layout>
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
        {playlistId && user?.choirId && availableTemplates.length > 0 && (
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
                    {availableTemplates.map(template => (
                      <div 
                        key={template.id}
                        className="template-selector__item"
                        onClick={() => handleTemplateSelection(template)}
                      >
                        {template.title}
                      </div>
                    ))}
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
            <p>No songs found</p>
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
                    
                    {playlistId && (
                      <div className="songs-page__dropdown" ref={el => { dropdownRefs.current[song.songId] = el; }}>
                        <button onClick={() => toggleDropdown(song.songId)}>
                          {selectedSongs.has(song.songId) ? (
                            <>
                              <CheckCircleIcon /> Selected
                            </>
                          ) : (
                            <>
                              <PlusIcon /> Add to Playlist
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
                            
                            {displayedSections.map(section => (
                              <div 
                                key={section.id}
                                className="songs-page__dropdown-menu-item"
                                onClick={() => addSelectedSongsToPlaylist(section.id)}
                              >
                                <MusicalNoteIcon /> {section.title}
                              </div>
                            ))}
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
