import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplatesByChoirId, deletePlaylistTemplate } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';
import { Button, Card, LoadingSpinner, Navigation } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import './PlaylistTemplatesPage.scss';

interface TemplateCardProps {
  template: PlaylistTemplate;
  onDelete: () => void;
  dropdownOpen: boolean;
  onDropdownToggle: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onDelete,
  dropdownOpen,
  onDropdownToggle,
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, button')) {
      return;
    }
    navigate(`/playlist-templates/${template.id}`);
  };

  return (
    <Card onClick={handleCardClick} hover className="template-card">
      <Card.Header>
        <h3 className="font-bold">{template.title}</h3>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDropdownToggle();
            }}
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <Button
                variant="ghost"
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/playlist-templates/${template.id}/edit`);
                }}
              >
                <PencilIcon className="icon" />
                Edit
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
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        {template.description && <p className="template-description">{template.description}</p>}
      </Card.Content>
      <Card.Footer>
        <span className="section-count">
          {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
        </span>
      </Card.Footer>
    </Card>
  );
};

const PlaylistTemplatesPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId } = useUser();
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
          setError(err.message || 'Failed to fetch playlist templates');
          toast.error('Failed to fetch playlist templates');
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

    if (window.confirm(`Are you sure you want to delete the template "${template.title}"?`)) {
      try {
        await deletePlaylistTemplate(templateId, token);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully');
      } catch (err: any) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const totalTemplates = templates.length;

  if (loading) {
    return (
      <Layout
        navigation={<Navigation title="Playlist Templates" showBackButton={true} />}
      >
        <div className="templates-container">
          <LoadingSpinner size="lg" />
          <p className="loading-text">Loading templates...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        navigation={<Navigation title="Playlist Templates" showBackButton={true} />}
      >
        <div className="templates-container">
          <div className="error-state">
            <h2>Error loading templates</h2>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      navigation={<Navigation title="Playlist Templates" showBackButton={true} />}
    >
      <div className="playlist-templates-page">
        <div className="page-header">
          <div className="header-content">
            <div className="stats-container">
              <Card className="stat-card">
                <p className="stat-value">{totalTemplates}</p>
                <p className="stat-label">Templates</p>
              </Card>
            </div>
            
            <div className="search-container">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            
            <Button
              variant="primary"
              className="new-template-btn"
              onClick={() => navigate('/playlist-templates/new')}
            >
              <PlusIcon className="btn-icon" />
              New Template
            </Button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <DocumentTextIcon className="empty-icon" />
            <h3>No templates found</h3>
            <p>{templates.length > 0 ? 'Try adjusting your search' : 'Create your first template to get started'}</p>
            <Button
              variant="primary"
              onClick={() => navigate('/playlist-templates/new')}
            >
              <PlusIcon className="btn-icon" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className="templates-grid">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={() => handleDeleteTemplate(template.id)}
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
