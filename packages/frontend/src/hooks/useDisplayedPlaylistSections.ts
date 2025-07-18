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
  if (sections.length > 0) {
    // Sort playlist sections by order
    return [...sections].sort((a, b) => a.order - b.order);
  }
  if (template && template.sections) {
    // Sort template sections by order and map to playlist sections
    return template.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s, songs: [] }));
  }
  return [];
}
