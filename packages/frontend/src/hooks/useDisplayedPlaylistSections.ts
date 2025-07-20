import { PlaylistSection, PlaylistTemplate } from '../types/playlist';

/**
 * Returns the sections to display for a playlist: either the playlist's sections, or the template sections as a guide if none exist.
 * Always returns a new array for template fallback (songs: []).
 * Sections are sorted by their order property to maintain consistent ordering.
 */
export function useDisplayedPlaylistSections(
  sections: PlaylistSection[],
  template: PlaylistTemplate | null
): PlaylistSection[] {
  console.log('🚨 DEBUG - useDisplayedPlaylistSections called with:', { sections, template });
  
  if (sections.length > 0) {
    console.log('🚨 DEBUG - Using playlist sections:', sections);
    // Sort playlist sections by order
    return [...sections].sort((a, b) => a.order - b.order);
  }
  if (template && template.sections) {
    console.log('🚨 DEBUG - Using template sections:', template.sections);
    // Sort template sections by order and map to playlist sections
    const mappedSections = template.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s, songs: [] }));
    console.log('🚨 DEBUG - Mapped template sections:', mappedSections);
    return mappedSections;
  }
  console.log('🚨 DEBUG - No sections or template available, returning empty array');
  return [];
}
