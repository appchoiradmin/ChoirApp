import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getChoirSongsByChoirId } from '../services/choirSongService';
import type { ChoirSongVersionDto } from '../types/choir';

const ChoirSongsListPage: React.FC = () => {
  const { user, loading: userContextLoading } = useUser();
  const [songs, setSongs] = useState<ChoirSongVersionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      if (userContextLoading) {
        setLoading(true);
        return;
      }

      if (user && user.choirId) {
        try {
          setLoading(true);
          const choirSongs = await getChoirSongsByChoirId(user.choirId);
          setSongs(choirSongs);
          setError(null);
        } catch (err) {
          setError('Failed to fetch choir songs. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else if (user && !user.choirId) {
        setLoading(false);
        setError('You must be part of a choir to see its songs.');
      } else {
        // user is null, and not loading, likely means not authenticated
        setLoading(false);
        setError('Please log in to see choir songs.');
      }
    };

    fetchSongs();
  }, [user]);

  if (loading) {
    return <p>Loading choir songs...</p>;
  }

  if (error) {
    return <p className="has-text-danger">{error}</p>;
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Your Choir's Songs</h1>
        <p className="subtitle">These are the customized versions of songs for your choir.</p>
        {songs.length > 0 ? (
          <div className="table-container">
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Original Artist</th>
                  <th>Last Edited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.choirSongId}>
                    <td>{song.masterSong?.title || 'N/A'}</td>
                    <td>{song.masterSong?.artist || 'N/A'}</td>
                    <td>{new Date(song.lastEditedDate).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/choir-songs/${song.choirSongId}`} className="button is-small is-info">
                        View/Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Your choir has not created any custom song versions yet.</p>
        )}
        <p className="mt-4">
            To create a new choir-specific version, find a song in the{' '}
            <Link to="/master-songs">Master Song List</Link> and create a version from there.
        </p>
      </div>
    </section>
  );
};

export default ChoirSongsListPage;
