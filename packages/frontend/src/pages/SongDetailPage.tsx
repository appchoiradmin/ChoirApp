import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getSongById, createSongVersion, getSongsForChoir, createSong, updateSong, updateSongVisibility } from '../services/songService';
import type { SongDto, CreateSongDto, UpdateSongDto, UpdateSongVisibilityDto, CreateSongVersionDto } from '../types/song';
import { SongVisibilityType } from '../types/song';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import ChordProViewer from '../components/ChordProViewer';
import ChordProGuide from '../components/ChordProGuide';
import styles from './SongDetailPage.module.scss';
import Layout from '../components/ui/Layout';
import Navigation from '../components/ui/Navigation';

const SongDetailPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const location = useLocation();
  const isCreateMode = location.pathname === '/songs/create';
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const { t } = useTranslation();
  const [song, setSong] = useState<SongDto | null>(null);
  const [loading, setLoading] = useState<boolean>(!isCreateMode);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedChoirId, setSelectedChoirId] = useState<string | null>(null);
  const [songVersionExists, setSongVersionExists] = useState<boolean>(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState<boolean>(!isCreateMode);
  
  // Form state for creating a new song
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [chordProContent, setChordProContent] = useState('');
  const [visibility, setVisibility] = useState<SongVisibilityType>(SongVisibilityType.PublicAll);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isVersionMode, setIsVersionMode] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<SongVisibilityType>(SongVisibilityType.PublicAll);
  const [selectedChoirsForVersion, setSelectedChoirsForVersion] = useState<string[]>([]);
  const [selectedChoirsForEdit, setSelectedChoirsForEdit] = useState<string[]>([]);
  const [selectedChoirsForCreate, setSelectedChoirsForCreate] = useState<string[]>([]);
  const [choirFilter, setChoirFilter] = useState<string>('');
  const [editChoirFilter, setEditChoirFilter] = useState<string>('');
  const [createChoirFilter, setCreateChoirFilter] = useState<string>('');

  useEffect(() => {
    const fetchSong = async () => {
      if (userLoading) {
        return; // Wait for user to load
      }

      if (isCreateMode || !songId || !user?.token) {
        setLoading(false); // Nothing to fetch in create mode
        setIsCheckingVersion(false);
        return;
      }

      try {
        const data = await getSongById(songId, user.token);
        console.log('Song data:', data);
        setSong(data);
        
        // Initialize edit form with current song data
        setEditTitle(data.title);
        setEditArtist(data.artist || '');
        setEditContent(data.content);
        setEditVisibility(data.visibility);
      } catch (err) {
        if (err instanceof Error && err.message === 'Song not found') {
          setSong(null);
        } else {
          setError('Failed to fetch song details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [songId, user, userLoading]);

  // Check if a version of this song already exists for the user's choir
  useEffect(() => {
    const checkExistingVersion = async () => {
      if (!user?.token || !user?.choirId || !songId || !song) {
        setIsCheckingVersion(false);
        return;
      }

      try {
        const choirSongs = await getSongsForChoir(user.choirId, user.token);
        const existingVersion = choirSongs.find(s => s.baseSongId === songId);
        setSongVersionExists(!!existingVersion);
      } catch (err) {
        console.error('Error checking for existing song version:', err);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    if (song) {
      checkExistingVersion();
    }
  }, [songId, song, user]);

  const handleCreateVersion = async () => {
    if (!songId || !user?.token) {
      return;
    }

    setIsProcessing(true);
    try {
      const versionDto: CreateSongVersionDto = {
        content: editContent || song?.content || '',
        visibility: editVisibility,
        visibleToChoirs: selectedChoirsForVersion
      };
      
      const newVersion = await createSongVersion(songId, versionDto, user.token);
      navigate(`/songs/${newVersion.songId}`);
    } catch (err) {
      console.error('Error creating song version:', err);
      setError('Failed to create song version');
    } finally {
      setIsProcessing(false);
      setIsVersionMode(false);
    }
  };

  const handleUpdateSong = async () => {
    if (!songId || !user?.token) {
      return;
    }

    setIsProcessing(true);
    setError(null); // Clear any previous errors
    
    try {
      const updateDto: UpdateSongDto = {
        title: editTitle,
        artist: editArtist,
        content: editContent
      };
      
      let updatedSong;
      try {
        updatedSong = await updateSong(songId, updateDto, user.token);
      } catch (updateError) {
        // If JSON parsing fails but the request might have succeeded,
        // try to refetch the song to see if it was actually updated
        console.warn('Update response parsing failed, checking if update succeeded:', updateError);
        
        try {
          const refetchedSong = await getSongById(songId, user.token);
          // Check if the song was actually updated by comparing content
          if (refetchedSong.title === editTitle && refetchedSong.content === editContent) {
            console.log('Song was successfully updated despite response parsing error');
            updatedSong = refetchedSong;
          } else {
            throw updateError; // Re-throw if the song wasn't actually updated
          }
        } catch (refetchError) {
          throw updateError; // Re-throw original error if refetch fails
        }
      }
      
      // Update visibility if it changed
      if (editVisibility !== song?.visibility) {
        try {
          const visibilityDto: UpdateSongVisibilityDto = {
            visibility: editVisibility,
            visibleToChoirs: editVisibility === SongVisibilityType.PublicChoirs ? selectedChoirsForEdit : undefined
          };
          await updateSongVisibility(songId, visibilityDto, user.token);
        } catch (visibilityError) {
          console.warn('Visibility update failed:', visibilityError);
          // Don't fail the entire operation if only visibility update fails
          setError('Song updated, but visibility change may have failed. Please refresh to verify.');
        }
      }
      
      setSong({ ...updatedSong, visibility: editVisibility });
      setIsEditMode(false);
      
      // Show success message briefly
      const successMessage = 'Song updated successfully!';
      setError(null);
      
    } catch (err) {
      console.error('Error updating song:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update song';
      setError(`Update failed: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartEdit = () => {
    setIsEditMode(true);
    setEditTitle(song?.title || '');
    setEditArtist(song?.artist || '');
    setEditContent(song?.content || '');
    setEditVisibility(song?.visibility || SongVisibilityType.PublicAll);
  };

  const handleStartVersionCreation = () => {
    setIsVersionMode(true);
    setEditContent(song?.content || '');
    setEditVisibility(SongVisibilityType.PublicChoirs);
    setSelectedChoirsForVersion([]);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setIsVersionMode(false);
    setError(null);
  };

  const isCreator = user && song && user.id === song.creatorId;
  const canEdit = isCreator;
  const canCreateVersion = user && song;

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      setError('You must be logged in to create a song');
      return;
    }

    setIsProcessing(true);
    try {
      const newSong: CreateSongDto = {
        title,
        artist,
        content: chordProContent,
        visibility,
        visibleToChoirs: visibility === SongVisibilityType.PublicChoirs ? selectedChoirsForCreate : undefined
      };
      const createdSong = await createSong(newSong, user.token);
      navigate(`/songs/${createdSong.songId}`);
    } catch (err) {
      setError('Failed to create song');
      console.error('Error creating song:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCreateForm = () => (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>{t('songs.createNewSong')}</h2>
      <form onSubmit={handleCreateSong}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>{t('songs.title')}</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder={t('songs.enterSongTitle')}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="artist" className={styles.label}>{t('songs.artist')}</label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className={styles.input}
            placeholder={t('songs.enterArtistNameOptional')}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="visibility" className={styles.label}>{t('songs.visibility')}</label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(Number(e.target.value) as SongVisibilityType)}
            className={styles.select}
          >
            <option value={SongVisibilityType.Private}>{t('songs.private')}</option>
            <option value={SongVisibilityType.PublicAll}>{t('songs.publicToAll')}</option>
            <option value={SongVisibilityType.PublicChoirs}>{t('songs.publicToChoirs')}</option>
          </select>
        </div>
        
        {/* Choir selection for create form */}
        {visibility === SongVisibilityType.PublicChoirs && user?.choirs && (
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('songs.shareWithChoirsCount', { count: user.choirs.length })}</label>
            
            {/* Filter input for large choir lists */}
            {user.choirs.length > 5 && (
              <div className={styles.filterContainer}>
                <input
                  type="text"
                  placeholder={t('songs.filterChoirs')}
                  value={createChoirFilter}
                  onChange={(e) => setCreateChoirFilter(e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            )}
            
            {/* Selected choirs summary */}
            {selectedChoirsForCreate.length > 0 && (
              <div className={styles.selectedSummary}>
                <span className={styles.selectedCount}>
                  {selectedChoirsForCreate.length} {t('songs.choirsSelected')}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedChoirsForCreate([])}
                  className={styles.clearSelection}
                >
                  {t('songs.clearAll')}
                </button>
              </div>
            )}
            
            <div className={styles.choirCheckboxes}>
              {user.choirs
                .filter(choir => 
                  createChoirFilter === '' || 
                  choir.name.toLowerCase().includes(createChoirFilter.toLowerCase())
                )
                .map((choir) => (
                  <label key={choir.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedChoirsForCreate.includes(choir.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChoirsForCreate([...selectedChoirsForCreate, choir.id]);
                        } else {
                          setSelectedChoirsForCreate(selectedChoirsForCreate.filter(id => id !== choir.id));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span className={styles.choirName}>{choir.name}</span>
                  </label>
                ))
              }
              
              {/* Show message when filter has no results */}
              {createChoirFilter && user.choirs.filter(choir => 
                choir.name.toLowerCase().includes(createChoirFilter.toLowerCase())
              ).length === 0 && (
                <div className={styles.noResults}>
                  {t('songs.noChoirsMatchFilter', { filter: createChoirFilter })}
                </div>
              )}
              
              {/* Show message when no choirs available */}
              {user.choirs.length === 0 && (
                <div className={styles.noChoirs}>
                  {t('songs.notMemberOfAnyChoirs')}
                </div>
              )}
            </div>
            
            {/* Quick select options for convenience */}
            {user.choirs.length > 3 && (
              <div className={styles.quickActions}>
                <button
                  type="button"
                  onClick={() => setSelectedChoirsForCreate(user.choirs.map(c => c.id))}
                  className={styles.selectAllButton}
                  disabled={selectedChoirsForCreate.length === user.choirs.length}
                >
                  {t('songs.selectAll')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="chordProContent" className={styles.label}>{t('songs.chordProContent')}</label>
          <ChordProGuide />
          <textarea
            id="chordProContent"
            value={chordProContent}
            onChange={(e) => setChordProContent(e.target.value)}
            className={styles.textarea}
            placeholder={t('songs.enterChordPro')}
            rows={10}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={styles.submitButton}
        >
          {isProcessing ? t('songs.creating') : t('songs.createSong')}
        </button>
      </form>
    </div>
  );

  if (loading || userLoading) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title={t('common.loading')} 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        <div className={styles.loading}>{t('common.loading')}...</div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title={t('common.error')} 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        <div className={styles.error}>{error}</div>
      </Layout>
    );
  }

  if (isCreateMode) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title={t('songs.createSong')} 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        {renderCreateForm()}
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout 
        navigation={
          <Navigation 
            title={t('songs.notFound')} 
            showBackButton={true}
            onBackClick={() => navigate(-1)}
          />
        }
      >
        <div className={styles.notFound}>{t('songs.songNotFound')}</div>
      </Layout>
    );
  }

  // Render edit form for current song (creator only)
  const renderEditForm = () => (
    <div className={styles.editContainer}>
      <div className={styles.editForm}>
        <div className={styles.formGroup}>
          <label htmlFor="editTitle" className={styles.label}>{t('songs.title')}</label>
          <input
            id="editTitle"
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={styles.input}
            placeholder="Enter song title"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="editArtist" className={styles.label}>{t('songs.artist')}</label>
          <input
            id="editArtist"
            type="text"
            value={editArtist}
            onChange={(e) => setEditArtist(e.target.value)}
            className={styles.input}
            placeholder={t('songs.enterArtistName')}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="editVisibility" className={styles.label}>{t('songs.visibility')}</label>
          <select
            id="editVisibility"
            value={editVisibility}
            onChange={(e) => setEditVisibility(Number(e.target.value) as SongVisibilityType)}
            className={styles.select}
          >
            <option value={SongVisibilityType.Private}>Private</option>
            <option value={SongVisibilityType.PublicAll}>Public to All</option>
            <option value={SongVisibilityType.PublicChoirs}>Public to Choirs</option>
          </select>
        </div>
        
        {/* Choir selection for edit form */}
        {editVisibility === SongVisibilityType.PublicChoirs && user?.choirs && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Share with Choirs ({user.choirs.length} available)</label>
            
            {/* Filter input for large choir lists */}
            {user.choirs.length > 5 && (
              <div className={styles.filterContainer}>
                <input
                  type="text"
                  placeholder="Filter choirs..."
                  value={editChoirFilter}
                  onChange={(e) => setEditChoirFilter(e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            )}
            
            {/* Selected choirs summary */}
            {selectedChoirsForEdit.length > 0 && (
              <div className={styles.selectedSummary}>
                <span className={styles.selectedCount}>
                  {selectedChoirsForEdit.length} {t('songs.choirsSelected')}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedChoirsForEdit([])}
                  className={styles.clearSelection}
                >
                  Clear all
                </button>
              </div>
            )}
            
            <div className={styles.choirCheckboxes}>
              {user.choirs
                .filter(choir => 
                  editChoirFilter === '' || 
                  choir.name.toLowerCase().includes(editChoirFilter.toLowerCase())
                )
                .map((choir) => (
                  <label key={choir.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedChoirsForEdit.includes(choir.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChoirsForEdit([...selectedChoirsForEdit, choir.id]);
                        } else {
                          setSelectedChoirsForEdit(selectedChoirsForEdit.filter(id => id !== choir.id));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span className={styles.choirName}>{choir.name}</span>
                  </label>
                ))
              }
              
              {/* Show message when filter has no results */}
              {editChoirFilter && user.choirs.filter(choir => 
                choir.name.toLowerCase().includes(editChoirFilter.toLowerCase())
              ).length === 0 && (
                <div className={styles.noResults}>
                  {t('songs.noChoirsMatch')} "{editChoirFilter}"
                </div>
              )}
              
              {/* Show message when no choirs available */}
              {user.choirs.length === 0 && (
                <div className={styles.noChoirs}>
                  You are not a member of any choirs yet.
                </div>
              )}
            </div>
            
            {/* Quick select options for convenience */}
            {user.choirs.length > 3 && (
              <div className={styles.quickActions}>
                <button
                  type="button"
                  onClick={() => setSelectedChoirsForEdit(user.choirs.map(c => c.id))}
                  className={styles.selectAllButton}
                  disabled={selectedChoirsForEdit.length === user.choirs.length}
                >
                  Select All
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="editContent" className={styles.label}>ChordPro Content</label>
          <textarea
            id="editContent"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.textarea}
            rows={12}
            placeholder="Enter ChordPro content..."
          />
        </div>
        
        <div className={styles.buttonGroup}>
          <button
            onClick={handleUpdateSong}
            disabled={isProcessing}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {isProcessing ? 'Updating...' : 'Update Song'}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isProcessing}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Render version creation form
  const renderVersionForm = () => (
    <div className={styles.versionContainer}>
      <div className={styles.versionForm}>
        <h3 className={styles.versionTitle}>Create New Version</h3>
        
        <div className={styles.formGroup}>
          <label htmlFor="versionVisibility" className={styles.label}>Visibility</label>
          <select
            id="versionVisibility"
            value={editVisibility}
            onChange={(e) => setEditVisibility(Number(e.target.value) as SongVisibilityType)}
            className={styles.select}
          >
            <option value={SongVisibilityType.Private}>Private</option>
            <option value={SongVisibilityType.PublicAll}>Public to All</option>
            <option value={SongVisibilityType.PublicChoirs}>Public to Choirs</option>
          </select>
        </div>
        
        {editVisibility === SongVisibilityType.PublicChoirs && user?.choirs && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Share with Choirs ({user.choirs.length} available)</label>
            
            {/* Filter input for large choir lists */}
            {user.choirs.length > 5 && (
              <div className={styles.filterContainer}>
                <input
                  type="text"
                  placeholder="Filter choirs..."
                  value={choirFilter}
                  onChange={(e) => setChoirFilter(e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            )}
            
            {/* Selected choirs summary */}
            {selectedChoirsForVersion.length > 0 && (
              <div className={styles.selectedSummary}>
                <span className={styles.selectedCount}>
                  {selectedChoirsForVersion.length} choir{selectedChoirsForVersion.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedChoirsForVersion([])}
                  className={styles.clearSelection}
                >
                  Clear all
                </button>
              </div>
            )}
            
            <div className={styles.choirCheckboxes}>
              {user.choirs
                .filter(choir => 
                  choirFilter === '' || 
                  choir.name.toLowerCase().includes(choirFilter.toLowerCase())
                )
                .map((choir) => (
                  <label key={choir.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedChoirsForVersion.includes(choir.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChoirsForVersion([...selectedChoirsForVersion, choir.id]);
                        } else {
                          setSelectedChoirsForVersion(selectedChoirsForVersion.filter(id => id !== choir.id));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span className={styles.choirName}>{choir.name}</span>
                  </label>
                ))
              }
              
              {/* Show message when filter has no results */}
              {choirFilter && user.choirs.filter(choir => 
                choir.name.toLowerCase().includes(choirFilter.toLowerCase())
              ).length === 0 && (
                <div className={styles.noResults}>
                  No choirs match "{choirFilter}"
                </div>
              )}
              
              {/* Show message when no choirs available */}
              {user.choirs.length === 0 && (
                <div className={styles.noChoirs}>
                  You are not a member of any choirs yet.
                </div>
              )}
            </div>
            
            {/* Quick select options for convenience */}
            {user.choirs.length > 3 && (
              <div className={styles.quickActions}>
                <button
                  type="button"
                  onClick={() => setSelectedChoirsForVersion(user.choirs.map(c => c.id))}
                  className={styles.selectAllButton}
                  disabled={selectedChoirsForVersion.length === user.choirs.length}
                >
                  Select All
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="versionContent" className={styles.label}>ChordPro Content</label>
          <textarea
            id="versionContent"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.textarea}
            rows={12}
            placeholder="Modify the content for your version..."
          />
        </div>
        
        <div className={styles.buttonGroup}>
          <button
            onClick={handleCreateVersion}
            disabled={isProcessing}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {isProcessing ? 'Creating...' : 'Create Version'}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isProcessing}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout 
      navigation={
        <Navigation 
          title={isEditMode ? 'Edit Song' : isVersionMode ? 'Create Version' : song?.title || 'Song Details'} 
          showBackButton={true}
          onBackClick={() => navigate(-1)}
        />
      }
    >
      <div className={styles.container}>
        {isEditMode ? (
          renderEditForm()
        ) : isVersionMode ? (
          renderVersionForm()
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>{song?.title}</h1>
              <p className={styles.artist}>{song?.artist || 'Unknown Artist'}</p>
              
              {/* Mobile-first action buttons */}
              <div className={styles.actionButtons}>
                {canEdit && (
                  <button
                    onClick={handleStartEdit}
                    className={`${styles.actionButton} ${styles.editButton}`}
                    disabled={isProcessing}
                  >
                    Edit Song
                  </button>
                )}
                
                {canCreateVersion && (
                  <button
                    onClick={handleStartVersionCreation}
                    className={`${styles.actionButton} ${styles.versionButton}`}
                    disabled={isProcessing}
                  >
                    Create Version
                  </button>
                )}
              </div>
              
              {/* Legacy version creation UI - keep for backward compatibility */}
              {user?.choirId && !songVersionExists && !isCheckingVersion && !canEdit && (
                <div className={styles.legacyVersionControls}>
                  <select
                    value={selectedChoirId || ''}
                    onChange={(e) => setSelectedChoirId(e.target.value)}
                    disabled={isProcessing}
                    className={styles.choirSelect}
                  >
                    <option value="">Select a choir</option>
                    {user.choirs.map((choir) => (
                      <option key={choir.id} value={choir.id}>
                        {choir.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedChoirId) {
                        setSelectedChoirsForVersion([selectedChoirId]);
                        handleCreateVersion();
                      }
                    }}
                    disabled={!selectedChoirId || isProcessing}
                    className={styles.legacyCreateButton}
                  >
                    {isProcessing ? 'Creating...' : 'Create Version for My Choir'}
                  </button>
                </div>
              )}
              
              {songVersionExists && (
                <div className={styles.versionExists}>
                  <p>A version of this song already exists for your choir.</p>
                </div>
              )}
            </div>
            
            <div className={styles.tags}>
              {song?.tags && song.tags.map((tag) => (
                <span key={tag.tagId} className={styles.tag}>
                  {tag.tagName}
                </span>
              ))}
            </div>
            
            <div className={styles.content}>
              {song && <ChordProViewer source={song.content} />}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SongDetailPage;
