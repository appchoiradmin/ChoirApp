import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { createPlaylistTemplate, CreatePlaylistTemplatePayload } from '../services/playlistService';

const CreatePlaylistTemplatePage: React.FC = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSectionChange = (index: number, value: string) => {
    const newSections = [...sections];
    newSections[index] = value;
    setSections(newSections);
  };

  const addSection = () => {
    setSections([...sections, '']);
  };

  const removeSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (user?.choirId && token) {
      setLoading(true);
      try {
        const payload: CreatePlaylistTemplatePayload = {
          title,
          description,
          choirId: user.choirId,
          sections,
        };
        await createPlaylistTemplate(payload, token);
        navigate(`/choir/${user.choirId}/playlist-templates`);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container">
      <h1 className="title">New Playlist Template</h1>
      {error && <div className="notification is-danger">{error}</div>}
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
                  value={section}
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
            <button className="button is-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePlaylistTemplatePage;
