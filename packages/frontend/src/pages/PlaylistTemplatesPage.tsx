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
import './PlaylistTemplatesPage.scss';
import './PlaylistTemplatesPage.scss';

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
  onDropdownToggle
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or dropdown
    if ((e.target as HTMLElement).closest('.template-checkbox, .template-dropdown')) {
      return;
    }
    navigate(`/playlist-templates/${template.id}`);
  };

  return (
    <Card className={`template-card ${isSelected ? 'selected' : ''}`}>
      <div className="template-content" onClick={handleCardClick}>
        <div className="template-header">
          <div className="template-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <h3 className="template-title">{template.title}</h3>
          <div className="template-dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDropdownToggle();
              }}
              className="dropdown-trigger"
            >
              <EllipsisVerticalIcon />
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/playlist-templates/${template.id}/edit`);
                  }}
                  className="dropdown-item"
                >
                  <PencilIcon />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="dropdown-item danger"
                >
                  <TrashIcon />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        {template.description && (
          <p className="template-description">{template.description}</p>
        )}
        
        <div className="template-sections">
          <div className="sections-header">
            <span className="sections-count">
              {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="sections-list">
            {template.sections
              .slice()
              .sort((a, b) => a.order - b.order)
              .slice(0, 3)
              .map((section, index) => (
                <span key={section.id} className="section-name">
                  {section.title}
                  {index < Math.min(template.sections.length - 1, 2) && ', '}
                </span>
              ))}
            {template.sections.length > 3 && (
              <span className="more-sections">
                +{template.sections.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
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
      <div className="templates-container">
        {/* Header */}
        <div className="templates-header">
          <div className="header-content">
            <div className="header-title">
              <Button
                variant="ghost"
                leftIcon={<ArrowLeftIcon />}
                onClick={() => navigate(-1)}
                className="back-button"
              >
                Back
              </Button>
              <h1 className="page-title">Playlist Templates</h1>
            </div>
            <div className="header-actions">
              <Button
                variant="primary"
                leftIcon={<PlusIcon />}
                onClick={() => navigate('/playlist-templates/new')}
                className="create-button"
              >
                New Template
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Templates</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.sections}</span>
              <span className="stat-label">Total Sections</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.avgSections}</span>
              <span className="stat-label">Avg Sections</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.filtered}</span>
              <span className="stat-label">Filtered</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="templates-filters">
          <div className="search-section">
            <div className="search-input-container">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search templates..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="search-input"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="clear-search"
                >
                  <XMarkIcon />
                </button>
              )}
            </div>
            
            <div className="filter-controls">
              <button
                onClick={() => setFilters(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                className={`filter-toggle ${filters.showAdvanced ? 'active' : ''}`}
              >
                <FunnelIcon />
                Filters
                {filters.showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
              
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <Squares2X2Icon />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <ListBulletIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {filters.showAdvanced && (
            <div className="advanced-filters">
              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))}
                >
                  <option value="title">Title</option>
                  <option value="sections">Sections</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as FilterOptions['sortOrder'] }))}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="clear-filters"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.size > 0 && (
          <div className="bulk-actions">
            <div className="bulk-info">
              <span>{selectedTemplates.size} template{selectedTemplates.size > 1 ? 's' : ''} selected</span>
            </div>
            <div className="bulk-buttons">
              <Button
                variant="ghost"
                onClick={() => setSelectedTemplates(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                variant="outlined"
                leftIcon={<TrashIcon />}
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Templates Content */}
        <div className="templates-content">
          {filteredTemplates.length === 0 ? (
            <div className="empty-state">
              <DocumentTextIcon className="empty-icon" />
              <h2 className="empty-title">
                {templates.length === 0 ? 'No Templates Yet' : 'No Matching Templates'}
              </h2>
              <p className="empty-message">
                {templates.length === 0 
                  ? 'Create your first playlist template to get started organizing your choir services.'
                  : 'Try adjusting your search criteria or create a new template.'}
              </p>
              <div className="empty-actions">
                <Button
                  variant="primary"
                  leftIcon={<PlusIcon />}
                  onClick={() => navigate('/playlist-templates/new')}
                >
                  Create Template
                </Button>
                {templates.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={`templates-grid ${viewMode}`}>
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
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlaylistTemplatesPage;
