import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { getPlaylistTemplatesByChoirId, deletePlaylistTemplate, setPlaylistTemplateDefault } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';
import { Button, Card, LoadingSpinner, Navigation } from '../components/ui';
import Layout from '../components/ui/Layout';
import { getTemplateDisplayTitle, getTemplateDisplayDescription, isGlobalTemplateKey } from '../utils/templateTranslation';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import './PlaylistTemplatesPage.scss';

interface TemplateCardProps {
  template: PlaylistTemplate;
  onDelete: () => void;
  onSetDefault: () => void;
  dropdownOpen: boolean;
  onDropdownToggle: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onDelete,
  onSetDefault,
  dropdownOpen,
  onDropdownToggle,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, button')) {
      return;
    }
    navigate(`/playlist-templates/${template.id}`);
  };

  return (
    <Card onClick={handleCardClick} hover className="template-card">
      <Card.Header>
        <div className="card-title-container">
          {template.isDefault && (
            <StarIconSolid className="default-star-icon" title={t('playlistTemplates.defaultTemplate')} />
          )}
          <h3 className="card-title">{getTemplateDisplayTitle(template, t)}</h3>
        </div>
        <div className="dropdown-container">
          <Button
            variant="ghost"
            size="sm"
            className="dropdown-toggle"
            onClick={(e) => {
              e.stopPropagation();
              onDropdownToggle();
            }}
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              {/* Only show actions for user-created templates, not global templates */}
              {!isGlobalTemplateKey(template.title) && (
                <>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefault();
                      }}
                    >
                      <StarIcon className="icon" />
                      {t('playlistTemplates.setAsDefault')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/playlist-templates/${template.id}/edit`);
                    }}
                  >
                    <PencilIcon className="icon" />
                    {t('playlistTemplates.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="dropdown-item danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <TrashIcon className="icon" />
                    {t('playlistTemplates.delete')}
                  </Button>
                </>
              )}
              {/* For global templates, show a read-only message */}
              {isGlobalTemplateKey(template.title) && (
                <div className="dropdown-item-info">
                  <span className="info-text">{t('playlistTemplates.globalTemplateReadOnly')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        {template.description && <p className="template-description">{getTemplateDisplayDescription(template, t)}</p>}
      </Card.Content>
      <Card.Footer>
        <div className="card-footer-content">
          <span className="section-count">
            {t('playlistTemplates.sectionCount', { count: template.sections.length })}
          </span>
          {template.isDefault && (
            <span className="default-badge">
              <StarIconSolid className="badge-icon" /> {t('playlistTemplates.default')}
            </span>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};

const PlaylistTemplatesPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId } = useUser();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    if (choirId) {
      setChoirId(choirId);
    }
    if (choirId && token) {
      const fetchTemplates = async () => {
        try {
          const fetchedTemplates = await getPlaylistTemplatesByChoirId(choirId, token);
          setTemplates(fetchedTemplates);
        } catch (err: any) {
          setError(err.message || t('playlistTemplates.failedToFetchTemplates'));
          toast.error(t('playlistTemplates.failedToFetchTemplates'));
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [choirId, token, setChoirId]);

  // Filter templates by search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    
    return templates.filter(template => {
      return template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [templates, searchTerm]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!token) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (window.confirm(t('playlistTemplates.deleteConfirmation', { title: template.title }))) {
      try {
        await deletePlaylistTemplate(templateId, token);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success(t('playlistTemplates.templateDeleted'));
      } catch (err: any) {
        toast.error(t('playlistTemplates.failedToDeleteTemplate'));
      }
    }
  };
  
  const handleSetDefaultTemplate = async (templateId: string) => {
    if (!token) return;
    
    try {
      // Optimistically update UI
      setTemplates(prev =>
        prev.map(t => ({
          ...t,
          isDefault: t.id === templateId
        }))
      );

      // Call API to update the default template
      await setPlaylistTemplateDefault(templateId, true, token);
      toast.success(t('playlistTemplates.defaultTemplateUpdated'));
    } catch (err: any) {
      toast.error(t('playlistTemplates.failedToSetDefault'));
      
      // Revert optimistic update on failure
      if (choirId) {
        const templatesData = await getPlaylistTemplatesByChoirId(choirId, token);
        setTemplates(templatesData);
      }
    }
  };

  if (loading) {
    return (
      <Layout
        navigation={<Navigation title={t('playlistTemplates.title')} showBackButton={true} />}
      >
        <div className="templates-container">
          <LoadingSpinner size="lg" />
          <p className="loading-text">{t('playlistTemplates.loadingTemplates')}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        navigation={<Navigation title={t('playlistTemplates.title')} showBackButton={true} />}
      >
        <div className="templates-container">
          <div className="error-state">
            <h2>{t('playlistTemplates.errorLoadingTemplates')}</h2>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>
              {t('playlistTemplates.tryAgain')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      navigation={<Navigation title={t('playlistTemplates.title')} showBackButton={true} />}
    >
      <div className="playlist-templates-page">
        <div className="page-header">
          <div className="header-content">
            <div className="stats-container">
              <Card className="stat-card">
                <p className="stat-value">{templates.length}</p>
                <p className="stat-label">{t('playlistTemplates.templates')}</p>
              </Card>
            </div>
            
            <div className="search-container">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                placeholder={t('playlistTemplates.searchTemplatesPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          {/* Always visible Create Template button */}
          <div className="create-template-section">
            <Button
              variant="primary"
              className="new-template-btn"
              onClick={() => navigate('/playlist-templates/new')}
            >
              <PlusIcon className="btn-icon" />
              {t('playlistTemplates.newTemplate')}
            </Button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <DocumentTextIcon className="empty-icon" />
            <h3>{t('playlistTemplates.noTemplatesFound')}</h3>
            <p>{templates.length > 0 ? t('playlistTemplates.tryAdjustingSearch') : t('playlistTemplates.createFirstTemplate')}</p>
            <Button
              variant="primary"
              onClick={() => navigate('/playlist-templates/new')}
            >
              <PlusIcon className="btn-icon" />
              {t('playlistTemplates.createTemplate')}
            </Button>
          </div>
        ) : (
          <div className="templates-grid">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={() => handleDeleteTemplate(template.id)}
                onSetDefault={() => handleSetDefaultTemplate(template.id)}
                dropdownOpen={dropdownOpen === template.id}
                onDropdownToggle={() => setDropdownOpen(dropdownOpen === template.id ? null : template.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PlaylistTemplatesPage;
