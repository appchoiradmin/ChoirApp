import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllMasterSongs } from '../services/masterSongService';
import type { MasterSongDto } from '../types/song';

const MasterSongsListPage: React.FC = () => {
  const [songs, setSongs] = useState<MasterSongDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const data = await getAllMasterSongs();
        setSongs(data);
      } catch (err) {
        setError('Failed to fetch songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

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
