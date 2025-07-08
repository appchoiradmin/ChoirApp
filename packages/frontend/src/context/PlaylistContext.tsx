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

  useEffect(() => {

    async function initialize() {
      if (!choirId || !token) {
        setSections([]);
        setSelectedTemplate(null);
        setIsPersisted(false);
        setIsInitialized(false);
        setIsInitializing(false);
        return;
      }
      setIsInitializing(true);
      setIsInitialized(false);
      try {
        // 1. Try to fetch persisted playlists for choir
        const playlists = await getPlaylistsByChoirId(choirId, token);
        // Find playlist for the requested date (or next Sunday)
        const targetDate = date || getNextSunday();
        const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const persisted = playlists.find(p => {
  const dateStr = typeof p.date === 'string' ? p.date : (p.date instanceof Date ? p.date.toISOString().split('T')[0] : '');
  return dateStr.startsWith(targetDateStr);
});
        if (persisted) {
          setSections(persisted.sections || []);
          setSelectedTemplate(persisted.template || null);
          setIsPersisted(true);
          setIsInitialized(true);
          setIsInitializing(false);
          return;
        }
        // 2. If not found, fetch default template and create draft
        const templates = await getPlaylistTemplatesByChoirId(choirId, token);
        if (templates.length > 0) {
          const defaultTemplate = templates[0];
          console.log('Fetched templates:', templates);
          // Defensive mapping to PlaylistSection[]
          const mappedSections = (defaultTemplate.sections || []).map(section => ({
            id: section.id,
            title: section.title,
            order: section.order,
            songs: section.songs || [],
          }));
          console.log('Mapped sections:', mappedSections);
          setSections(mappedSections);
          setSelectedTemplate(defaultTemplate);
        } else {
          setSections([]);
          setSelectedTemplate(null);
        }
        setIsPersisted(false);
        setIsInitialized(true);
        setIsInitializing(false);
      } catch (error) {
        setSections([]);
        setSelectedTemplate(null);
        setIsPersisted(false);
        setIsInitialized(false);
        setIsInitializing(false);
      }
    }
    initialize();
    return () => {};
  }, [choirId, date, token]);

  return (
    <PlaylistContext.Provider value={{
      sections,
      setSections,
      selectedTemplate,
      setSelectedTemplate,
      isPersisted,
      setIsPersisted,
      isInitializing,
      isInitialized
    }}>
      {children}
    </PlaylistContext.Provider>
  );
};
