import React from 'react';
import { PlaylistTemplate, PlaylistSection } from '../types/playlist';
import { useTranslation } from '../hooks/useTranslation';

interface PlaylistTemplateGuideProps {
  template: PlaylistTemplate;
  onStart?: () => void;
}

const PlaylistTemplateGuide: React.FC<PlaylistTemplateGuideProps> = ({ template, onStart }) => {
  const { t } = useTranslation();
  return (
    <div className="box">
      <h2 className="title is-4">Playlist Template: {template.title}</h2>
      {template.description && <p>{template.description}</p>}
      <div className="mt-4">
        {template.sections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((section: PlaylistSection) => (
            <div key={section.id} className="mb-3">
              <h3 className="title is-6">{section.title}</h3>
              <ul>
                <li className="has-text-grey-light">({t('playlistTemplateGuide.noSongsYet')})</li>
              </ul>
            </div>
          ))}
      </div>
      {onStart && (
        <button className="button is-primary mt-4" onClick={onStart}>
          {t('playlistTemplateGuide.startPlaylist')}
        </button>
      )}
    </div>
  );
};

export default PlaylistTemplateGuide;
