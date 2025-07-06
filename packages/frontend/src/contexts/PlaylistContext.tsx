import React, { useState, createContext, type ReactNode, useCallback } from 'react';
import { Playlist } from '../types/playlist';

interface PlaylistContextType {
  selectedPlaylist: Playlist | null;
  setSelectedPlaylist: (playlist: Playlist | null) => void;
}

export const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const setPlaylist = useCallback((playlist: Playlist | null) => {
    setSelectedPlaylist(playlist);
  }, []);

  return (
    <PlaylistContext.Provider value={{ selectedPlaylist, setSelectedPlaylist: setPlaylist }}>
      {children}
    </PlaylistContext.Provider>
  );
};
