import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getSongById, updateSong } from '../services/songService';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import ChordProViewer from '../components/ChordProViewer';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  MusicalNoteIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookmarkIcon as SaveIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import './SongVersionEditorPage.scss';

import { SongDto } from '../types/song';

const SongVersionEditorPage: React.FC = () => {
  const { choirId, songId } = useParams<{ choirId: string; songId: string }>();
  const navigate = useNavigate();
  const { token } = useUser();
  const { t } = useTranslation();
  
  const [song, setSong] = useState<SongDto | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !autoSaveEnabled || !song || !token) return;
    
    try {
      await updateSong(songId!, { 
        title: song.title,
        artist: song.artist === null ? undefined : song.artist,
        content: content
      }, token);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [hasUnsavedChanges, autoSaveEnabled, song, token, songId, content]);

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(autoSave, 3000); // Auto-save after 3 seconds of inactivity
    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, autoSave]);

  // Load song data
  useEffect(() => {
    const loadSong = async () => {
      if (!token || !songId) return;

      try {
        setIsLoading(true);
        
        const songData = await getSongById(songId, token);

        setSong(songData);
        setContent(songData.content || '');
      } catch (error) {
        console.error('Error loading song:', error);
        toast.error(t('songVersionEditor.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSong();
  }, [token, songId]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  // Manual save
  const handleSave = async () => {
    if (!song || !token) return;
    
    try {
      setSaving(true);
      await updateSong(songId!, { 
        title: song.title,
        artist: song.artist === null ? undefined : song.artist,
        content: content
      }, token);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success(t('songVersionEditor.savedSuccessfully'));
    } catch (error) {
      console.error('Error saving song:', error);
      toast.error(t('songVersionEditor.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm(t('songVersionEditor.unsavedChangesConfirm'))) {
        navigate(`/choirs/${choirId}`);
      }
    } else {
      navigate(`/choirs/${choirId}`);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'p') {
          e.preventDefault();
          setIsPreviewMode(!isPreviewMode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, handleSave]);

  if (isLoading) {
    return (
      <Layout>
        <div className="song-editor-loading">
          <LoadingSpinner size="lg" />
          <p className="loading-text">{t('songVersionEditor.loadingText')}</p>
        </div>
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout>
        <div className="song-editor-error">
          <ExclamationTriangleIcon className="error-icon" />
          <h2 className="error-title">{t('songVersionEditor.songNotFoundTitle')}</h2>
          <p className="error-message">{t('songVersionEditor.songNotFoundMessage')}</p>
          <Button variant="primary" onClick={() => navigate(`/choirs/${choirId}`)}>
            <ArrowLeftIcon className="button-icon" />
            {t('songVersionEditor.backToChoir')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="song-editor-container">
        {/* Header */}
        <div className="editor-header">
          <div className="header-content">
            <div className="header-left">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="back-button"
              >
                <ArrowLeftIcon className="button-icon" />
                {t('songVersionEditor.back')}
              </Button>
              
              <div className="song-editor-header">
                <h1 className="song-title">{song?.title}</h1>
                {song && (
                  <div className="song-metadata">
                    {song.artist && <span className="song-artist">{t('songVersionEditor.by', { artist: song.artist })}</span>}
                    <div className="song-tags">
                      {song.tags && song.tags.length > 0 && (
                        <div className="tags-container">
                          {song.tags.map(tag => (
                            <span key={tag.tagId} className="tag">{tag.tagName}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="header-actions">
              <div className="save-status">
                {hasUnsavedChanges ? (
                  <span className="unsaved-indicator">
                    <ClockIcon className="status-icon" />
                    {t('songVersionEditor.unsavedChanges')}
                  </span>
                ) : lastSaved ? (
                  <span className="saved-indicator">
                    <CheckCircleIcon className="status-icon" />
                    {t('songVersionEditor.saved', { time: lastSaved.toLocaleTimeString() })}
                  </span>
                ) : null}
              </div>

              <Button
                variant="outlined"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="preview-toggle"
              >
                {isPreviewMode ? (
                  <>
                    <PencilIcon className="button-icon" />
                    {t('songVersionEditor.edit')}
                  </>
                ) : (
                  <>
                    <EyeIcon className="button-icon" />
                    {t('songVersionEditor.preview')}
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                loading={isSaving}
              >
                <SaveIcon className="button-icon" />
                {t('songVersionEditor.save')}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor/Preview */}
        <div className="editor-content">
          {isPreviewMode ? (
            <Card className="preview-card">
              <div className="preview-header">
                <MusicalNoteIcon className="preview-icon" />
                <h3>{t('songVersionEditor.previewMode')}</h3>
              </div>
              <ChordProViewer source={content} />
            </Card>
          ) : (
            <Card className="editor-card">
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <DocumentTextIcon className="editor-icon" />
                  <h3>{t('songVersionEditor.chordProEditor')}</h3>
                </div>
                
                <div className="toolbar-right">
                  <label className="auto-save-toggle">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    />
                    {t('songVersionEditor.autoSave')}
                  </label>
                </div>
              </div>

              <div className="editor-wrapper">
                <textarea
                  className="chord-pro-editor"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={t('songVersionEditor.placeholder')}
                  spellCheck={false}
                />
              </div>

              <div className="editor-footer">
                <div className="editor-tips">
                  <p><strong>{t('songVersionEditor.tips')}</strong></p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Reference Card - Original Content */}
        {song?.baseSongId && song.content !== content && (
          <Card className="reference-card">
            <div className="reference-header">
              <h3>{t('songVersionEditor.originalSongContent')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => song && setContent(song.content)}
              >
                {t('songVersionEditor.resetToOriginal')}
              </Button>
            </div>
            <ChordProViewer source={song?.content || ''} />
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SongVersionEditorPage;
