import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllMasterSongs, searchMasterSongs } from '../services/masterSongService';
import type { MasterSongDto } from '../types/song';

const MasterSongsListPage: React.FC = () => {
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTag, setSearchTag] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const data = await getAllMasterSongs();
        setSongs(data);
      } catch {
        setError('Failed to fetch songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchMasterSongs({
        title: searchTitle,
        artist: searchArtist,
        tag: searchTag,
      });
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
        <Link to="/master-songs/create" className="button is-primary mb-4">Create New Song</Link>
        <div className="list">
          {songs.map(song => (
            <div key={song.id} className="list-item">
              <Link to={`/master-songs/${song.id}`}>{song.title}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MasterSongsListPage;
