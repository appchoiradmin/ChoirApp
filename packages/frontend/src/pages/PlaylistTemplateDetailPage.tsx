import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistTemplateById, deletePlaylistTemplate } from '../services/playlistService';
import { PlaylistTemplate } from '../types/playlist';

const PlaylistTemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { token } = useUser();
  const [template, setTemplate] = useState<PlaylistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (templateId && token) {
      const fetchTemplate = async () => {
        try {
          const fetchedTemplate = await getPlaylistTemplateById(templateId, token);
          setTemplate(fetchedTemplate);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch playlist template');
        } finally {
          setLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [templateId, token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!template) {
    return <div>Template not found.</div>;
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      if (templateId && token) {
        try {
          await deletePlaylistTemplate(templateId, token);
          navigate('/playlist-templates');
        } catch (err: any) {
          console.error(err);
        }
      }
    }
  };

  return (
    <div className="container">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <div>
          <h1 className="title">{template.title}</h1>
          <p>{template.description}</p>
        </div>
        <div>
          <Link to={`/playlist-templates/${templateId}/edit`} className="button is-primary mr-2">
            Edit Template
          </Link>
          <button onClick={handleDelete} className="button is-danger">
            Delete Template
          </button>
          <button className="button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
      {template.sections.map((section) => (
        <div key={section.id} className="mb-4">
          <h2 className="subtitle">{section.title}</h2>
          {section.songs.map((song) => (
            <div key={song.id} className="box">
              <p>Song ID: {song.masterSongId || song.choirSongVersionId}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PlaylistTemplateDetailPage;
