import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllMasterSongs, searchMasterSongs } from '../services/masterSongService';
import { useDisplayedPlaylistSections } from '../hooks/useDisplayedPlaylistSections';
import type { MasterSongDto } from '../types/song';
import { PlaylistSection } from '../types/playlist';
import { useUser } from '../hooks/useUser';
import { usePlaylistContext } from '../context/PlaylistContext';

const MasterSongsListPage: React.FC = () => {
  const { sections, selectedTemplate } = usePlaylistContext();
  const displayedSections = useDisplayedPlaylistSections(sections, selectedTemplate);
  const { token } = useUser();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTag, setSearchTag] = useState('');


  useEffect(() => {
    const fetchSongs = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      try {
        const data = await getAllMasterSongs(token);
        setSongs(data);
      } catch {
        setError('Failed to fetch songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [token]);

  const handleSearch = async () => {
    if (!token) {
      setError('Authentication token not found.');
      return;
    }
    setLoading(true);
    try {
      const results = await searchMasterSongs(
        {
          title: searchTitle,
          artist: searchArtist,
          tag: searchTag,
        },
        token
      );
      setSongs(results);
      setError(null);
    } catch (err) {
      setError('Failed to search for songs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Master Songs</h1>
        <div className="box">
          <div className="field is-horizontal">
            <div className="field-body">
              <div className="field">
                <p className="control is-expanded">
                  <input
                    className="input"
                    type="text"
                    placeholder="Title"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </p>
              </div>
              <div className="field">
                <p className="control is-expanded">
                  <input
                    className="input"
                    type="text"
                    placeholder="Artist"
                    value={searchArtist}
                    onChange={(e) => setSearchArtist(e.target.value)}
                  />
                </p>
              </div>
              <div className="field">
                <p className="control is-expanded">
                  <input
                    className="input"
                    type="text"
                    placeholder="Tag"
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                  />
                </p>
              </div>
              <div className="field">
                <p className="control">
                  <button className="button is-info" onClick={handleSearch}>Search</button>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="buttons">
          <button className="button is-light" onClick={() => navigate(-1)}>Go Back</button>
          <Link to="/master-songs/create" className="button is-primary">Create New Song</Link>
        </div>
        {/* Show playlist/template sections as a guide for adding songs */}
        {displayedSections.length > 0 && (
          <div className="box mt-4">
            <p className="has-text-weight-semibold mb-2">Add songs to these sections:</p>
            {displayedSections
              .slice()
              .sort((a: PlaylistSection, b: PlaylistSection) => a.order - b.order)
              .map((section: PlaylistSection) => (
                <div key={section.id} className="mb-3">
                  <span className="tag is-light is-medium mr-2">{section.title}</span>
                </div>
              ))}
          </div>
        )}
        <div className="list">
          {songs.map(song => (
            <Link key={song.songId} to={`/master-songs/${song.songId}`} className="list-item">
              {song.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MasterSongsListPage;
