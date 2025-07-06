import React from 'react';
import { Playlist } from '../types/playlist';

interface PlaylistDetailProps {
  playlist: Playlist;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlist }) => {
  return (
    <div>
      <h2 className="title is-4">{new Date(playlist.date).toLocaleDateString()}</h2>
      {playlist.sections.map((section) => (
        <div key={section.id} className="mb-4">
          <h3 className="title is-5">{section.title}</h3>
          <ul>
            {section.songs.map((song) => (
              <li key={song.id}>
                {/* This will need to be updated to fetch song details */}
                Song ID: {song.masterSongId || song.choirSongVersionId}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PlaylistDetail;
