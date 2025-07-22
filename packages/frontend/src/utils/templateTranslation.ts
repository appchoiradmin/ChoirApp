import { PlaylistTemplate } from '../types/playlist';

// List of global template keys that should be translated
const GLOBAL_TEMPLATE_KEYS = [
  'generic',
  'mass', 
  'service',
  'practice',
  'concert',
  'wedding',
  'funeral'
];

// List of global template section keys that should be translated
const GLOBAL_TEMPLATE_SECTION_KEYS = [
  'songs',
  'opening',
  'worship',
  'communion',
  'closing',
  'prelude',
  'postlude',
  'anthem',
  'hymns',
  'psalms'
];

/**
 * Determines if a template title is a global template key that should be translated
 */
export const isGlobalTemplateKey = (title: string): boolean => {
  return GLOBAL_TEMPLATE_KEYS.includes(title.toLowerCase());
};

/**
 * Determines if a section title is a global template section key that should be translated
 */
export const isGlobalTemplateSectionKey = (title: string): boolean => {
  return GLOBAL_TEMPLATE_SECTION_KEYS.includes(title.toLowerCase());
};

/**
 * Gets the display title for a template, translating global templates and leaving user templates as-is
 */
export const getTemplateDisplayTitle = (template: PlaylistTemplate, t: (key: string) => string): string => {
  if (isGlobalTemplateKey(template.title)) {
    return t(`playlistTemplates.globalTemplates.${template.title.toLowerCase()}`);
  }
  return template.title; // User templates display as-is
};

/**
 * Gets the display title for a template section, translating global sections and leaving user sections as-is
 */
export const getTemplateSectionDisplayTitle = (sectionTitle: string, t: (key: string) => string): string => {
  if (isGlobalTemplateSectionKey(sectionTitle)) {
    return t(`playlistTemplates.globalTemplateSections.${sectionTitle.toLowerCase()}`);
  }
  return sectionTitle; // User sections display as-is
};

/**
 * Creates a translated copy of a template for display purposes
 */
export const getTranslatedTemplate = (template: PlaylistTemplate, t: (key: string) => string): PlaylistTemplate => {
  return {
    ...template,
    title: getTemplateDisplayTitle(template, t),
    sections: template.sections?.map(section => ({
      ...section,
      title: getTemplateSectionDisplayTitle(section.title, t)
    }))
  };
};
