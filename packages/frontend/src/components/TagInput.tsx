import React, { useState, KeyboardEvent, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { getAllTags } from '../services/songService';
import type { TagDto } from '../types/song';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<TagDto[]>([]);
  const userContext = useContext(UserContext);
  const token = userContext?.token;

  useEffect(() => {
    const fetchTags = async () => {
      if (token) {
        try {
          const allTags = await getAllTags(token);
          setSuggestions(allTags);
        } catch (error) {
          console.error('Failed to fetch tags:', error);
        }
      }
    };
    fetchTags();
  }, [token]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(inputValue.trim());
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="tags">
        {tags.map(tag => (
          <span key={tag} className="tag is-info">
            {tag}
            <button
              type="button"
              className="delete is-small"
              onClick={() => removeTag(tag)}
            ></button>
          </span>
        ))}
      </div>
      <div className="control">
        <input
          className="input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Add a tag"
          list="tag-suggestions"
        />
        <datalist id="tag-suggestions">
          {suggestions
            .filter(suggestion => !tags.includes(suggestion.tagName))
            .map(suggestion => (
              <option key={suggestion.tagId} value={suggestion.tagName} />
            ))}
        </datalist>
      </div>
    </div>
  );
};

export default TagInput;
