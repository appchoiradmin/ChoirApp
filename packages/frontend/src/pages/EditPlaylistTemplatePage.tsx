import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplateById, updatePlaylistTemplate, UpdatePlaylistTemplatePayload } from '../services/playlistService';
import { PlaylistTemplate, PlaylistTemplateSection } from '../types/playlist';
import Layout from '../components/ui/Layout';
import Navigation from '../components/ui/Navigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ChevronUpIcon, ChevronDownIcon, XMarkIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import './EditPlaylistTemplatePage.scss';

const EditPlaylistTemplatePage: React.FC = () => {
  const { user, token } = useUser();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Partial<PlaylistTemplateSection>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templateId && token) {
      getPlaylistTemplateById(templateId, token)
        .then((template: PlaylistTemplate) => {
          setTitle(template.title);
          setDescription(template.description || '');
          setSections(template.sections);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setError('Failed to load template');
          setLoading(false);
        });
    }
  }, [templateId, token]);

  const handleSectionChange = (index: number, value: string) => {
    const newSections = [...sections];
    newSections[index].title = value;
    setSections(newSections);
  };

  const addSection = () => {
    setSections([...sections, { title: '', order: sections.length }]);
  };

  const removeSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const moveSectionUp = (index: number) => {
    if (index > 0) {
      const newSections = [...sections];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      setSections(newSections);
    }
  };

  const moveSectionDown = (index: number) => {
    if (index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
    }
  };

  const canMoveUp = (index: number) => index > 0;
  const canMoveDown = (index: number) => index < sections.length - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.choirId && token && templateId) {
      setSaving(true);
      setError(null);
      
      try {
        const payload: UpdatePlaylistTemplatePayload = {
          title,
          description,
          sections: sections.map(s => s.title || ''),
        };
        
        await updatePlaylistTemplate(templateId, payload, token);
        navigate(`/choir/${user.choirId}/playlist-templates`);
      } catch (error) {
        console.error(error);
        setError('Failed to update template');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="edit-template-loading">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      navigation={
        <Navigation 
          title="Edit Template" 
          showBackButton={true} 
          onBackClick={() => navigate(-1)}
        />
      }
    >
      <div className="edit-template-container">
        {/* Header */}
        <div className="edit-template-header">
          <div className="header-content">
            <div className="header-title">
              <h1 className="page-title">Edit Playlist Template</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="edit-template-content">
          <Card className="template-form-card">
            <form onSubmit={handleSubmit} className="template-form">
              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="form-section">
                <h2 className="section-title">Basic Information</h2>
                
                <div className="form-group">
                  <label className="form-label">Template Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter template name..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
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
                  <h2 className="sections-title">Template Sections</h2>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={addSection}
                    className="add-section-button"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>
                
                <div className="sections-list">
                  {sections.map((section, index) => (
                    <div key={index} className="section-item">
                      <div className="section-content">
                        <div className="section-input">
                          <input
                            type="text"
                            value={section.title || ''}
                            onChange={(e) => handleSectionChange(index, e.target.value)}
                            className="form-input"
                            placeholder={`Section ${index + 1}`}
                            required
                          />
                        </div>
                        
                        <div className="section-controls">
                          <button
                            type="button"
                            onClick={() => moveSectionUp(index)}
                            disabled={!canMoveUp(index)}
                            className="control-button"
                            title="Move up"
                          >
                            <ChevronUpIcon />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => moveSectionDown(index)}
                            disabled={!canMoveDown(index)}
                            className="control-button"
                            title="Move down"
                          >
                            <ChevronDownIcon />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            disabled={sections.length === 1}
                            className="control-button danger"
                            title="Remove section"
                          >
                            <XMarkIcon />
                          </button>
                        </div>
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
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="submit-button"
                >
                  {saving ? 'Updating...' : 'Update Template'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EditPlaylistTemplatePage;
