import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
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
  const { user, token, refreshToken } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      toast.error(t('createPlaylistTemplate.atLeastOneSection'));
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
      setError(t('createPlaylistTemplate.templateTitleRequired'));
      toast.error(t('createPlaylistTemplate.templateTitleRequired'));
      return;
    }
    
    const validSections = sections.filter(s => s.title.trim() !== '');
    if (validSections.length === 0) {
      setError(t('createPlaylistTemplate.atLeastOneSectionTitle'));
      toast.error(t('createPlaylistTemplate.atLeastOneSectionTitle'));
      return;
    }
    
    if (user?.choirId && token) {
      setLoading(true);
      
      try {
        // Refresh the token first to ensure we have the latest role claims
        console.log('Refreshing token before creating playlist template...');
        await refreshToken();
        console.log('Token refreshed successfully');
        
        // Now create the playlist template with the refreshed token
        const payload: CreatePlaylistTemplatePayload = {
          title: title.trim(),
          description: description.trim(),
          choirId: user.choirId,
          sections: validSections.map(s => s.title.trim()),
        };
        await createPlaylistTemplate(payload, token);
        toast.success(t('createPlaylistTemplate.templateCreated'));
        navigate(`/choir/${user.choirId}/playlist-templates`);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          toast.error(err.message);
        } else {
          setError(t('createPlaylistTemplate.unexpectedError'));
          toast.error(t('createPlaylistTemplate.unexpectedError'));
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
                {t('common.back')}
              </Button>
              <h1 className="page-title">{t('createPlaylistTemplate.title')}</h1>
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
                <h2 className="section-title">{t('createPlaylistTemplate.basicInformation')}</h2>
                
                <div className="form-group">
                  <label className="form-label">{t('createPlaylistTemplate.templateTitle')} *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder={t('createPlaylistTemplate.templateTitlePlaceholder')}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t('createPlaylistTemplate.description')}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    placeholder={t('createPlaylistTemplate.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="form-section">
                <div className="sections-header">
                  <h2 className="section-title">{t('createPlaylistTemplate.sections')}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    leftIcon={<PlusIcon />}
                    onClick={addSection}
                    className="add-section-button"
                  >
                    {t('createPlaylistTemplate.addSection')}
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
                          placeholder={t('createPlaylistTemplate.sectionPlaceholder', { number: index + 1 })}
                        />
                      </div>
                      
                      <div className="section-controls">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(section.id)}
                          disabled={!canMoveUp(section.id)}
                          className="control-button"
                          title={t('createPlaylistTemplate.moveUp')}
                        >
                          <ChevronUpIcon />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => moveSectionDown(section.id)}
                          disabled={!canMoveDown(section.id)}
                          className="control-button"
                          title={t('createPlaylistTemplate.moveDown')}
                        >
                          <ChevronDownIcon />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          disabled={sections.length === 1}
                          className="control-button danger"
                          title={t('createPlaylistTemplate.removeSection')}
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
                    {t('createPlaylistTemplate.sectionsHelp')}
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
                  {t('common.cancel')}
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
                      {t('createPlaylistTemplate.creating')}
                    </>
                  ) : (
                    t('createPlaylistTemplate.createTemplate')
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
