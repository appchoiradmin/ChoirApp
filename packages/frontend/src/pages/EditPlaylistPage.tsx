import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistById as getPlaylist, updatePlaylist, getPlaylistTemplatesByChoirId, removeSongFromPlaylist } from '../services/playlistService';
import { getChoirSongsByChoirId } from '../services/choirSongService';
import { PlaylistTemplate, PlaylistSection, PlaylistSong } from '../types/playlist';
import { ChoirSongVersionDto } from '../types/choir';
import MovableSongItem from '../components/MovableSongItem';

const EditPlaylistPage: React.FC = () => {
  const { token } = useUser();
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PlaylistTemplate | null>(null);
  const [sections, setSections] = useState<PlaylistSection[]>([]);
  const [choirSongs, setChoirSongs] = useState<ChoirSongVersionDto[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (token && playlistId) {
        try {
          console.log("Fetching initial data...");
          const playlist = await getPlaylist(playlistId, token);
          const [fetchedTemplates, fetchedSongs] = await Promise.all([
            getPlaylistTemplatesByChoirId(playlist.choirId, token),
            getChoirSongsByChoirId(playlist.choirId, token)
          ]);
          
          console.log("Playlist data:", playlist);
          console.log("Templates data:", fetchedTemplates);
          
          setTitle(playlist.title || '');
          setIsPublic(playlist.isPublic);
          setSections(playlist.sections);
          setTemplates(fetchedTemplates);
          setChoirSongs(fetchedSongs);

          if (playlist.playlistTemplateId) {
            console.log("Playlist has templateId:", playlist.playlistTemplateId);
            const template = fetchedTemplates.find(t => t.id === playlist.playlistTemplateId);
            console.log("Found template:", template);
            setSelectedTemplate(template || null);
            if (playlist.sections.length === 0 && template) {
              console.log("Setting sections from template");
              setSections(template.sections.map(s => ({...s, songs: []})));
            }
          }

          setLoading(false);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      }
    };

    fetchInitialData();
  }, [playlistId, token]);


  const handleRemoveSongFromSection = async (sectionId: string, songId: string) => {
    if (token && playlistId) {
      try {
        await removeSongFromPlaylist(playlistId, songId, token);
        const newSections = sections.map(section => {
          if (section.id === sectionId) {
            const newSongs = section.songs.filter(s => s.masterSongId !== songId);
            return { ...section, songs: newSongs };
          }
          return section;
        });
        setSections(newSections);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleMoveSong = (song: PlaylistSong, fromSectionId: string, toSectionId: string) => {
    if (fromSectionId === toSectionId) return;

    let songToMove: PlaylistSong | undefined;

    // Remove the song from the source section
    const sectionsWithSongRemoved = sections.map(section => {
      if (section.id === fromSectionId) {
        songToMove = section.songs.find(s => s.choirSongVersionId === song.choirSongVersionId);
        return {
          ...section,
          songs: section.songs.filter(s => s.choirSongVersionId !== song.choirSongVersionId),
        };
      }
      return section;
    });

    if (!songToMove) return;

    // Add the song to the destination section
    const sectionsWithSongAdded = sectionsWithSongRemoved.map(section => {
      if (section.id === toSectionId) {
        return {
          ...section,
          songs: [...section.songs, songToMove!],
        };
      }
      return section;
    });

    setSections(sectionsWithSongAdded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token && playlistId) {
      try {
        await updatePlaylist(playlistId, { title, isPublic, sections, playlistTemplateId: selectedTemplate?.id }, token);
        navigate(`/playlists/${playlistId}`);
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1 className="title">Edit Playlist</h1>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Title</label>
          <div className="control">
            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>
        </div>
        <div className="field">
          <label className="label">Template</label>
          <div className="control">
            <div className="select">
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                  if (template) {
                    setSections(template.sections.map(s => ({...s, songs: []})));
                  } else {
                    setSections([]);
                  }
                }}
              >
                <option value="">No Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="field">
          <div className="control">
            <button className="button is-primary" type="submit">
              Save Changes
            </button>
          </div>
        </div>
      </form>

      {selectedTemplate && (
        <div>
          <h2 className="title is-4 mt-5">Sections</h2>
          {sections
            .slice() // Create a shallow copy to avoid mutating the original array
            .sort((a, b) => a.order - b.order) // Sort sections by order
            .map((section) => (
            <div key={section.id} className="box">
              <h3 className="title is-5">{section.title}</h3>
              <ul>
                {section.songs.map((song) => (
                  <MovableSongItem
                    key={song.choirSongVersionId}
                    song={song}
                    section={section}
                    sections={sections}
                    choirSongs={choirSongs}
                    onMoveSong={handleMoveSong}
                    onRemoveSong={() => handleRemoveSongFromSection(section.id, song.masterSongId!)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditPlaylistPage;
