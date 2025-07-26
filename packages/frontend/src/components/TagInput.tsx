import React, { useState, KeyboardEvent, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../contexts/UserContext';
import { getTagSuggestions } from '../services/songService';
import { useTranslation } from '../hooks/useTranslation';
import type { TagDto } from '../types/song';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<TagDto[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userContext = useContext(UserContext);
  const token = userContext?.token;
  const { t } = useTranslation();

  // Debounced function to fetch tag suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const results = await getTagSuggestions(query, 8, token); // Limit to 8 for mobile
      setSuggestions(results.filter(suggestion => !tags.includes(suggestion.tagName)));
    } catch (error) {
      console.error('Failed to fetch tag suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, tags]);

  // Debounce the suggestions fetch
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim()) {
        fetchSuggestions(inputValue.trim());
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce for mobile performance

    return () => clearTimeout(timeoutId);
  }, [inputValue, fetchSuggestions]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(inputValue.trim());
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: TagDto) => {
    addTag(suggestion.tagName);
  };

  const handleInputFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="tag-input-container" style={{ position: 'relative' }}>
      {/* Existing tags display */}
      <div className="tags" style={{ marginBottom: '0.5rem' }}>
        {tags.map(tag => (
          <span key={tag} className="tag is-info" style={{ margin: '0.25rem 0.25rem 0.25rem 0' }}>
            {tag}
            <button
              type="button"
              className="delete is-small"
              onClick={() => removeTag(tag)}
              style={{ marginLeft: '0.5rem' }}
            ></button>
          </span>
        ))}
      </div>
      
      {/* Input field */}
      <div className="control" style={{ position: 'relative' }}>
        <input
          className="input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={t('tagInput.placeholder')}
          style={{ 
            fontSize: '16px', // Prevent zoom on iOS
            minHeight: '44px' // Touch-friendly height
          }}
        />
        
        {/* Mobile-first suggestions dropdown */}
        {showSuggestions && (
          <div 
            className="suggestions-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #dbdbdb',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '2px'
            }}
          >
            {isLoading ? (
              <div 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                {t('tagInput.loading', 'Loading...')}
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map(suggestion => (
                <button
                  key={suggestion.tagId}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '16px',
                    minHeight: '44px', // Touch-friendly height
                    borderBottom: '1px solid #f5f5f5'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {suggestion.tagName}
                </button>
              ))
            ) : inputValue.trim() && !isLoading ? (
              <div 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                {t('tagInput.noSuggestions', 'No suggestions found')}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
