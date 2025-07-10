import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { createPlaylistTemplate, CreatePlaylistTemplatePayload } from '../services/playlistService';
import { Button, Card, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import './CreatePlaylistTemplatePage.scss';

interface SectionItem {
  id: string;
  title: string;
  order: number;
}

const CreatePlaylistTemplatePage: React.FC = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionItem[]>([
    { id: '1', title: '', order: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSectionChange = (id: string, value: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, title: value } : section
    ));
  };

  const addSection = () => {
    const newSection: SectionItem = {
      id: Date.now().toString(),
      title: '',
      order: sections.length
    };
    setSections(prev => [...prev, newSection]);
  };

  const removeSection = (id: string) => {
    if (sections.length === 1) {
      toast.error('Template must have at least one section');
      return;
    }
    setSections(prev => prev.filter(section => section.id !== id));
  };

  const moveSectionUp = (id: string) => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === 0) return prev;
      
      const newSections = [...prev];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      
      return newSections.map((section, idx) => ({ ...section, order: idx }));
    });
  };

  const moveSectionDown = (id: string) => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === prev.length - 1) return prev;
      
      const newSections = [...prev];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      
      return newSections.map((section, idx) => ({ ...section, order: idx }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) {
      setError('Template title is required');
      toast.error('Template title is required');
      return;
    }
    
    const validSections = sections.filter(s => s.title.trim() !== '');
    if (validSections.length === 0) {
      setError('At least one section with a title is required');
      toast.error('At least one section with a title is required');
      return;
    }
    
    if (user?.choirId && token) {
      setLoading(true);
      try {
        const payload: CreatePlaylistTemplatePayload = {
          title: title.trim(),
          description: description.trim(),
          choirId: user.choirId,
          sections: validSections.map(s => s.title.trim()),
        };
        await createPlaylistTemplate(payload, token);
        toast.success('Template created successfully');
        navigate(`/choir/${user.choirId}/playlist-templates`);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          toast.error(err.message);
        } else {
          setError('An unexpected error occurred.');
          toast.error('An unexpected error occurred.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const canMoveUp = (id: string) => {
    const index = sections.findIndex(s => s.id === id);
    return index > 0;
  };

  const canMoveDown = (id: string) => {
    const index = sections.findIndex(s => s.id === id);
    return index < sections.length - 1;
  };

  return (
    <Layout>
      <div className="create-template-container">
        <div className="create-template-header">
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
              <h1 className="page-title">Create Playlist Template</h1>
            </div>
          </div>
        </div>

        <div className="create-template-content">
          <Card className="template-form-card">
            <form onSubmit={handleSubmit} className="template-form">
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Basic Information */}
              <div className="form-section">
                <h2 className="section-title">Basic Information</h2>
                
                <div className="form-group">
                  <label className="form-label">Template Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Sunday Service, Christmas Special"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    placeholder="Optional description for this template..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="form-section">
                <div className="sections-header">
                  <h2 className="section-title">Sections</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    leftIcon={<PlusIcon />}
                    onClick={addSection}
                    className="add-section-button"
                  >
                    Add Section
                  </Button>
                </div>
                
                <div className="sections-list">
                  {sections.map((section, index) => (
                    <div key={section.id} className="section-item">
                      <div className="section-drag-handle">
                        <Bars3Icon />
                      </div>
                      
                      <div className="section-input">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionChange(section.id, e.target.value)}
                          className="form-input"
                          placeholder={`Section ${index + 1}`}
                        />
                      </div>
                      
                      <div className="section-controls">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(section.id)}
                          disabled={!canMoveUp(section.id)}
                          className="control-button"
                          title="Move up"
                        >
                          <ChevronUpIcon />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => moveSectionDown(section.id)}
                          disabled={!canMoveDown(section.id)}
                          className="control-button"
                          title="Move down"
                        >
                          <ChevronDownIcon />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          disabled={sections.length === 1}
                          className="control-button danger"
                          title="Remove section"
                        >
                          <XMarkIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="sections-help">
                  <p>
                    <DocumentTextIcon className="help-icon" />
                    Create sections to organize your playlist. Common sections include: Opening, Worship, Offertory, Closing.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePlaylistTemplatePage;
