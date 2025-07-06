import { useContext } from 'react';
import { PlaylistContext } from '../contexts/PlaylistContext';

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};
