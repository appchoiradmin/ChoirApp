import React, { useState, useEffect, useRef, FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchSongs } from '../services/songService';
import { addSongToPlaylist } from '../services/playlistService';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import { usePlaylistContext } from '../context/PlaylistContext';
import { toast } from 'react-hot-toast';
import { PlaylistTemplate } from '../types/playlist';
import { SongDto, SongSearchParams } from '../types/song';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import Navigation from '../components/ui/Navigation';
import TagFilter from '../components/ui/TagFilter';
import { MagnifyingGlassIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, XMarkIcon, MusicalNoteIcon, TrashIcon } from '@heroicons/react/24/outline';
import SectionSelectionModal from '../components/SectionSelectionModal';
import './SongsListPage.scss';
import './SongsListPage.enhanced.scss';
import './SongsListPage.mobile.scss';
import './SongsListPage.tagfilter.scss';
import '../styles/delete-playlist.css';

interface SongsListPageProps {
  playlistId?: string;
  refreshPlaylist?: () => void;
}

interface FilterState {
  search: string;
  sortBy: 'title' | 'artist' | 'tags';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

const DEFAULT_SONGS_PER_PAGE = 24;
const MOBILE_SONGS_PER_PAGE = 16;

const SongsListPage: FC<SongsListPageProps> = ({ playlistId, refreshPlaylist }) => {
  // Dynamic mobile detection hook
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return isMobile;
  };

  // Use dynamic mobile detection
  const isMobile = useIsMobile();
  const songsPerPage = isMobile ? MOBILE_SONGS_PER_PAGE : DEFAULT_SONGS_PER_PAGE;

  const [sectionModalOpen, setSectionModalOpen] = useState<boolean>(false);
  const [selectedSongForModal, setSelectedSongForModal] = useState<string | null>(null);
  const navigate = useNavigate();
  const { sections, setSections, selectedTemplate, setSelectedTemplate, availableTemplates, choirId, isInitializing, createPlaylistIfNeeded, refreshPlaylist: refreshPlaylistContext, playlistId: contextPlaylistId, isPersisted, deletePlaylist } = usePlaylistContext();
  const { t } = useTranslation();
  
  // Use sections from PlaylistContext (backend provides generic template automatically)
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  
  const { token, user } = useUser();
  const isGeneralUser = !user?.choirId;

  const [songs, setSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<string>>(new Set()); // Track songs actually in playlist
  const [isAddingSongs, setIsAddingSongs] = useState(false);

  // Infinite scroll state
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState<boolean>(false);
  
  // Delete playlist state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Use URL search parameters for filter persistence
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filters from URL or use defaults
  const filters: FilterState = {
    search: searchParams.get('search') || '',
    sortBy: (searchParams.get('sortBy') as 'title' | 'artist' | 'tags') || 'title',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    tags: searchParams.getAll('tags') || []
  };
  
  // Helper function to update URL search parameters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    // Update each filter parameter
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        // Handle tags array - remove all existing tags first
        updatedParams.delete('tags');
        // Add each tag as a separate parameter
        value.forEach(tag => {
          if (tag && tag.trim() !== '') {
            updatedParams.append('tags', tag);
          }
        });
      } else if (value && typeof value === 'string' && value.trim() !== '') {
        updatedParams.set(key, value);
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        updatedParams.delete(key);
      }
    });
    
    setSearchParams(updatedParams);
  };
  
  // Search debounce timeout ref
  const searchTimeoutRef = useRef<number | null>(null);
  

  
  // Function to reorder songs - playlist songs at top, then remaining songs in original order
  const getReorderedSongs = (songsToProcess: SongDto[]): SongDto[] => {
    // Separate songs that are in playlist vs not in playlist
    const playlistSongs = songsToProcess.filter(song => playlistSongIds.has(song.songId));
    const nonPlaylistSongs = songsToProcess.filter(song => !playlistSongIds.has(song.songId));
    
    // Sort playlist songs alphabetically for consistent display
    const sortedPlaylistSongs = [...playlistSongs].sort((a, b) => 
      a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    );
    
    // Keep non-playlist songs in their original order (as received from API)
    // Return playlist songs first, then non-playlist songs
    return [...sortedPlaylistSongs, ...nonPlaylistSongs];
  };
  


  // Modal handlers
  const openSectionModal = (songId: string) => {
    setSelectedSongForModal(songId);
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setSectionModalOpen(false);
    setSelectedSongForModal(null);
  };

  // Template selection handler
  const handleTemplateSelection = (template: PlaylistTemplate) => {
    console.log('🚨 DEBUG - Template selected in songs tab:', template.title, 'ID:', template.id);
    
    // Update the selected template in the PlaylistContext
    // This will automatically synchronize with the playlist tab
    setSelectedTemplate(template);
    setTemplateDropdownOpen(false);
    
    // Update sections to reflect the newly selected template
    // Always update sections when template is selected (unless playlist is already persisted with songs)
    if (template && template.sections) {
      const mappedSections = template.sections.map(section => ({
        id: section.id,
        title: section.title,
        order: section.order,
        songs: [],
      }));
      setSections(mappedSections);
      
      console.log('🚨 DEBUG - Template sections updated:', mappedSections.length, 'sections:', mappedSections.map(s => s.title));
    }
    
    // Show success message to user
    toast.success(`Template "${template.title}" selected successfully!`);
    
    console.log('🚨 DEBUG - Template selection complete. Sections should now be synchronized across tabs.');
  };



  // Helper function to check if a song is already in the current playlist
  const isSongInPlaylist = (songId: string): boolean => {
    return playlistSongIds.has(songId);
  };

  // Function to fetch songs already in the current playlist
  const fetchPlaylistSongs = async () => {

    
    if (!token) {

      return;
    }
    
    // If no playlist exists (template-only state), clear all song states
    if (!contextPlaylistId) {

      setPlaylistSongIds(new Set());
      setSelectedSongs(new Set());
      return;
    }
    
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
      // Clear states on error
      setPlaylistSongIds(new Set());
      setSelectedSongs(new Set());
    }
  };



  // Fetch songs already in the current playlist when playlist changes
  useEffect(() => {
    fetchPlaylistSongs();
  }, [contextPlaylistId, token]); // Re-fetch when playlist or token changes

  // Handle dynamic date selection - refresh playlist songs and clear selections when PlaylistContext updates
  useEffect(() => {
    
    // Clear previous selections when context changes (new date selected)
    setSelectedSongs(new Set());
    
    // Refresh playlist songs for the new date/playlist
    if (!isInitializing) {
      fetchPlaylistSongs();
    }
  }, [sections, selectedTemplate, contextPlaylistId, isInitializing]); // Re-fetch when any PlaylistContext state changes

  // Force re-render when playlist songs change to trigger reordering
  useEffect(() => {
    // This effect doesn't need to do anything - it just ensures the component re-renders
    // when playlistSongIds changes, which will cause getReorderedSongs to be called
    // with the updated playlist state
  }, [playlistSongIds]);

  // Consolidated fetch function that handles both initial load and search
  const fetchSongs = async (searchTerm: string = '', resetPagination: boolean = true, explicitTags?: string[]) => {
    try {
      if (resetPagination) {
        setLoading(true);
        setPage(0);
        setSongs([]);
        setHasMore(true);
      }
      
      if (!token) {
        setError(t('songs.authTokenNotFound'));
        return;
      }
      
      // Use explicit tags if provided, otherwise get current tags from URL parameters
      const currentTags = explicitTags !== undefined ? explicitTags : (searchParams.getAll('tags') || []);
      
      // DEBUG: Log what we're about to send to the API
      console.log('🔍 fetchSongs DEBUG:', {
        searchTerm: searchTerm || '',
        explicitTags,
        currentTags,
        urlTags: searchParams.getAll('tags'),
        resetPagination
      });
      
      // Prepare search parameters
      const apiSearchParams: SongSearchParams = {
        searchTerm: searchTerm || '', // Use provided search term
        skip: resetPagination ? 0 : page * songsPerPage,
        take: songsPerPage,
        // Include userId and choirId for proper filtering
        userId: user?.id,
        choirId: choirId || undefined,
        // Include selected tags for filtering - use explicit tags or current URL tags
        tags: currentTags.length > 0 ? currentTags : undefined
        // Don't specify visibility - let backend handle visibility logic based on user context
      };
      
      console.log('🚀 API Request Parameters:', apiSearchParams);
      
      const fetchedSongs = await searchSongs(apiSearchParams, token);
      
      if (resetPagination) {
        setSongs(fetchedSongs || []);
        setPage(1);
      } else {
        // Append for infinite scroll
        setSongs(prev => {
          const existingIds = new Set(prev.map(song => song.songId));
          const newSongs = (fetchedSongs || []).filter(song => !existingIds.has(song.songId));
          const combined = [...prev, ...newSongs];
          return combined;
        });
        setPage(prev => prev + 1);
      }
      
      setHasMore((fetchedSongs?.length || 0) === songsPerPage);
    } catch (error) {
      console.error('Fetch songs error:', error);
      setError(t('songs.failedToLoadSongs'));
    } finally {
      if (resetPagination) {
        setLoading(false);
      }
    }
  };

  // Initial fetch effect with URL-based search term
  useEffect(() => {
    fetchSongs(filters.search, true); // Initial load with search term from URL
    
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
  }, [token, user?.choirId, songsPerPage]); // Search handled separately by debounced handleSearchChange

  // Separate effect to watch for tag changes and trigger automatic refetch
  useEffect(() => {
    const currentTags = searchParams.getAll('tags');
    const currentSearch = searchParams.get('search') || '';
    
    // Only refetch if we have a token and this isn't the initial load
    // (initial load is handled by the main useEffect above)
    if (token && (currentTags.length > 0 || currentSearch)) {
      // Use a small delay to avoid conflicts with the main useEffect
      const timeoutId = setTimeout(() => {
        fetchSongs(currentSearch, true);
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchParams, token]); // Watch for changes in URL search parameters

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
          }, 100); // Reduced delay for more responsive loading
        }
      },
      { 
        threshold: 0.3, // Trigger earlier for smoother experience
        rootMargin: '100px' // Start loading before reaching the element
      }
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
    if (loading || !hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      await fetchSongs(filters.search, false); // Use consolidated fetch with append mode
      
      // Smooth scroll adjustment to prevent jarring experience
      // Only adjust if user is near the bottom
      const scrollPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition + windowHeight > documentHeight - 200) {
        // User is near bottom, scroll up slightly to show new content
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition - 100,
            behavior: 'smooth'
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading more songs:', error);
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
        // Template loading and playlist selection is now handled by PlaylistContext
        // This useEffect can be simplified or removed entirely
      }
    };
    
    fetchData();
  }, [token, user, playlistId]);


  

  // Handle section selection from modal
  const handleSectionSelect = async (sectionId: string) => {
    if (!selectedSongForModal || !token) {
      setError('Missing required data.');
      return;
    }

    try {
      setIsAddingSongs(true);
      
      // Step 1: Ensure playlist exists (create if needed)
      let targetPlaylistId = contextPlaylistId || playlistId;
      let actualSections = sections; // Use current sections by default
      
      if (!targetPlaylistId) {
        try {
          const createdPlaylist = await createPlaylistIfNeeded();
          if (createdPlaylist && createdPlaylist.id) {
            targetPlaylistId = createdPlaylist.id;
            actualSections = createdPlaylist.sections; // Use sections returned from creation
            
            console.log('🚨 DEBUG - Playlist created with sections:', actualSections);
            
            // Refresh context in background (don't wait for it)
            refreshPlaylistContext().catch(console.error);
          } else {
            throw new Error('Failed to create playlist');
          }
        } catch (creationError) {
          console.error('Debug - Failed to create playlist:', creationError);
          toast.error('Failed to create playlist. Please try again.');
          return;
        }
      }
      
      // Step 2: Map template section ID to actual playlist section ID
      let actualSectionId = sectionId;
      
      // If we have actual sections (either from context or from creation), use them for mapping
      if (actualSections.length > 0) {
        // Check if the sectionId exists in actualSections
        const sectionExists = actualSections.find(s => s.id === sectionId);
        
        if (!sectionExists) {
          // This means we're using a template section ID, need to map to actual section ID
          const templateSection = selectedTemplate?.sections?.find(ts => ts.id === sectionId);
          if (templateSection) {
            console.log('🚨 DEBUG - Looking for template section:', {
              templateSectionId: sectionId,
              templateSectionTitle: templateSection.title,
              availablePlaylistSections: actualSections.map(ps => ({ id: ps.id, title: ps.title }))
            });
            
            // For global templates, we need to match by the original translation key
            // The template section title might be translated (e.g., "Preludio")
            // But the playlist section title is the raw key (e.g., "prelude")
            // We need to find the original key from the template section
            
            // Try direct title match first (for user templates)
            let playlistSection = actualSections.find(ps => ps.title === templateSection.title);
            
            // If no direct match and this looks like a global template, try key-based matching
            if (!playlistSection && templateSection.title) {
              // Check if this is a translated title by looking for common global template section keys
              const globalSectionKeyMap: Record<string, string> = {
                'Preludio': 'prelude',
                'Adoración': 'worship', 
                'Himno': 'anthem',
                'Postludio': 'postlude',
                'Apertura': 'opening',
                'Comunión': 'communion',
                'Cierre': 'closing',
                'Canciones': 'songs',
                'Himnos': 'hymns',
                'Salmos': 'psalms'
              };
              
              const originalKey = globalSectionKeyMap[templateSection.title];
              if (originalKey) {
                playlistSection = actualSections.find(ps => ps.title === originalKey);
                console.log('🚨 DEBUG - Mapped translated title', templateSection.title, 'to key', originalKey);
              }
            }
            
            if (playlistSection) {
              actualSectionId = playlistSection.id;
              console.log('🚨 DEBUG - Mapped template section ID', sectionId, 'to playlist section ID', actualSectionId);
            } else {
              console.log('🚨 DEBUG - Could not find matching playlist section for template section:', templateSection.title);
            }
          }
        }
      }
      
      // Step 3: Add the song to the playlist using the correct section ID
      console.log('🚨 DEBUG - Adding song to playlist:', {
        playlistId: targetPlaylistId,
        songId: selectedSongForModal,
        sectionId: actualSectionId
      });
      
      await addSongToPlaylist(
        targetPlaylistId,
        {
          songId: selectedSongForModal,
          sectionId: actualSectionId
        },
        token
      );

      // Step 4: Update UI state to show song as selected
      setSelectedSongs(prev => new Set([...prev, selectedSongForModal]));
      setPlaylistSongIds(prev => new Set([...prev, selectedSongForModal]));
      
      // Step 5: Show success message
      toast.success('Song added to playlist successfully!');
      
      // Step 6: Close modal
      closeSectionModal();
      
      // Step 7: Refresh playlist data
      if (refreshPlaylist) {
        refreshPlaylist();
      }
      
      // Refresh the playlist context to get updated data
      await refreshPlaylistContext();
      
      // Re-fetch playlist songs to ensure accurate "Added" flags
      await fetchPlaylistSongs();
      
      console.log('Debug - Playlist context and songs refreshed');
      
      // Note: The modal should automatically update since it uses displayedSections from context
      
    } catch (error) {
      console.error('Debug - Error adding song to playlist:', error);
      toast.error(t('songs.failedToAddSong'));
    } finally {
      setIsAddingSongs(false);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = e.target.value;
    
    console.log('🔤 handleSearchChange DEBUG:', {
      newSearchValue: `"${newSearchValue}"`,
      isEmpty: newSearchValue === '',
      currentUrlTags: searchParams.getAll('tags'),
      filtersState: filters
    });
    
    // Update URL parameters immediately for UI responsiveness
    updateFilters({ search: newSearchValue });
    
    // Debounce the search to avoid too many API calls
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to trigger search after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      // Get current tags from URL parameters to preserve them during search
      const currentTags = searchParams.getAll('tags') || [];
      console.log('⏰ handleSearchChange timeout executing:', {
        newSearchValue: `"${newSearchValue}"`,
        currentTags,
        aboutToCallFetchSongs: true
      });
      fetchSongs(newSearchValue, true, currentTags);
    }, 300); // 300ms debounce
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Force immediate search by calling fetchSongs directly
    fetchSongs(filters.search, true);
  };

  // Handle filter reset/clear
  const handleClearFilters = () => {
    // Clear all URL parameters to reset filters
    setSearchParams(new URLSearchParams());
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Fetch songs without any filters - explicitly pass empty tags array
    fetchSongs('', true, []);
  };

  // Handle tag filter changes
  const handleTagsChange = (newTags: string[]) => {
    // Update URL parameters with new tags
    updateFilters({ tags: newTags });
    
    // Trigger search with current search term and new tags
    fetchSongs(filters.search, true);
  };

  // Delete playlist handlers
  const confirmDeletePlaylist = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDeletePlaylist = () => {
    setShowDeleteConfirm(false);
  };

  const handleDeletePlaylist = async () => {
    if (!contextPlaylistId) return;
    
    setIsDeleting(true);
    try {
      // Use the deletePlaylist method from the existing context (no arguments needed)
      await deletePlaylist();
      toast.success(t('playlists.playlistDeletedSuccessfully'));
      setShowDeleteConfirm(false);
      
      // Reset UI state after deletion - no need to fetch deleted playlist
      setPlaylistSongIds(new Set());
      setSelectedSongs(new Set());
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error(t('playlists.failedToDeletePlaylist'));
    } finally {
      setIsDeleting(false);
    }
  };


  
  return (
    <Layout navigation={!choirId ? <Navigation title={t('songs.songsLibrary')} showBackButton={true} /> : undefined}>
      <div className="songs-page">
        <div className="songs-page__header">
          <h1 className="songs-page__title">
            {t('songs.songsLibrary')}
          </h1>
          {(filters.search || filters.tags.length > 0) && (
            <div className="songs-page__search-indicator">
              {filters.search && (
                <span>
                  {t('songs.searchingFor')} "{filters.search}"
                </span>
              )}
              {filters.tags.length > 0 && (
                <div className="tag-indicator">
                  <span className="tag-indicator__label">{t('songs.filterByTags')}:</span>
                  <span className="tag-indicator__count">{filters.tags.length}</span>
                </div>
              )}
              <span>({songs.length} {t('songs.results')})</span>
            </div>
          )}
          
          <div className="songs-page__actions">
            <div className="songs-page__search-container">
              <form onSubmit={handleSearchSubmit} className="songs-page__search">
                <MagnifyingGlassIcon />
                <input 
                  type="text" 
                  placeholder={t('songs.searchSongs')} 
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </form>
              
              {/* Clear filter button - only show when there's an active filter */}
              {(filters.search || filters.tags.length > 0) && (
                <button 
                  className="songs-page__clear-filter"
                  onClick={handleClearFilters}
                  title={t('songs.clearFilter')}
                  aria-label={t('songs.clearFilter')}
                >
                  {t('common.clear')}
                </button>
              )}
            </div>
          </div>
          
          {/* Tag Filter Component */}
          <TagFilter
            selectedTags={filters.tags}
            onTagsChange={handleTagsChange}
            className="songs-page__tag-filter"
          />
        </div>
        
        {/* Template selection - always visible within a choir */}
        {choirId && (
          <div className={`template-selector ${isPersisted ? 'template-selector--disabled' : ''}`}>
            <div className="template-selector__label">
              <span>{t('songs.template')}:</span>
              <div className="template-selector__dropdown">
                <button 
                  onClick={() => !isPersisted && setTemplateDropdownOpen(!templateDropdownOpen)}
                  className={`template-selector__current ${isPersisted ? 'template-selector__current--disabled' : ''}`}
                  disabled={isPersisted}
                  title={isPersisted ? t('songs.templateLockedAfterFirstSong') : undefined}
                >
                  {selectedTemplate ? selectedTemplate.title : (availableTemplates.length > 0 ? (availableTemplates.find(t => t.isDefault) || availableTemplates[0]).title : t('songs.noTemplatesAvailable'))}
                  {!isPersisted && (templateDropdownOpen ? <ChevronUpIcon /> : <ChevronDownIcon />)}
                </button>
                
                {templateDropdownOpen && !isPersisted && (
                  <div className="template-selector__menu">
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
                        {t('songs.noTemplatesAvailable')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Template instructions */}
            {!isPersisted && (
              <div className="template-selector__instructions">
                <p className="template-selector__help-text">
                  {selectedTemplate ? 
                    t('songs.templateSelectedInfo') : 
                    t('songs.templateAlwaysVisible')
                  }
                </p>
              </div>
            )}
            
            {isPersisted && (
              <div className="template-selector__locked-info">
                <p className="template-selector__locked-text">
                  {t('songs.templateLocked')}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Delete Playlist Section - Outside template selector blur */}
        {choirId && isPersisted && contextPlaylistId && (
          <div className="delete-playlist-section">
            <div className="delete-playlist-section__content">
              <p className="delete-playlist-section__text">
                {t('songs.deletePlaylistInfo')}
              </p>
              <Button
                variant="outlined"
                size="sm"
                leftIcon={<TrashIcon />}
                onClick={confirmDeletePlaylist}
                disabled={isDeleting}
                className="delete-playlist-btn is-danger"
              >
                {isDeleting ? t('playlists.deletingPlaylist') : t('playlists.deletePlaylistButton')}
              </Button>
            </div>
          </div>
        )}
        
        {/* Selection actions */}
        {playlistId && selectedSongs.size > 0 && (
          <div className="selection-actions">
            <span>{selectedSongs.size} {t('songs.songsSelected')}</span>
            <Button 
              variant="secondary"
              onClick={() => setSelectedSongs(new Set())}
              leftIcon={<XMarkIcon />}
            >
              {t('songs.clearSelection')}
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
              {t('songs.retry')}
            </Button>
          </div>
        ) : songs.length === 0 ? (
          <div className="songs-page__empty">
            <div className="songs-page__empty-icon">
              <img 
                src="/icons/icon-96x96.png" 
                alt="ChoirApp" 
                style={{ 
                  width: '64px', 
                  height: '64px',
                  opacity: 0.6,
                  filter: 'grayscale(0.3)'
                }}
              />
            </div>
            <h3 className="songs-page__empty-title">{t('songs.noSongsFound')}</h3>
            <p className="songs-page__empty-message">
              {filters.search ? 
                `${t('songs.noSongsMatch')} "${filters.search}". ${t('songs.tryDifferentKeywords')}` : 
                t('songs.noSongsAvailable')}
            </p>
            {!isGeneralUser && (
              <Button
                variant="primary"
                onClick={() => navigate('/songs/create')}
                leftIcon={<PlusIcon />}
              >
                {t('songs.createASong')}
              </Button>
            )}
          </div>
        ) : (
          <div className="songs-page__content-wrapper">

            
            <div className="songs-page__grid">
              {getReorderedSongs(songs).map((song: SongDto) => (
                <div key={song.songId}>
                  <Card className="songs-page__card">
                <div className="songs-page__card-content">
                  <div className="songs-page__song-info">
                    <h3 
                      className="songs-page__song-title songs-page__song-title--clickable"
                      onClick={() => {
                        // Navigate to song detail while preserving current filter parameters
                        const currentParams = searchParams.toString();
                        const separator = currentParams ? '?' : '';
                        navigate(`/songs/${song.songId}${separator}${currentParams}`);
                      }}
                    >
                      {song.title}
                    </h3>
                    {song.artist && (
                      <p className="songs-page__song-artist">{song.artist}</p>
                    )}
                    
                    {song.tags && song.tags.length > 0 && (
                      <div className="songs-page__song-tags">
                        {song.tags.map((tag: any) => (
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
                          aria-label={isSongInPlaylist(song.songId) ? t('songs.songAlreadyInPlaylist') : t('songs.addSongToPlaylist')}
                        >
                          {isSongInPlaylist(song.songId) ? (
                            <>
                              <CheckCircleIcon /> {t('songs.added')}
                            </>
                          ) : (
                            <>
                              <PlusIcon /> {t('songs.add')}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Infinite scroll loader */}
        {!loading && (
          <div ref={loaderRef} className="songs-page__loader">
            {hasMore ? (
              loadingMore ? (
                <div className="songs-page__loading-more">
                  <LoadingSpinner size="sm" />
                  <span className="songs-page__loading-text">{t('songs.loadingMore')}</span>
                </div>
              ) : (
                <div className="songs-page__load-trigger">
                  <span className="songs-page__load-hint">{t('songs.scrollForMore')}</span>
                </div>
              )
            ) : (
              <div className="songs-page__end-message">
                <MusicalNoteIcon className="songs-page__end-icon" />
                <span>{t('songs.allSongsLoaded')}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Back to top button */}
        {showBackToTop && (
          <button onClick={scrollToTop} className="songs-page__back-to-top">
            <ChevronUpIcon 
              style={{ 
                width: '2rem !important', 
                height: '2rem !important', 
                strokeWidth: 2.5,
                minWidth: '2rem',
                minHeight: '2rem',
                maxWidth: '2rem',
                maxHeight: '2rem'
              }} 
              width="32"
              height="32"
            />
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
        title={t('songs.addToSection')}
      />
      
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

export default SongsListPage;
