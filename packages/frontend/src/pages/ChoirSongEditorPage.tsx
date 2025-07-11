import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getChoirSongById, updateChoirSongVersion } from '../services/choirSongService';
import { getMasterSongById } from '../services/masterSongService';
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
import './ChoirSongEditorPage.scss';

interface Song {
  choirSongId: string;
  masterSongId: string;
  choirId: string;
  editedLyricsChordPro: string;
  lastEditedDate: string;
  editorUserId: string;
  masterSong?: MasterSong;
}

interface MasterSong {
  songId: string;
  title: string;
  artist: string | null;
  lyricsChordPro: string;
  tags: Array<{ tagId: string; tagName: string }>;
}

const ChoirSongEditorPage: React.FC = () => {
  const { choirId, songId } = useParams<{ choirId: string; songId: string }>();
  const navigate = useNavigate();
  const { token } = useUser();
  
  const [song, setSong] = useState<Song | null>(null);
  const [masterSong, setMasterSong] = useState<MasterSong | null>(null);
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
      await updateChoirSongVersion(choirId!, songId!, { editedLyricsChordPro: content }, token);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [hasUnsavedChanges, autoSaveEnabled, song, token, choirId, songId, content]);

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(autoSave, 3000); // Auto-save after 3 seconds of inactivity
    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, autoSave]);

  // Load song data
  useEffect(() => {
    const loadSong = async () => {
      if (!token || !choirId || !songId) return;

      try {
        setIsLoading(true);
        
        const songData = await getChoirSongById(choirId, songId, token);
        const masterSongData = await getMasterSongById(songData.masterSongId.toString(), token);

        setSong(songData);
        setMasterSong(masterSongData);
        setContent(songData.editedLyricsChordPro || masterSongData.lyricsChordPro || '');
      } catch (error) {
        console.error('Error loading song:', error);
        toast.error('Failed to load song');
      } finally {
        setIsLoading(false);
      }
    };

    loadSong();
  }, [token, choirId, songId]);

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

      await updateChoirSongVersion(choirId!, songId!, { editedLyricsChordPro: content }, token);

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('Song saved successfully');
    } catch (error) {
      console.error('Error saving song:', error);
      toast.error('Failed to save song');
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
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
          <p className="loading-text">Loading song editor...</p>
        </div>
      </Layout>
    );
  }

  if (!song || !masterSong) {
    return (
      <Layout>
        <div className="song-editor-error">
          <ExclamationTriangleIcon className="error-icon" />
          <h2 className="error-title">Song Not Found</h2>
          <p className="error-message">The requested song could not be found.</p>
          <Button variant="primary" onClick={() => navigate(`/choirs/${choirId}`)}>
            <ArrowLeftIcon className="button-icon" />
            Back to Choir
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
                Back
              </Button>
              
              <div className="song-info">
                <h1 className="song-title">{masterSong?.title || 'Untitled Song'}</h1>
                <p className="song-meta">
                  by {masterSong?.artist || 'Unknown Artist'}
                  {masterSong?.tags && masterSong.tags.length > 0 && (
                    <span className="song-tags">
                      {masterSong.tags.map(tag => (
                        <span key={tag.tagId} className="tag">{tag.tagName}</span>
                      ))}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="header-actions">
              <div className="save-status">
                {hasUnsavedChanges ? (
                  <span className="unsaved-indicator">
                    <ClockIcon className="status-icon" />
                    Unsaved changes
                  </span>
                ) : lastSaved ? (
                  <span className="saved-indicator">
                    <CheckCircleIcon className="status-icon" />
                    Saved {lastSaved.toLocaleTimeString()}
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
                    Edit
                  </>
                ) : (
                  <>
                    <EyeIcon className="button-icon" />
                    Preview
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
                Save
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
                <h3>Preview Mode</h3>
              </div>
              <ChordProViewer source={content} />
            </Card>
          ) : (
            <Card className="editor-card">
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <DocumentTextIcon className="editor-icon" />
                  <h3>ChordPro Editor</h3>
                </div>
                
                <div className="toolbar-right">
                  <label className="auto-save-toggle">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    />
                    Auto-save
                  </label>
                </div>
              </div>

              <div className="editor-wrapper">
                <textarea
                  className="chord-pro-editor"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter ChordPro content here..."
                  spellCheck={false}
                />
              </div>

              <div className="editor-footer">
                <div className="editor-tips">
                  <p><strong>Tips:</strong> Use {'{'}C{'}'} for chords, [Verse 1] for sections. Press Ctrl+S to save, Ctrl+P to preview.</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Reference Card */}
        {masterSong?.lyricsChordPro && masterSong.lyricsChordPro !== content && (
          <Card className="reference-card">
            <div className="reference-header">
              <h3>Original Master Song</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setContent(masterSong.lyricsChordPro)}
              >
                Reset to Original
              </Button>
            </div>
            <ChordProViewer source={masterSong.lyricsChordPro} />
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ChoirSongEditorPage;
