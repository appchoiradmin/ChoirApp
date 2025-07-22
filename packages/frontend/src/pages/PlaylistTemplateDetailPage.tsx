import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplateById, deletePlaylistTemplate } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';
import Layout from '../components/ui/Layout';
import Navigation from '../components/ui/Navigation';
// Card import removed as it's not being used
import Button from '../components/ui/Button';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { getTemplateDisplayTitle, getTemplateSectionDisplayTitle, isGlobalTemplateKey } from '../utils/templateTranslation';
import './PlaylistTemplateDetailPage.scss';

const PlaylistTemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { token } = useUser();
  const { t } = useTranslation();
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
          setError(err.message || t('playlistTemplateDetail.failedToFetch'));
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
      t('playlistTemplateDetail.deleteConfirm', { title: template.title })
    );
    
    if (confirmed) {
      setDeleting(true);
      try {
        await deletePlaylistTemplate(templateId, token);
        navigate('/playlist-templates');
      } catch (err: any) {
        console.error('Failed to delete template:', err);
        setError(t('playlistTemplateDetail.failedToDelete'));
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
          <h2 className="error-title">{t('playlistTemplateDetail.errorLoadingTitle')}</h2>
          <p className="error-message">{error}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            {t('playlistTemplateDetail.goBack')}
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
          <h2 className="error-title">{t('playlistTemplateDetail.templateNotFoundTitle')}</h2>
          <p className="error-message">{t('playlistTemplateDetail.templateNotFoundMessage')}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            {t('playlistTemplateDetail.goBack')}
          </Button>
        </div>
      </Layout>
    );
  }

  // We don't need to calculate totalSongs as we're removing that stat

  return (
    <Layout 
      navigation={
        <Navigation 
          title={t('playlistTemplateDetail.title')} 
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
                <h1 className="page-title">{getTemplateDisplayTitle(template, t)}</h1>
              </div>
              {template.description && (
                <p className="template-description">{template.description}</p>
              )}
            </div>
            
            {/* Only show edit/delete actions for user-created templates, not global templates */}
            {!isGlobalTemplateKey(template.title) && (
              <div className="header-actions">
                <Button
                  variant="primary"
                  leftIcon={<PencilIcon />}
                  onClick={() => navigate(`/playlist-templates/${templateId}/edit`)}
                  className="action-button"
                >
                  {t('playlistTemplateDetail.editTemplate')}
                </Button>
                <Button
                  variant="outlined"
                  leftIcon={<TrashIcon />}
                  onClick={handleDelete}
                  disabled={deleting}
                  className="action-button"
                >
                  {deleting ? t('playlistTemplateDetail.deleting') : t('playlistTemplateDetail.deleteTemplate')}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Template explanation */}
        <div className="template-description-box">
          <p>{t('playlistTemplateDetail.templateExplanation')}</p>
        </div>

        {/* Stats - Simplified to only show relevant information */}
        <div className="template-stats">
          <div className="stat-card">
            <span className="stat-number">{template.sections.length}</span>
            <span className="stat-label">{t('playlistTemplateDetail.sectionsLabel')}</span>
          </div>
        </div>

        {/* Sections */}
        <div className="template-content">
          <div className="sections-header">
            <h2 className="sections-title">{t('playlistTemplateDetail.templateSections')}</h2>
            <span className="sections-count">{t('playlistTemplateDetail.sectionsCount', { count: template.sections.length })}</span>
          </div>
          
          {template.sections.length > 0 ? (
            <div className="sections-list">
              {template.sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                <div key={section.id} className="section-card">
                  <div className="section-header">
                    <h3 className="section-title">{getTemplateSectionDisplayTitle(section.title, t)}</h3>
                    <span className="section-order">{t('playlistTemplateDetail.sectionNumber', { number: index + 1 })}</span>
                  </div>
                  
                  <div className="section-content">
                    <div className="section-placeholder">
                      {/* Empty placeholder for section - explanation moved to header */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-sections">
              <DocumentTextIcon className="empty-icon" />
              <h3 className="empty-title">{t('playlistTemplateDetail.noSectionsTitle')}</h3>
              <p className="empty-message">{t('playlistTemplateDetail.noSectionsMessage')}</p>
              <Button
                variant="primary"
                leftIcon={<PencilIcon />}
                onClick={() => navigate(`/playlist-templates/${templateId}/edit`)}
              >
                {t('playlistTemplateDetail.addSections')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlaylistTemplateDetailPage;
