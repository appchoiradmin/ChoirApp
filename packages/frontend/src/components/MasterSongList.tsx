import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchMasterSongs } from '../services/masterSongService';
import { MasterSongDto } from '../types/song';
import { useUser } from '../hooks/useUser';

const MasterSongList: React.FC = () => {
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useUser();

  useEffect(() => {
    if (token) {
      const fetchSongs = async () => {
        try {
          setLoading(true);
          const fetchedSongs = await searchMasterSongs({ title: searchTerm }, token);
          setSongs(fetchedSongs);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch songs');
        } finally {
          setLoading(false);
        }
      };
      fetchSongs();
    }
  }, [searchTerm, token]);

  return (
    <div className="container">
      <h1 className="title">Master Songs</h1>
      <div className="field">
        <div className="control">
          <input
            className="input"
            type="text"
            placeholder="Filter by title or artist"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="has-text-danger">{error}</p>
      ) : (
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song) => (
              <tr key={song.songId}>
                <td>
                  <Link to={`/master-songs/${song.songId}`}>{song.title}</Link>
                </td>
                <td>{song.artist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MasterSongList;
