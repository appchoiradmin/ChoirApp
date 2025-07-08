import React from 'react';
import { usePlaylistContext } from '../context/PlaylistContext';

const PlaylistsPage: React.FC = () => {
  const { sections } = usePlaylistContext();


  return (
    <div className="container">
      <h1 className="title">Playlists</h1>
      {sections.length === 0 ? (
        <div>No playlist sections available.</div>
      ) : (
        <div className="playlist-sections">
          {sections.map((section, idx) => (
            <div key={section.id || idx} className="card mb-4">
              <header className="card-header">
                <p className="card-header-title">
                  {section.title || 'Untitled Section'}
                </p>
              </header>
              {section.songs && section.songs.length > 0 ? (
                <div className="card-content">
                  <ul>
                    {section.songs.map((song, songIdx) => (
                      <li key={song.id || songIdx}>
                        {/* Show more song info here if available in PlaylistSong */}
                        Song #{songIdx + 1}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="card-content">
                  <em>No songs in this section.</em>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
