import React, { useState, useEffect, useRef, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchSongs } from '../services/songService';
import { addSongToPlaylist } from '../services/playlistService';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import { usePlaylistContext } from '../context/PlaylistContext';
import { toast } from 'react-hot-toast';
import { PlaylistTemplate } from '../types/playlist';
import { SongDto, SongSearchParams } from '../types/song';
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
  const { sections, setSections, selectedTemplate, setSelectedTemplate, availableTemplates, choirId, isInitializing, createPlaylistIfNeeded, refreshPlaylist: refreshPlaylistContext, playlistId: contextPlaylistId, isPersisted } = usePlaylistContext();
  const { t } = useTranslation();
  
  // Use sections from PlaylistContext (backend provides generic template automatically)
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  
  const { token, user } = useUser();
  const isGeneralUser = !user?.choirId;

  const [songs, setSongs] = useState<SongDto[]>([]);
  const [sortedSongs, setSortedSongs] = useState<SongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [playlistSongIds, setPlaylistSongIds] = useState<Set<string>>(new Set()); // Track songs actually in playlist
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [showAlphabetNav, setShowAlphabetNav] = useState(false);

  // Infinite scroll state
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'title',
    sortOrder: 'asc'
  });
  
  // Search debounce timeout ref
  const searchTimeoutRef = useRef<number | null>(null);
  
  // Refs for alphabet navigation
  const songRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Function to sort songs alphabetically and extract available letters
  const sortAndProcessSongs = (songsToProcess: SongDto[]) => {
    // Sort songs alphabetically by title
    const sorted = [...songsToProcess].sort((a, b) => 
      a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    );
    
    setSortedSongs(sorted);
    
    // Extract available letters (first letter of each song title)
    const letters = new Set<string>();
    sorted.forEach(song => {
      const firstLetter = song.title.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    
    const sortedLetters = Array.from(letters).sort();
    setAvailableLetters(sortedLetters);
    setShowAlphabetNav(sorted.length > 10); // Show nav if we have more than 10 songs
  };
  
  // All alphabet letters
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Function to scroll to first song starting with selected letter
  const scrollToLetter = (letter: string) => {
    const targetSong = sortedSongs.find(song => 
      song.title.charAt(0).toUpperCase() === letter
    );
    
    if (targetSong && songRefs.current[targetSong.songId]) {
      songRefs.current[targetSong.songId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  // Handle drag-to-scroll functionality
  const handleAlphabetDrag = (e: React.TouchEvent | React.MouseEvent) => {
    const alphabetNav = (e.currentTarget as HTMLElement).closest('.songs-page__alphabet-nav-inner');
    if (!alphabetNav) return;
    
    const rect = alphabetNav.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeY = clientY - rect.top;
    const letterHeight = rect.height / allLetters.length;
    const letterIndex = Math.floor(relativeY / letterHeight);
    
    if (letterIndex >= 0 && letterIndex < allLetters.length) {
      const letter = allLetters[letterIndex];
      if (availableLetters.includes(letter)) {
        scrollToLetter(letter);
      }
    }
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
    // Only update if we're not in a persisted playlist (where sections come from actual playlist)
    if (!isPersisted && template && template.sections) {
      const mappedSections = template.sections.map(section => ({
        id: section.id,
        title: section.title,
        order: section.order,
        songs: [],
      }));
      setSections(mappedSections);
      
      console.log('🚨 DEBUG - Template sections updated:', mappedSections.length, 'sections');
    }
    
    // Show success message to user
    toast.success(`Template "${template.title}" selected successfully!`);
    
    console.log('🚨 DEBUG - Template selection complete. This should now be reflected in playlist tab.');
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

  // Consolidated fetch function that handles both initial load and search
  const fetchSongs = async (searchTerm: string = '', resetPagination: boolean = true) => {
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
      
      // Prepare search parameters
      const searchParams: SongSearchParams = {
        searchTerm: searchTerm || '', // Use provided search term
        skip: resetPagination ? 0 : page * songsPerPage,
        take: songsPerPage
        // Don't specify visibility - let backend handle visibility logic based on user context
      };
      
      const fetchedSongs = await searchSongs(searchParams, token);
      
      if (resetPagination) {
        setSongs(fetchedSongs || []);
        setPage(1);
      } else {
        // Append for infinite scroll
        setSongs(prev => {
          const existingIds = new Set(prev.map(song => song.songId));
          const newSongs = (fetchedSongs || []).filter(song => !existingIds.has(song.songId));
          const combined = [...prev, ...newSongs];
          sortAndProcessSongs(combined);
          return combined;
        });
        setPage(prev => prev + 1);
      }
      
      // Sort songs alphabetically and update available letters
      if (resetPagination) {
        sortAndProcessSongs(fetchedSongs || []);
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

  // Initial fetch effect (search is handled separately by handleSearchChange)
  useEffect(() => {
    fetchSongs('', true); // Initial load without search term
    
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
            const playlistSection = actualSections.find(ps => ps.title === templateSection.title);
            if (playlistSection) {
              actualSectionId = playlistSection.id;
              console.log('🚨 DEBUG - Mapped template section ID', sectionId, 'to playlist section ID', actualSectionId);
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
    setFilters(prev => ({
      ...prev,
      search: newSearchValue
    }));
    
    // Debounce the search to avoid too many API calls
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to trigger search after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      fetchSongs(newSearchValue, true);
    }, 300); // 300ms debounce
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Force immediate search by calling fetchSongs directly
    fetchSongs(filters.search, true);
  };


  
  return (
    <Layout 
      navigation={<Navigation title={t('songs.songsLibrary')} showBackButton={true} />}
    >
      <div className="songs-page">
        <div className="songs-page__header">
          <h1 className="songs-page__title">
            {t('songs.songsLibrary')}
            {filters.search && (
              <span className="songs-page__search-indicator">
                - {t('songs.searchingFor')} "{filters.search}" ({songs.length} {t('songs.results')})
              </span>
            )}
          </h1>
          
          <div className="songs-page__actions">
            <form onSubmit={handleSearchSubmit} className="songs-page__search">
              <MagnifyingGlassIcon />
              <input 
                type="text" 
                placeholder={t('songs.searchSongs')} 
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
                {t('songs.createSong')}
              </Button>
            )}
          </div>
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
              <MusicalNoteIcon />
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
            {/* Alphabet Navigation Bar */}
            {showAlphabetNav && (
              <div className="songs-page__alphabet-nav">
                <div 
                  className="songs-page__alphabet-nav-inner"
                  onTouchMove={handleAlphabetDrag}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) { // Only when mouse is pressed
                      handleAlphabetDrag(e);
                    }
                  }}
                >
                  {allLetters.map(letter => {
                    const hasLetterSongs = availableLetters.includes(letter);
                    return (
                      <button
                        key={letter}
                        className={`songs-page__alphabet-letter ${
                          hasLetterSongs ? 'songs-page__alphabet-letter--active' : 'songs-page__alphabet-letter--disabled'
                        }`}
                        onClick={() => hasLetterSongs && scrollToLetter(letter)}
                        disabled={!hasLetterSongs}
                        aria-label={`Jump to songs starting with ${letter}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="songs-page__grid">
              {sortedSongs.map(song => (
                <div 
                  key={song.songId}
                  ref={(el: HTMLDivElement | null) => {
                    songRefs.current[song.songId] = el;
                  }}
                >
                  <Card className="songs-page__card">
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
    </Layout>
  );
};

export default SongsListPage;
