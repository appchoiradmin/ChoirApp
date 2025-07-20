import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { getPlaylistById as getPlaylist, getPlaylistsByChoirId, updatePlaylist, getPlaylistTemplatesByChoirId, removeSongFromPlaylist, UpdatePlaylistDto } from '../services/playlistService';
import { SongDto } from '../types/song';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import { getSongsForChoir } from '../services/songService';
import { searchSongs } from '../services/songService';
import { PlaylistTemplate, PlaylistSection, PlaylistSong } from '../types/playlist';
import { PlaylistProvider } from '../context/PlaylistContext';
// Removed legacy ChoirSongVersionDto import
import MovableSongItem from '../components/MovableSongItem';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MusicalNoteIcon,
  PlusIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import './EditPlaylistPage.scss';

const EditPlaylistPage: React.FC = () => {
  const { token } = useUser();
  const { t } = useTranslation();
  const { playlistId: routePlaylistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<any[]>([]); // TODO: type properly
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<PlaylistTemplate | null>(null);
  const [sections, setSections] = useState<PlaylistSection[]>([]);
  const [choirSongs, setChoirSongs] = useState<SongDto[]>([]);
  const [allSongs, setAllSongs] = useState<SongDto[]>([]);
  
  // UI State
  const [playlistSelectorOpen, setPlaylistSelectorOpen] = useState(false);

  // Fetch all playlists for the choir and select the target playlist
  useEffect(() => {
    // If the selected playlist is a draft/in-memory (not persisted), initialize sections from template and skip API calls
    if (selectedPlaylistId === 'draft') {
      setLoading(false);
      return;
    }
    
    const fetchPlaylistsAndSelectDefault = async () => {
      if (!token) return;
      setError(null);
      
      try {
        // Try to get choirId from route playlist
        let choirId = null;
        let playlistsResp: any[] = [];
        
        if (routePlaylistId) {
          try {
            const playlist = await getPlaylist(routePlaylistId, token);
            choirId = playlist.choirId;
            setSelectedPlaylist(playlist);
          } catch (err) { 
            console.error('Error fetching route playlist:', err);
            setError(t('editPlaylist.failedToLoad'));
            return;
          }
        }
        
        if (!choirId && playlists.length > 0) {
          choirId = playlists[0].choirId;
        }
        
        if (choirId) {
          playlistsResp = await getPlaylistsByChoirId(choirId, token);
          setPlaylists(playlistsResp);
          
          // Find next Sunday (or today if Sunday)
          const today = new Date();
          const getSunday = (d: Date) => {
            const day = d.getDay();
            const diff = day === 0 ? 0 : 7 - day;
            const sunday = new Date(d);
            sunday.setDate(d.getDate() + diff);
            sunday.setHours(0,0,0,0);
            return sunday;
          };
          
          const nextSunday = getSunday(today);
          let defaultPlaylist = playlistsResp.find(p => {
            const pd = new Date(p.date);
            return pd.toDateString() === nextSunday.toDateString();
          });
          
          if (!defaultPlaylist) {
            // If no playlist for next Sunday, pick the closest future playlist
            defaultPlaylist = playlistsResp.filter(p => new Date(p.date) >= today)
              .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          }
          
          setSelectedPlaylistId(routePlaylistId || (defaultPlaylist ? defaultPlaylist.id : (playlistsResp[0]?.id ?? null)));
        }
      } catch (err) {
        console.error('Error in fetchPlaylistsAndSelectDefault:', err);
        setError('Failed to load playlists');
      }
    };
    
    fetchPlaylistsAndSelectDefault();
    // eslint-disable-next-line
  }, [routePlaylistId, token]);

  // Fetch data for selected playlist
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token || !selectedPlaylistId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching initial data for playlist:", selectedPlaylistId);
        const playlist = await getPlaylist(selectedPlaylistId, token);
        
        const [fetchedTemplates, fetchedChoirSongs, fetchedAllSongs] = await Promise.all([
          getPlaylistTemplatesByChoirId(playlist.choirId, token),
          getSongsForChoir(playlist.choirId, token),
          searchSongs({}, token)
        ]);

        console.log("Playlist data:", playlist);
        console.log("Templates data:", fetchedTemplates);
        console.log("Fetched choir songs:", fetchedChoirSongs);
        console.log("Fetched all songs:", fetchedAllSongs);

        setTitle(playlist.title || '');
        setIsPublic(playlist.isPublic);
        setSelectedPlaylist(playlist);
        
        // Always use template sections if playlist has no sections and a template exists
        let appliedSections = playlist.sections;
        let templateToApply = null;
        
        // Always prefer playlist's template, otherwise first available
        if (playlist.playlistTemplateId && fetchedTemplates.length > 0) {
          templateToApply = fetchedTemplates.find(t => t.id === playlist.playlistTemplateId) || fetchedTemplates[0];
        } else if (fetchedTemplates.length > 0) {
          templateToApply = fetchedTemplates[0];
        }
        
        setSections(appliedSections); // sections is always the backend value
        setSelectedTemplate(templateToApply); // always set a template if available

        setChoirSongs(fetchedChoirSongs);
        setAllSongs(fetchedAllSongs);
      } catch (error) {
        console.error('Error fetching playlist data:', error);
        setError('Failed to load playlist data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedPlaylistId, token]);


  const handleRemoveSongFromSection = async (sectionId: string, songId: string) => {
    if (!token || !selectedPlaylistId) return;
    
    try {
      setSaving(true);
      await removeSongFromPlaylist(selectedPlaylistId, songId, token);
      
      const newSections = sections.map(section => {
        if (section.id === sectionId) {
          const newSongs = section.songs.filter(s => s.songId !== songId);
          return { ...section, songs: newSongs };
        }
        return section;
      });
      
      setSections(newSections);
      toast.success('Song removed from playlist');
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error(t('editPlaylist.failedToRemoveSong'));
    } finally {
      setSaving(false);
    }
  };

  const handleMoveSong = async (song: PlaylistSong, fromSectionId: string, toSectionId: string) => {
    if (fromSectionId === toSectionId) return;

    let songToMove: PlaylistSong | undefined;

    // Remove the song from the source section
    const getSongKey = (s: PlaylistSong) => s.songId;
    const songKey = song.songId;

    const sectionsWithSongRemoved = sections.map(section => {
      if (section.id === fromSectionId) {
        songToMove = section.songs.find(s => getSongKey(s) === songKey);
        return {
          ...section,
          songs: section.songs.filter(s => getSongKey(s) !== songKey),
        };
      }
      return section;
    });

    if (!songToMove) return;

    // Add the song to the destination section
    const sectionsWithSongAdded = sectionsWithSongRemoved.map(section => {
      if (section.id === toSectionId) {
        return {
          ...section,
          songs: [...section.songs, songToMove!],
        };
      }
      return section;
    });

    setSections(sectionsWithSongAdded);
    
    if (!token || !selectedPlaylistId) return;
    
    try {
      setSaving(true);
      // Map sections and songs to backend DTO structure
      const mappedSections = sectionsWithSongAdded.map((section, sectionIdx) => ({
        title: section.title,
        order: sectionIdx,
        songs: section.songs.map((song, songIdx) => ({
          songId: song.songId,
          order: songIdx,
        }))
      }));

      if (mappedSections.length === 0) {
        const confirmed = window.confirm('You are about to remove all sections from this playlist. This action cannot be undone. Are you sure?');
        if (!confirmed) {
          toast.error('Playlist update cancelled. No changes were saved.');
          return;
        }
      }

      const payload = {
        title,
        isPublic,
        sections: mappedSections,
        playlistTemplateId: selectedTemplate?.id,
      };
      
      console.log('[Playlist] updatePlaylist payload:', JSON.stringify(payload, null, 2));
      await updatePlaylist(selectedPlaylistId, payload as UpdatePlaylistDto, token);
      toast.success('Song moved successfully');
    } catch (error) {
      console.error('[Playlist] updatePlaylist error:', error);
      toast.error('Failed to move song. Please try again.');
      // Revert the sections state on error
      setSections(sections);
    } finally {
      setSaving(false);
    }
  };

  // Utility functions
  const handleAddSongs = () => {
    navigate('/songs');
  };

  const getTotalSongs = () => {
    return sections.reduce((total, section) => total + section.songs.length, 0);
  };

  const getTotalDuration = () => {
    // TODO: Calculate total duration when song duration is available
    return '~25 min';
  };

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setPlaylistSelectorOpen(false);
  };

  const getPlaylistDisplayDate = (playlist: any) => {
    if (!playlist.date) return t('editPlaylist.noDate');
    return new Date(playlist.date).toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="edit-playlist-container">
          <div className="playlist-loading">
            <LoadingSpinner size="lg" />
            <p className="loading-text">{t('editPlaylist.loadingPlaylist')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="edit-playlist-container">
          <div className="playlist-error">
            <InformationCircleIcon className="error-icon" />
            <h2 className="error-title">{t('editPlaylist.unableToLoad')}</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <Button variant="primary" onClick={() => window.location.reload()}>
                {t('editPlaylist.tryAgain')}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/playlists')}>
                {t('editPlaylist.backToPlaylists')}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="edit-playlist-container">
        {/* Header Section */}
        <div className="playlist-header">
          <div className="header-content">
            <div className="header-left">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeftIcon />}
                onClick={() => navigate('/playlists')}
                className="back-button"
              >
                Back
              </Button>
              <h1 className="playlist-title">
                <Cog6ToothIcon className="title-icon" />
                Edit Playlist
              </h1>
              <div className="playlist-meta">
                <span className="meta-item">
                  <CalendarDaysIcon className="meta-icon" />
                  {selectedPlaylist ? getPlaylistDisplayDate(selectedPlaylist) : 'Loading...'}
                </span>
                <span className="meta-item">
                  <MusicalNoteIcon className="meta-icon" />
                  {getTotalSongs()} song{getTotalSongs() !== 1 ? 's' : ''}
                </span>
                <span className="meta-item">
                  <ClockIcon className="meta-icon" />
                  {getTotalDuration()}
                </span>
                {isPublic && (
                  <span className="meta-item public-badge">
                    <UserGroupIcon className="meta-icon" />
                    Public
                  </span>
                )}
              </div>
            </div>
            {/* <div className="header-actions">
              <div className="action-buttons">
                <Button 
                  variant="primary" 
                  leftIcon={<PlusIcon />}
                  onClick={handleAddSongs}
                  className="add-songs-button"
                >
                  Add Songs from Master Songs
                </Button>
              </div>
            </div> */}
          </div>
          
          {/* Stats Cards - Mobile Optimized */}
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{sections.length}</span>
              <span className="stat-label">Sections</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{getTotalSongs()}</span>
              <span className="stat-label">Total Songs</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{getTotalDuration()}</span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{selectedTemplate ? '1' : '0'}</span>
              <span className="stat-label">Template</span>
            </div>
          </div>
        </div>

        {/* Playlist Selector */}
        {playlists.length > 1 && (
          <div className="playlist-selector-card">
            <Card>
              <div className="selector-header">
                <h3 className="selector-title">Select Playlist to Edit</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPlaylistSelectorOpen(!playlistSelectorOpen)}
                  rightIcon={playlistSelectorOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {playlistSelectorOpen ? 'Hide' : 'Show'} Options
                </Button>
              </div>
              
              {playlistSelectorOpen && (
                <div className="playlist-options">
                  {playlists
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(playlist => (
                      <button
                        key={playlist.id}
                        className={`playlist-option ${selectedPlaylistId === playlist.id ? 'selected' : ''}`}
                        onClick={() => handlePlaylistSelect(playlist.id)}
                      >
                        <div className="option-content">
                          <span className="option-date">{getPlaylistDisplayDate(playlist)}</span>
                          <span className="option-title">{playlist.title || 'Untitled Playlist'}</span>
                          <span className="option-songs">{playlist.sections?.reduce((total: number, section: any) => total + (section.songs?.length || 0), 0) || 0} songs</span>
                        </div>
                        {selectedPlaylistId === playlist.id && (
                          <CheckIcon className="selected-icon" />
                        )}
                      </button>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Content Section */}
        <div className="playlist-content">
          {sections.length === 0 ? (
            <div className="empty-state">
              <MusicalNoteIcon className="empty-icon" />
              <h2 className="empty-title">No Songs in Playlist</h2>
              <p className="empty-message">
                This playlist doesn't have any songs yet. Start building your playlist by adding songs to sections.
              </p>
              <div className="empty-actions">
                <Button 
                  variant="primary" 
                  leftIcon={<PlusIcon />}
                  onClick={handleAddSongs}
                  className="empty-cta"
                >
                  Add Songs
                </Button>
              </div>
            </div>
          ) : (
            <div className="playlist-sections">
              {(() => {
                const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
                return displayedSections
                  .slice()
                  .sort((a: PlaylistSection, b: PlaylistSection) => a.order - b.order)
                  .map((section: PlaylistSection, idx: number) => (
                    <div key={section.id || idx} className="section-card">
                      <Card>
                        <div className="section-header">
                          <h3 className="section-title">{section.title}</h3>
                          <div className="section-meta">
                            <span className="song-count">
                              {section.songs?.length || 0} song{(section.songs?.length || 0) !== 1 ? 's' : ''}
                            </span>
                            {saving && (
                              <span className="saving-indicator">
                                <LoadingSpinner size="sm" />
                                Saving...
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {section.songs && section.songs.length > 0 ? (
                          <div className="section-songs">
                            {section.songs.map((song: PlaylistSong, songIdx: number) => (
                              <MovableSongItem
                                key={song.id || songIdx}
                                song={song}
                                section={section}
                                sections={displayedSections}
                                songs={[...choirSongs, ...allSongs]}
                                onMoveSong={handleMoveSong}
                                onRemoveSong={() => handleRemoveSongFromSection(section.id, song.songId)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="section-empty">
                            <p className="empty-text">No songs in this section yet.</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              leftIcon={<PlusIcon />}
                              onClick={handleAddSongs}
                            >
                              Add Songs
                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                  ));
              })()}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function EditPlaylistPageWrapper() {
  const { token } = useUser();
  const { choirId } = useParams<{ choirId: string }>();
  // Use today's date as default for editing
  const date = new Date();
  return (
    <PlaylistProvider choirId={choirId ?? null} date={date} token={token}>
      <EditPlaylistPage />
    </PlaylistProvider>
  );
}

