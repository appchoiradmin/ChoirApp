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
import { MagnifyingGlassIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, XMarkIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import SectionSelectionModal from '../components/SectionSelectionModal';
import './SongsListPage.scss';
import './SongsListPage.enhanced.scss';
import './SongsListPage.mobile.scss';

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
  const [sectionModalOpen, setSectionModalOpen] = useState<boolean>(false);
  const [selectedSongForModal, setSelectedSongForModal] = useState<string | null>(null);
  const navigate = useNavigate();
  const { sections, selectedTemplate, setSelectedTemplate, choirId, isInitializing, createPlaylistIfNeeded, refreshPlaylist: refreshPlaylistContext, playlistId: contextPlaylistId } = usePlaylistContext();
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  
  const { token, user } = useUser();
  const isGeneralUser = !user?.choirId;

  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<string>>(new Set()); // Track songs actually in playlist
  
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
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'title',
    sortOrder: 'asc'
  });

  // Modal handlers
  const openSectionModal = (songId: string) => {
    setSelectedSongForModal(songId);
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setSectionModalOpen(false);
    setSelectedSongForModal(null);
  };

  // Helper function to check if a song is already in the current playlist
  const isSongInPlaylist = (songId: string): boolean => {
    return playlistSongIds.has(songId);
  };

  // Function to fetch songs already in the current playlist
  const fetchPlaylistSongs = async () => {
    if (!contextPlaylistId || !token) return;
    
    try {
      // Import the playlist service to get playlist details
      const { getPlaylistById } = await import('../services/playlistService');
      const playlist = await getPlaylistById(contextPlaylistId, token);
      
      // Extract all song IDs from all sections
      const songIds = new Set<string>();
      playlist.sections?.forEach(section => {
        section.songs?.forEach(song => {
          songIds.add(song.songId);
        });
      });
      
      setPlaylistSongIds(songIds);
      // Also update selectedSongs to show "Added" flag immediately
      setSelectedSongs(songIds);
    } catch (error) {
      setError('Failed to fetch playlist songs.');
    }
  };



  // Fetch songs already in the current playlist when playlist changes
  useEffect(() => {
    fetchPlaylistSongs();
  }, [contextPlaylistId, token]); // Re-fetch when playlist or token changes

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
        // Deduplicate songs to prevent duplicate keys
        setSongs(prev => {
          const existingIds = new Set(prev.map(song => song.songId));
          const newSongs = moreSongs.filter(song => !existingIds.has(song.songId));
          return [...prev, ...newSongs];
        });
        setPage(prev => prev + 1);
        setHasMore(moreSongs.length === songsPerPage);
      }
    } catch (error) {
      setError('Failed to load more songs. Please try again later.');
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Note: Song selection and bulk operations removed in favor of individual modal-based additions
  
  // Load available templates and active playlist
  useEffect(() => {
    const fetchData = async () => {
      // Get the active choir ID - either from user context or the first choir in the list
      const activeChoirId = user?.choirId || (user?.choirs && user.choirs.length > 0 ? user.choirs[0].id : null);
      
      if (token && activeChoirId) {
        // Loading state is handled by PlaylistContext
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
          setError('Failed to fetch data.');
        } finally {
          // Loading state is handled by PlaylistContext
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
  
  // Handle section selection from modal
  const handleSectionSelect = async (sectionId: string) => {
    if (!selectedSongForModal || !token) {
      setError('Missing required data.');
      return;
    }

    try {
      setIsAddingSongs(true);
      
      // Step 1: Ensure playlist exists (create if needed)
      // Use contextPlaylistId from PlaylistContext which correctly tracks the current date's playlist
      // If contextPlaylistId exists, use it; otherwise create a new playlist
      let targetPlaylistId = contextPlaylistId || playlistId; // Use context playlist ID first
      
      if (!targetPlaylistId) {
        console.log('Debug - No playlist exists, creating one...');
        try {
          const createdPlaylist = await createPlaylistIfNeeded();
          if (createdPlaylist && createdPlaylist.id) {
            targetPlaylistId = createdPlaylist.id;
            setActivePlaylistId(targetPlaylistId);
            console.log('Debug - Playlist created successfully:', {
              playlistId: targetPlaylistId,
              sections: createdPlaylist.sections?.length || 0
            });
            
            // CRITICAL: After playlist creation, we need to refresh the context
            // to get the actual playlist section IDs (not template IDs)
            console.log('Debug - Refreshing playlist context to get actual section IDs...');
            await refreshPlaylistContext();
            
            // IMPORTANT: Don't exit early - continue with the song addition using the newly created playlist
            // The refreshPlaylistContext should have updated the sections with real playlist section IDs
            console.log('Debug - Context refreshed, continuing with song addition using real playlist sections');
            
            // Update the targetPlaylistId for the rest of the function
            // No need to reopen modal - continue with the song addition
          } else {
            throw new Error('Failed to create playlist');
          }
        } catch (creationError) {
          console.error('Debug - Failed to create playlist:', creationError);
          toast.error('Failed to create playlist. Please try again.');
          return;
        }
      }

      console.log('Debug - Adding song to playlist:', {
        songId: selectedSongForModal,
        sectionId,
        targetPlaylistId,
        token: token ? 'present' : 'missing'
      });
      
      // Debug: Check if the sectionId exists in the current displayedSections
      const sectionExists = displayedSections.find(s => s.id === sectionId);
      console.log('🚨 CRITICAL DEBUG - Section validation before API call:', {
        sectionId,
        sectionExists: !!sectionExists,
        sectionTitle: sectionExists?.title || 'NOT FOUND',
        allAvailableSections: displayedSections.map(s => ({ id: s.id, title: s.title })),
        sectionsFromContext: sections.length,
        usingTemplateOrPlaylist: sections.length > 0 ? 'PLAYLIST SECTIONS' : 'TEMPLATE SECTIONS'
      });
      
      // CRITICAL FIX: If we don't find the section in displayedSections, it means we're still using template IDs
      // In this case, we need to find the corresponding section by title in the actual playlist sections
      if (!sectionExists && sections.length > 0) {
        console.log('🚨 CRITICAL - Section ID not found, attempting to map by title...');
        const templateSection = selectedTemplate?.sections?.find(ts => ts.id === sectionId);
        if (templateSection) {
          const playlistSection = sections.find(ps => ps.title === templateSection.title);
          if (playlistSection) {
            console.log('🚨 CRITICAL - Found matching playlist section by title:', {
              originalSectionId: sectionId,
              newSectionId: playlistSection.id,
              sectionTitle: playlistSection.title
            });
            sectionId = playlistSection.id; // Use the real playlist section ID
          }
        }
      }
      
      // Step 2: Add the song to the playlist
      console.log('🚨 CRITICAL DEBUG - About to call API with sectionId:', sectionId);
      await addSongToPlaylist(
        targetPlaylistId,
        {
          songId: selectedSongForModal,
          sectionId: sectionId
        },
        token
      );

      console.log('Debug - Song added successfully');
      
      // Step 3: Update UI state to show song as selected
      setSelectedSongs(prev => new Set([...prev, selectedSongForModal]));
      setPlaylistSongIds(prev => new Set([...prev, selectedSongForModal])); // Also update playlist songs
      
      // Step 4: Show success message
      toast.success('Song added to playlist successfully!');
      
      // Step 5: Close modal
      closeSectionModal();
      
      // Step 6: Refresh playlist data
      if (refreshPlaylist) {
        refreshPlaylist();
      }
      
      // Also refresh the playlist context to get updated data
      await refreshPlaylistContext();
      
      // Step 7: Re-fetch playlist songs to ensure accurate "Added" flags
      await fetchPlaylistSongs();
      
      console.log('Debug - Playlist context and songs refreshed');
      
      // Note: The modal should automatically update since it uses displayedSections from context
      
    } catch (error) {
      console.error('Debug - Error adding song to playlist:', error);
      toast.error('Failed to add song to playlist');
    } finally {
      setIsAddingSongs(false);
    }
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
                  <div className="songs-page__song-info">
                    <h3 
                      className="songs-page__song-title songs-page__song-title--clickable"
                      onClick={() => navigate(`/songs/${song.songId}`)}
                    >
                      {song.title}
                    </h3>
                    {song.artist && (
                      <p className="songs-page__song-artist">{song.artist}</p>
                    )}
                    
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
                      {user && user.choirs && user.choirs.length > 0 && choirId && (
                        <button 
                          className={`songs-page__add-button ${isSongInPlaylist(song.songId) ? 'songs-page__add-button--selected' : ''}`}
                          onClick={() => openSectionModal(song.songId)}
                          disabled={isAddingSongs}
                          aria-label={isSongInPlaylist(song.songId) ? 'Song already in playlist' : 'Add song to playlist'}
                        >
                          {isSongInPlaylist(song.songId) ? (
                            <>
                              <CheckCircleIcon /> Added
                            </>
                          ) : (
                            <>
                              <PlusIcon /> Add
                            </>
                          )}
                        </button>
                      )}
                    </div>
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
      
      {/* Section Selection Modal */}
      <SectionSelectionModal
        isOpen={sectionModalOpen}
        onClose={closeSectionModal}
        sections={displayedSections}
        isLoading={isInitializing}
        onSelectSection={handleSectionSelect}
        title="Add to Section"
      />
    </Layout>
  );
};

export default SongsListPage;
