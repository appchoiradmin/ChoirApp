import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplatesByChoirId } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';

const PlaylistTemplatesPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId } = useUser();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [choirId, token, setChoirId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <h1 className="title">Playlist Templates</h1>
        <button className="button" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
      <Link to="/playlist-templates/new" className="button is-primary">
        New Template
      </Link>
      <div className="mt-4">
        {templates.map((template) => (
          <div key={template.id} className="box">
            <Link to={`/playlist-templates/${template.id}`}>{template.title}</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistTemplatesPage;
