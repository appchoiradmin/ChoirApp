import React from 'react';
import { PlaylistTemplate, PlaylistSection } from '../types/playlist';

interface PlaylistTemplateGuideProps {
  template: PlaylistTemplate;
  onStart?: () => void;
}

const PlaylistTemplateGuide: React.FC<PlaylistTemplateGuideProps> = ({ template, onStart }) => {
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
                <li className="has-text-grey-light">(No songs yet)</li>
              </ul>
            </div>
          ))}
      </div>
      {onStart && (
        <button className="button is-primary mt-4" onClick={onStart}>
          Start Playlist
        </button>
      )}
    </div>
  );
};

export default PlaylistTemplateGuide;
