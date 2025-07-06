import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplateById, updatePlaylistTemplate, UpdatePlaylistTemplatePayload } from '../services/playlistService';
import { PlaylistTemplate, PlaylistTemplateSection } from '../types/playlist';

const EditPlaylistTemplatePage: React.FC = () => {
  const { user, token } = useUser();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Partial<PlaylistTemplateSection>[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.choirId && token && templateId) {
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
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <h1 className="title">Edit Playlist Template</h1>
        <button className="button" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Title</label>
          <div className="control">
            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label className="label">Description</label>
          <div className="control">
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="field">
          <label className="label">Sections</label>
          {sections.map((section, index) => (
            <div className="field has-addons" key={index}>
              <div className="control is-expanded">
                <input
                  className="input"
                  type="text"
                  value={section.title}
                  onChange={(e) => handleSectionChange(index, e.target.value)}
                  placeholder={`Section ${index + 1}`}
                />
              </div>
              <div className="control">
                <button
                  type="button"
                  className="button is-danger"
                  onClick={() => removeSection(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="control">
            <button type="button" className="button is-link" onClick={addSection}>
              + Add Section
            </button>
          </div>
        </div>

        <div className="field">
          <div className="control">
            <button className="button is-primary" type="submit">
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditPlaylistTemplatePage;
