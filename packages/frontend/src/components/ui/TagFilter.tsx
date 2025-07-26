import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useUser } from '../../hooks/useUser';
import { getTagSuggestions } from '../../services/songService';
import { TagDto } from '../../types/song';
import { MagnifyingGlassIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import './TagFilter.scss';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

const TagFilter: React.FC<TagFilterProps> = ({ selectedTags, onTagsChange, className = '' }) => {
  const { t } = useTranslation();
  const { token } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TagDto[]>([]);
  const [popularTags, setPopularTags] = useState<TagDto[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch popular tags on component mount
  useEffect(() => {
    if (token && popularTags.length === 0) {
      fetchPopularTags();
    }
  }, [token]);

  // Fetch suggestions when search query changes
  useEffect(() => {
    if (searchQuery.trim() && token) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300); // Debounce search
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, token]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPopularTags = async () => {
    if (!token) return;
    
    try {
      // Fetch popular tags (empty query returns all tags, we'll take first 8)
      const tags = await getTagSuggestions('', 8, token);
      setPopularTags(tags);
    } catch (err) {
      console.error('Error fetching popular tags:', err);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tags = await getTagSuggestions(query, 10, token);
      // Filter out already selected tags
      const filteredTags = tags.filter(tag => !selectedTags.includes(tag.tagName));
      setSuggestions(filteredTags);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
      setError(t('songs.failedToLoadTags'));
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleTagRemove = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  };

  const handleClearAllTags = () => {
    onTagsChange([]);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  // Filter popular tags to exclude already selected ones
  const availablePopularTags = popularTags.filter(tag => !selectedTags.includes(tag.tagName));

  return (
    <div className={`tag-filter-modern ${className}`}>
      {/* Selected tags - always visible when tags are selected */}
      {selectedTags.length > 0 && (
        <div className="tag-filter-modern__selected">
          <div className="tag-filter-modern__selected-tags">
            {selectedTags.map(tagName => (
              <button
                key={tagName}
                type="button"
                className="tag-filter-modern__tag tag-filter-modern__tag--selected"
                onClick={() => handleTagRemove(tagName)}
                title={t('songs.removeTag', { tag: tagName })}
                aria-label={t('songs.removeTag', { tag: tagName })}
              >
                <TagIcon className="tag-filter-modern__tag-icon" />
                {tagName}
                <XMarkIcon className="tag-filter-modern__tag-remove" />
              </button>
            ))}
            <button
              type="button"
              className="tag-filter-modern__clear-all"
              onClick={handleClearAllTags}
              title={t('songs.clearAllTags')}
              aria-label={t('songs.clearAllTags')}
            >
              {t('common.clear')}
            </button>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="tag-filter-modern__search-container">
        <div className="tag-filter-modern__search">
          <MagnifyingGlassIcon className="tag-filter-modern__search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onKeyDown={handleKeyDown}
            placeholder={t('songs.searchTags')}
            className="tag-filter-modern__search-input"
            aria-label={t('songs.searchTags')}
          />
          {loading && (
            <div className="tag-filter-modern__search-loading">
              <div className="tag-filter-modern__spinner"></div>
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div ref={suggestionsRef} className="tag-filter-modern__suggestions">
            {error ? (
              <div className="tag-filter-modern__error">
                <p>{error}</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="tag-filter-modern__suggestions-list">
                {suggestions.map(tag => (
                  <button
                    key={tag.tagId}
                    type="button"
                    className="tag-filter-modern__suggestion"
                    onClick={() => handleTagAdd(tag.tagName)}
                    title={t('songs.addTag', { tag: tag.tagName })}
                    aria-label={t('songs.addTag', { tag: tag.tagName })}
                  >
                    <TagIcon className="tag-filter-modern__suggestion-icon" />
                    {tag.tagName}
                  </button>
                ))}
              </div>
            ) : (
              <div className="tag-filter-modern__no-results">
                {t('songs.noTagsFound')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popular tags - only show when no search query and no selected tags */}
      {!searchQuery && selectedTags.length === 0 && availablePopularTags.length > 0 && (
        <div className="tag-filter-modern__popular">
          <div className="tag-filter-modern__popular-label">
            {t('songs.popularTags')}:
          </div>
          <div className="tag-filter-modern__popular-tags">
            {availablePopularTags.map(tag => (
              <button
                key={tag.tagId}
                type="button"
                className="tag-filter-modern__tag tag-filter-modern__tag--popular"
                onClick={() => handleTagAdd(tag.tagName)}
                title={t('songs.addTag', { tag: tag.tagName })}
                aria-label={t('songs.addTag', { tag: tag.tagName })}
              >
                {tag.tagName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;
