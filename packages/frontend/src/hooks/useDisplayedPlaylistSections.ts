import { PlaylistSection, PlaylistTemplate } from '../types/playlist';

/**
 * Returns the sections to display for a playlist: either the playlist's sections, or the template sections as a guide if none exist.
 * Always returns a new array for template fallback (songs: []).
 */
export function useDisplayedPlaylistSections(
  sections: PlaylistSection[],
  template: PlaylistTemplate | null
): PlaylistSection[] {
  if (sections.length > 0) return sections;
  if (template && template.sections) {
    return template.sections.map((s) => ({ ...s, songs: [] }));
  }
  return [];
}
