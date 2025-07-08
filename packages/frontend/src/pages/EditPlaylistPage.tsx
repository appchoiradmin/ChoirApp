import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getPlaylistById as getPlaylist, getPlaylistsByChoirId, updatePlaylist, getPlaylistTemplatesByChoirId, removeSongFromPlaylist, UpdatePlaylistDto } from '../services/playlistService';
import { MasterSongDto } from '../types/song';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import { getChoirSongsByChoirId } from '../services/choirSongService';
import { getAllMasterSongs } from '../services/masterSongService';
import { PlaylistTemplate, PlaylistSection, PlaylistSong } from '../types/playlist';
import { PlaylistProvider } from '../context/PlaylistContext';
import { ChoirSongVersionDto } from '../types/choir';
import MovableSongItem from '../components/MovableSongItem';

const EditPlaylistPage: React.FC = () => {
  const { token } = useUser();
  const { playlistId: routePlaylistId } = useParams<{ playlistId: string }>();

  const [playlists, setPlaylists] = useState<any[]>([]); // TODO: type properly
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState<PlaylistTemplate | null>(null);
  const [sections, setSections] = useState<PlaylistSection[]>([]);
  const [choirSongs, setChoirSongs] = useState<ChoirSongVersionDto[]>([]);
  const [masterSongs, setMasterSongs] = useState<MasterSongDto[]>([]);

  // Fetch all playlists for the choir and select the next Sunday by default
  useEffect(() => {
    // If the selected playlist is a draft/in-memory (not persisted), initialize sections from template and skip API calls
    if (selectedPlaylistId === 'draft') {
      // Assume template and sections are already in context via PlaylistProvider
      setLoading(false);
      return;
    }
    const fetchPlaylistsAndSelectDefault = async () => {
      if (!token) return;
      // Try to get choirId from route playlist
      let choirId = null;
      let playlistsResp: any[] = [];
      if (routePlaylistId) {
        try {
          const playlist = await getPlaylist(routePlaylistId, token);
          choirId = playlist.choirId;
        } catch (err) { console.error(err); }
      }
      if (!choirId && playlists.length > 0) {
        choirId = playlists[0].choirId;
      }
      if (choirId) {
        playlistsResp = await getPlaylistsByChoirId(choirId, token);
        setPlaylists(playlistsResp);
        // Find next Sunday (or today if Sunday)
        const today = new Date();
        const getSunday = (d: Date) => {
          const day = d.getDay();
          const diff = day === 0 ? 0 : 7 - day;
          const sunday = new Date(d);
          sunday.setDate(d.getDate() + diff);
          sunday.setHours(0,0,0,0);
          return sunday;
        };
        const nextSunday = getSunday(today);
        let defaultPlaylist = playlistsResp.find(p => {
          const pd = new Date(p.date);
          return pd.toDateString() === nextSunday.toDateString();
        });
        if (!defaultPlaylist) {
          // If no playlist for next Sunday, pick the closest future playlist
          defaultPlaylist = playlistsResp.filter(p => new Date(p.date) >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        }
        setSelectedPlaylistId(routePlaylistId || (defaultPlaylist ? defaultPlaylist.id : (playlistsResp[0]?.id ?? null)));
      }
    };
    fetchPlaylistsAndSelectDefault();
    // eslint-disable-next-line
  }, [routePlaylistId, token]);

  // Fetch data for selected playlist
  useEffect(() => {
    const fetchInitialData = async () => {
      if (token && selectedPlaylistId) {
    try {
      console.log("Fetching initial data...");
      const playlist = await getPlaylist(selectedPlaylistId, token);
      const [fetchedTemplates, fetchedSongs, fetchedMasterSongs] = await Promise.all([
        getPlaylistTemplatesByChoirId(playlist.choirId, token),
        getChoirSongsByChoirId(playlist.choirId, token),
        getAllMasterSongs(token)
      ]);

      console.log("Playlist data:", playlist);
      console.log("Templates data:", fetchedTemplates);
      console.log("Fetched songs:", fetchedSongs);
      console.log("Fetched master songs:", fetchedMasterSongs);

      setTitle(playlist.title || '');
      setIsPublic(playlist.isPublic);
      // Always use template sections if playlist has no sections and a template exists
      let appliedSections = playlist.sections;
      let templateToApply = null;
      // Always prefer playlist's template, otherwise first available
      if (playlist.playlistTemplateId && fetchedTemplates.length > 0) {
        templateToApply = fetchedTemplates.find(t => t.id === playlist.playlistTemplateId) || fetchedTemplates[0];
      } else if (fetchedTemplates.length > 0) {
        templateToApply = fetchedTemplates[0];
      }
      setSections(appliedSections); // sections is always the backend value
      setSelectedTemplate(templateToApply); // always set a template if available

      setChoirSongs(fetchedSongs);
      setMasterSongs(fetchedMasterSongs);
      setLoading(false);

      // --- No change to setSections here; derive displayedSections for UI rendering only ---

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }
};

    fetchInitialData();
  }, [selectedPlaylistId, token]);


  const handleRemoveSongFromSection = async (sectionId: string, songId: string) => {
  if (token && selectedPlaylistId) {
    try {
      await removeSongFromPlaylist(selectedPlaylistId, songId, token);
      const newSections = sections.map(section => {
        if (section.id === sectionId) {
          const newSongs = section.songs.filter(s => (s.choirSongVersionId || s.masterSongId) !== songId);
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

  const handleMoveSong = async (song: PlaylistSong, fromSectionId: string, toSectionId: string) => {
    if (fromSectionId === toSectionId) return;

    let songToMove: PlaylistSong | undefined;

    // Remove the song from the source section (support both choirSongVersionId and masterSongId)
    const getSongKey = (s: PlaylistSong) => s.choirSongVersionId || s.masterSongId;
    const songKey = song.choirSongVersionId || song.masterSongId;

    const sectionsWithSongRemoved = sections.map(section => {
      if (section.id === fromSectionId) {
        songToMove = section.songs.find(s => getSongKey(s) === songKey);
        return {
          ...section,
          songs: section.songs.filter(s => getSongKey(s) !== songKey),
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
    if (token && selectedPlaylistId) {
      try {
        // Map sections and songs to backend DTO structure
        const mappedSections = sectionsWithSongAdded.map((section, sectionIdx) => ({
          title: section.title,
          order: sectionIdx,
          songs: section.songs.map((song, songIdx) => ({
            masterSongId: song.masterSongId,
            choirSongVersionId: song.choirSongVersionId,
            order: songIdx,
          }))
        }));

        if (mappedSections.length === 0) {
          const confirmed = window.confirm('You are about to remove all sections from this playlist. This action cannot be undone. Are you sure?');
          if (!confirmed) {
            alert('Playlist update cancelled. No changes were saved.');
            return;
          }
        }

        const payload = {
          title,
          isPublic,
          sections: mappedSections,
          playlistTemplateId: selectedTemplate?.id,
        };
        console.log('[Playlist] updatePlaylist payload:', JSON.stringify(payload, null, 2));
        const response = await updatePlaylist(selectedPlaylistId, payload as UpdatePlaylistDto, token);
        console.log('[Playlist] updatePlaylist response:', response);
      } catch (error) {
        console.error('[Playlist] updatePlaylist error:', error);
        alert('Failed to save playlist changes. Please try again.');
      }
    }
  };



  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1 className="title">Edit Playlist</h1>

      {/* Playlist selector */}
      {playlists.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="playlist-select" style={{ marginRight: 8 }}>Select Playlist by Date:</label>
          <select
            id="playlist-select"
            value={selectedPlaylistId || ''}
            onChange={e => setSelectedPlaylistId(e.target.value)}
          >
            {playlists.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(p => (
              <option key={p.id} value={p.id}>
                {p.date ? new Date(p.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : p.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Always show template sections if playlist is empty, for user guidance */}
      {selectedTemplate && (
        <div>
          <h2 className="title is-4 mt-5">Sections</h2>
          {(() => {
            const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
            return displayedSections
              .slice()
              .sort((a: PlaylistSection, b: PlaylistSection) => a.order - b.order)
              .map((section: PlaylistSection) => (
                <div key={section.id} className="box">
                  <h3 className="title is-5">{section.title}</h3>
                  <ul>
                    {section.songs.map((song: PlaylistSong) => (
                      <MovableSongItem
                        key={song.choirSongVersionId || song.masterSongId}
                        song={song}
                        section={section}
                        sections={displayedSections}
                        choirSongs={choirSongs}
                        masterSongs={masterSongs}
                        onMoveSong={handleMoveSong}
                        onRemoveSong={() => handleRemoveSongFromSection(section.id, song.choirSongVersionId || song.masterSongId!)}
                      />
                    ))}
                  </ul>
                </div>
              ));
          })()}
        </div>
      )}
    </div>
  );
}

export default function EditPlaylistPageWrapper() {
  const { token } = useUser();
  const { choirId } = useParams<{ choirId: string }>();
  // Use today's date as default for editing
  const date = new Date();
  return (
    <PlaylistProvider choirId={choirId ?? null} date={date} token={token}>
      <EditPlaylistPage />
    </PlaylistProvider>
  );
}

