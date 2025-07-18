import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlaylistSection, PlaylistTemplate } from '../types/playlist';
import { getPlaylistsByChoirId, getPlaylistTemplatesByChoirId } from '../services/playlistService';

// Utility: get next Sunday (or use your own logic)
function getNextSunday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (7 - day) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}


export interface PlaylistContextType {
  sections: PlaylistSection[];
  setSections: (sections: PlaylistSection[]) => void;
  selectedTemplate: PlaylistTemplate | null;
  setSelectedTemplate: (template: PlaylistTemplate | null) => void;
  isPersisted: boolean;
  setIsPersisted: (persisted: boolean) => void;
  isInitializing: boolean;
  isInitialized: boolean;
  playlistId: string | null;
  choirId: string | null;
  error: string | null;
  isPlaylistReady: boolean;
  createPlaylistIfNeeded: () => Promise<{id: string, sections: PlaylistSection[]} | void>;
  refreshPlaylist: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylistContext = () => {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylistContext must be used within a PlaylistProvider');
  return ctx;
};

export const PlaylistProvider = ({
  children,
  choirId,
  date,
  token
}: {
  children: ReactNode;
  choirId: string | null;
  date: Date | null;
  token: string | null;
}) => {
  const [sections, setSections] = useState<PlaylistSection[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PlaylistTemplate | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // isPlaylistReady: true only if playlist is persisted and not initializing
  const isPlaylistReady = isPersisted && !isInitializing && !!playlistId;

  // Only fetch playlists and templates, do not auto-create playlist
  useEffect(() => {
    async function initialize() {
      if (!choirId || !token) {
        setSections([]);
        setSelectedTemplate(null);
        setPlaylistId(null);
        setIsPersisted(false);
        setIsInitialized(false);
        setIsInitializing(false);
        return;
      }
      setIsInitializing(true);
      setIsInitialized(false);
      try {
        // 1. Try to fetch persisted playlists for choir
        console.log('🚨 CRITICAL - PlaylistContext initializing for choirId:', choirId);
        const playlists = await getPlaylistsByChoirId(choirId, token);
        console.log('🚨 CRITICAL - API returned playlists:', playlists);
        // Find playlist for the requested date (or next Sunday)
        const targetDate = date || getNextSunday();
        const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('🚨 CRITICAL - Looking for playlist with date:', targetDateStr);
        
        // Find playlist for the exact target date only
        const persisted = playlists.find(p => {
          const dateStr = typeof p.date === 'string' ? p.date : (p.date instanceof Date ? p.date.toISOString().split('T')[0] : '');
          console.log('🚨 CRITICAL - Checking playlist:', { id: p.id, date: dateStr, matches: dateStr.startsWith(targetDateStr) });
          return dateStr.startsWith(targetDateStr);
        });
        
        if (persisted) {
          console.log('🚨 CRITICAL - Found exact date match, using playlist:', {
            id: persisted.id,
            date: persisted.date
          });
        } else {
          console.log('🚨 CRITICAL - No playlist found for date:', targetDateStr, '- will show empty playlist with template sections');
        }
        if (persisted) {
          console.log('Debug - PlaylistContext found persisted playlist:', {
            playlistId: persisted.id,
            sectionsCount: persisted.sections?.length || 0,
            sectionIds: persisted.sections?.map(s => ({ id: s.id, title: s.title })) || [],
            templateTitle: persisted.template?.title || 'none'
          });
          console.log('🚨 CRITICAL - Raw persisted playlist sections:', persisted.sections);
          setSections(persisted.sections || []);
          setSelectedTemplate(persisted.template || null);
          setPlaylistId(persisted.id);
          setIsPersisted(true);
        } else {
          // No playlist exists: just load template for preview
          const templates = await getPlaylistTemplatesByChoirId(choirId, token);
          if (templates.length > 0) {
            const defaultTemplate = templates[0];
            const mappedSections = (defaultTemplate.sections || []).map(section => ({
              id: section.id,
              title: section.title,
              order: section.order,
              songs: section.songs || [],
            }));
            setSections(mappedSections);
            setSelectedTemplate(defaultTemplate);
          } else {
            setSections([]);
            setSelectedTemplate(null);
          }
          setPlaylistId(null);
          setIsPersisted(false);
        }
        setIsInitialized(true);
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing playlist:', error);
        setError(`Failed to load playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSections([]);
        setSelectedTemplate(null);
        setPlaylistId(null);
        setIsPersisted(false);
        setIsInitialized(false);
        setIsInitializing(false);
      }
    }
    initialize();
    return () => {};
  }, [choirId, date, token]);

  // Expose a function to create the playlist only when needed (e.g., on first change)
  const createPlaylistIfNeeded = async () => {
    if (isPersisted || !choirId || !token) return;
    try {
      console.log('🚨 DEBUG - createPlaylistIfNeeded called with:', {
        date: date ? date.toISOString() : 'null',
        choirId,
        isPersisted,
        selectedTemplate: selectedTemplate?.title
      });
      
      // Include songs when creating the playlist
      type SectionCreationPayload = { 
        title: string; 
        order: number; 
        songs: Array<{
          songId: string;
          order: number;
        }>;
      };
      const sectionsForCreation: SectionCreationPayload[] = (sections || []).map(s => ({ 
        title: s.title, 
        order: s.order,
        songs: (s.songs || []).map(song => ({
          songId: song.songId,
          order: song.order
        }))
      }));
      
      // CRITICAL FIX: Use the exact date passed to the context, don't fallback to getNextSunday
      const playlistDate = date || new Date(); // Use current date if no date provided
      console.log('🚨 DEBUG - Creating playlist with date:', playlistDate.toISOString());
      
      const created = await import('../services/playlistService').then(mod => mod.createPlaylist({
        choirId,
        date: playlistDate.toISOString(),
        sections: sectionsForCreation as any, // Cast to any to satisfy backend payload
        playlistTemplateId: selectedTemplate?.id,
        isPublic: false,
        title: selectedTemplate?.title,
      }, token));
      setPlaylistId(created.id);
      setIsPersisted(true);
      setSections(created.sections || []); // <-- Use real backend sections
      return { id: created.id, sections: created.sections || [] };
    } catch (creationError: any) {
      setError(creationError?.message || 'Failed to create playlist');
      setIsPersisted(false);
      throw creationError;
    }
  };

  // Function to refresh playlist data from the backend
  const refreshPlaylist = async () => {
    if (!choirId || !token) return;
    try {
      const playlists = await getPlaylistsByChoirId(choirId, token);
      const targetDate = date || getNextSunday();
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const persisted = playlists.find(p => {
        const dateStr = typeof p.date === 'string' ? p.date : (p.date instanceof Date ? p.date.toISOString().split('T')[0] : '');
        return dateStr.startsWith(targetDateStr);
      });
      if (persisted) {
        setSections(persisted.sections || []);
        setSelectedTemplate(persisted.template || null);
        setPlaylistId(persisted.id);
        setIsPersisted(true);
      }
    } catch (error) {
      console.error('Failed to refresh playlist:', error);
    }
  };

  return (
    <PlaylistContext.Provider value={{
      sections,
      setSections,
      selectedTemplate,
      setSelectedTemplate,
      isPersisted,
      setIsPersisted,
      isInitializing,
      isInitialized,
      playlistId,
      choirId,
      error,
      isPlaylistReady,
      createPlaylistIfNeeded,
      refreshPlaylist
    }}>
      {children}
    </PlaylistContext.Provider>
  );
};
