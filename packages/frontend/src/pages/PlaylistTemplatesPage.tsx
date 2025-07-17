import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplatesByChoirId, deletePlaylistTemplate } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import styles from './PlaylistTemplatesPage.module.scss';

interface FilterOptions {
  search: string;
  showAdvanced: boolean;
  sortBy: 'title' | 'sections' | 'created' | 'updated';
  sortOrder: 'asc' | 'desc';
}

interface TemplateCardProps {
  template: PlaylistTemplate;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  dropdownOpen: boolean;
  onDropdownToggle: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onToggleSelect,
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
    <Card onClick={handleCardClick} hover>
      <Card.Header>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
        />
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <Button
                variant="ghost"
                className="w-full text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/playlist-templates/${template.id}/edit`);
                }}
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="w-full text-left text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        {template.description && <p className="text-gray-600">{template.description}</p>}
      </Card.Content>
      <Card.Footer>
        <span className="text-sm text-gray-500">
          {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
        </span>
      </Card.Footer>
    </Card>
  );
};

interface FilterOptions {
  search: string;
  showAdvanced: boolean;
  sortBy: 'title' | 'sections' | 'created' | 'updated';
  sortOrder: 'asc' | 'desc';
}

const PlaylistTemplatesPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId } = useUser();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    showAdvanced: false,
    sortBy: 'title',
    sortOrder: 'asc'
  });
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(filters.search.toLowerCase()));
      return matchesSearch;
    });

    // Sort templates
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'sections':
          comparison = a.sections.length - b.sections.length;
          break;
        case 'created':
        case 'updated':
          // For now, sort by title as fallback
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [templates, filters]);

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

  const handleBulkDelete = async () => {
    if (!token || selectedTemplates.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTemplates.size} templates?`)) {
      try {
        await Promise.all(Array.from(selectedTemplates).map(id => deletePlaylistTemplate(id, token)));
        setTemplates(prev => prev.filter(t => !selectedTemplates.has(t.id)));
        setSelectedTemplates(new Set());
        toast.success(`${selectedTemplates.size} templates deleted successfully`);
      } catch (err: any) {
        toast.error('Failed to delete some templates');
      }
    }
  };

  const toggleTemplateSelection = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      showAdvanced: false,
      sortBy: 'title',
      sortOrder: 'asc'
    });
  };

  const getTemplateStats = () => {
    const totalSections = templates.reduce((sum, template) => sum + template.sections.length, 0);
    const avgSections = templates.length > 0 ? Math.round(totalSections / templates.length) : 0;
    
    return {
      total: templates.length,
      sections: totalSections,
      avgSections,
      filtered: filteredTemplates.length
    };
  };

  const stats = getTemplateStats();

  if (loading) {
    return (
      <Layout>
        <div className="templates-container">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
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
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Playlist Templates</h1>
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => navigate('/playlist-templates/new')}
          >
            New Template
          </Button>
        </div>

        <div className={styles.stats}>
          <Card className={styles.statCard}>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Templates</p>
          </Card>
          <Card className={styles.statCard}>
            <p className="text-2xl font-bold">{stats.sections}</p>
            <p className="text-sm text-gray-500">Total Sections</p>
          </Card>
          <Card className={styles.statCard}>
            <p className="text-2xl font-bold">{stats.avgSections}</p>
            <p className="text-sm text-gray-500">Avg Sections</p>
          </Card>
          <Card className={styles.statCard}>
            <p className="text-2xl font-bold">{stats.filtered}</p>
            <p className="text-sm text-gray-500">Filtered</p>
          </Card>
        </div>

        <div className={styles.filters}>
          {/* Search and filter controls will go here */}
        </div>

        <div className={styles.templatesGrid}>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplates.has(template.id)}
              onToggleSelect={() => toggleTemplateSelection(template.id)}
              onDelete={() => handleDeleteTemplate(template.id)}
              dropdownOpen={dropdownOpen === template.id}
              onDropdownToggle={() => setDropdownOpen(dropdownOpen === template.id ? null : template.id)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PlaylistTemplatesPage;
