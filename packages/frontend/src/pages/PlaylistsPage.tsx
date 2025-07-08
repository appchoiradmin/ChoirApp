import React, { useState, useEffect } from 'react';
import { usePlaylistContext } from '../context/PlaylistContext';
import MovableSongItem from '../components/MovableSongItem';
import { PlaylistSong } from '../types/playlist';
import { ChoirSongVersionDto } from '../types/choir';
import { MasterSongDto } from '../types/song';
import { useUser } from '../hooks/useUser';
import { removeSongFromPlaylist, moveSongInPlaylist } from '../services/playlistService';

const PlaylistsPage: React.FC = () => {
  const { sections, isInitializing, error, isPlaylistReady, playlistId, setSections } = usePlaylistContext();
  const { user } = useUser();
  const [choirSongs] = useState<ChoirSongVersionDto[]>([]);
  const [masterSongs] = useState<MasterSongDto[]>([]);

  // For now, we'll use empty arrays for choirSongs and masterSongs
  // In a real implementation, you might want to fetch these if needed
  useEffect(() => {
    // You can add logic here to fetch choirSongs and masterSongs if needed
    // For now, we'll keep them empty since the song data is already in the playlist songs
  }, []);

  const handleMoveSong = async (song: PlaylistSong, fromSectionId: string, toSectionId: string) => {
    if (!playlistId || !user?.token) return;

    try {
      // Update local state immediately
      const updatedSections = sections.map(section => {
        if (section.id === fromSectionId) {
          return {
            ...section,
            songs: section.songs.filter(s => s.id !== song.id)
          };
        }
        if (section.id === toSectionId) {
          return {
            ...section,
            songs: [...section.songs, { ...song, order: section.songs.length }]
          };
        }
        return section;
      });

      setSections(updatedSections);

      // Use the dedicated move endpoint instead of updating the entire playlist
      await moveSongInPlaylist(playlistId, song.id, {
        fromSectionId,
        toSectionId
      }, user.token);
    } catch (error) {
      console.error('Failed to move song:', error);
      // Revert local state on error
      setSections(sections);
    }
  };

  const handleRemoveSong = async (sectionId: string, songId: string) => {
    if (!playlistId || !user?.token) return;

    try {
      // Update backend first
      await removeSongFromPlaylist(playlistId, songId, user.token);

      // Update local state after successful backend call
      const updatedSections = sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            songs: section.songs.filter(s => s.id !== songId)
          };
        }
        return section;
      });

      setSections(updatedSections);
    } catch (error) {
      console.error('Failed to remove song:', error);
      // You might want to show an error message to the user
    }
  };

  if (isInitializing) {
    return (
      <div className="container">
        <h1 className="title">Playlists</h1>
        <div>Loading playlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1 className="title">Playlists</h1>
        <div className="notification is-danger">{error}</div>
      </div>
    );
  }

  if (!isPlaylistReady) {
    return (
      <div className="container">
        <h1 className="title">Playlists</h1>
        <div>Preparing playlist...</div>
      </div>
    );
  }

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
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {section.songs.map((song, songIdx) => (
                      <MovableSongItem
                        key={song.id || songIdx}
                        song={song}
                        section={section}
                        sections={sections}
                        choirSongs={choirSongs}
                        masterSongs={masterSongs}
                        onMoveSong={handleMoveSong}
                        onRemoveSong={handleRemoveSong}
                      />
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
