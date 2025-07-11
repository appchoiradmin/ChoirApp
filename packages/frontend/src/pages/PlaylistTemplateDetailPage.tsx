import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplateById, deletePlaylistTemplate } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';
import Layout from '../components/ui/Layout';
import Navigation from '../components/ui/Navigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  MusicalNoteIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import './PlaylistTemplateDetailPage.scss';

const PlaylistTemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { token } = useUser();
  const [template, setTemplate] = useState<PlaylistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (templateId && token) {
      const fetchTemplate = async () => {
        try {
          const fetchedTemplate = await getPlaylistTemplateById(templateId, token);
          setTemplate(fetchedTemplate);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch playlist template');
        } finally {
          setLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [templateId, token]);

  const handleDelete = async () => {
    if (!template || !templateId || !token) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.title}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      setDeleting(true);
      try {
        await deletePlaylistTemplate(templateId, token);
        navigate('/playlist-templates');
      } catch (err: any) {
        console.error('Failed to delete template:', err);
        setError('Failed to delete template');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="template-detail-loading">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="template-detail-error">
          <ExclamationCircleIcon className="error-icon" />
          <h2 className="error-title">Error Loading Template</h2>
          <p className="error-message">{error}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  if (!template) {
    return (
      <Layout>
        <div className="template-detail-error">
          <DocumentTextIcon className="error-icon" />
          <h2 className="error-title">Template Not Found</h2>
          <p className="error-message">The requested template could not be found.</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const totalSongs = template.sections.reduce((sum, section) => sum + section.songs.length, 0);

  return (
    <Layout 
      navigation={
        <Navigation 
          title="Template Details" 
          showBackButton={true} 
          onBackClick={() => navigate(-1)}
        />
      }
    >
      <div className="template-detail-container">
        {/* Header */}
        <div className="template-detail-header">
          <div className="header-content">
            <div className="header-info">
              <div className="header-title">
                <h1 className="page-title">{template.title}</h1>
              </div>
              {template.description && (
                <p className="template-description">{template.description}</p>
              )}
            </div>
            
            <div className="header-actions">
              <Button
                variant="primary"
                leftIcon={<PencilIcon />}
                onClick={() => navigate(`/playlist-templates/${templateId}/edit`)}
                className="action-button"
              >
                Edit Template
              </Button>
              <Button
                variant="outlined"
                leftIcon={<TrashIcon />}
                onClick={handleDelete}
                disabled={deleting}
                className="action-button"
              >
                {deleting ? 'Deleting...' : 'Delete Template'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="template-stats">
          <Card className="stat-card">
            <span className="stat-number">{template.sections.length}</span>
            <span className="stat-label">Sections</span>
          </Card>
          <Card className="stat-card">
            <span className="stat-number">{totalSongs}</span>
            <span className="stat-label">Total Songs</span>
          </Card>
          <Card className="stat-card">
            <span className="stat-number">Recent</span>
            <span className="stat-label">Created</span>
          </Card>
          <Card className="stat-card">
            <span className="stat-number">Active</span>
            <span className="stat-label">Status</span>
          </Card>
        </div>

        {/* Sections */}
        <div className="template-content">
          <div className="sections-header">
            <h2 className="sections-title">Template Sections</h2>
            <span className="sections-count">{template.sections.length} sections</span>
          </div>
          
          {template.sections.length > 0 ? (
            <div className="sections-list">
              {template.sections.map((section, index) => (
                <Card key={section.id} className="section-card">
                  <div className="section-header">
                    <h3 className="section-title">{section.title}</h3>
                    <span className="section-order">#{index + 1}</span>
                  </div>
                  
                  <div className="section-content">
                    <div className="section-songs">
                      <div className="songs-header">
                        <span className="songs-label">Songs in this section</span>
                        <span className="songs-count">{section.songs.length}</span>
                      </div>
                      
                      {section.songs.length > 0 ? (
                        <div className="songs-list">
                          {section.songs.map((song) => (
                            <div key={song.id} className="song-item">
                              <span className="song-id">
                                ID: {song.masterSongId || song.choirSongVersionId}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-songs">
                          <MusicalNoteIcon className="empty-icon" />
                          <p>No songs in this section yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="empty-sections">
              <DocumentTextIcon className="empty-icon" />
              <h3 className="empty-title">No Sections</h3>
              <p className="empty-message">This template doesn't have any sections yet.</p>
              <Button
                variant="primary"
                leftIcon={<PencilIcon />}
                onClick={() => navigate(`/playlist-templates/${templateId}/edit`)}
              >
                Add Sections
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlaylistTemplateDetailPage;
