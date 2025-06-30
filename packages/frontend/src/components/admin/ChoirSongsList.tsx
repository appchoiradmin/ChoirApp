import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChoirSongVersionDto } from '../../types/choir';
import { MasterSongDto } from '../../types/song';
import { getChoirSongsByChoirId } from '../../services/choirSongService';
import { getAllMasterSongs } from '../../services/masterSongService';
import { useUser } from '../../hooks/useUser';

interface ChoirSongsListProps {
  choirId: string;
}

const ChoirSongsList: React.FC<ChoirSongsListProps> = ({ choirId }) => {
  const { token } = useUser();
  const [songs, setSongs] = useState<(ChoirSongVersionDto | MasterSongDto)[]>(
    []
  );
  const [showMasterList, setShowMasterList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      if (token) {
        setLoading(true);
        try {
          if (showMasterList) {
            const masterSongs = await getAllMasterSongs();
            setSongs(masterSongs);
          } else {
            const choirSongs = await getChoirSongsByChoirId(choirId);
            setSongs(choirSongs);
          }
        } catch (error) {
          console.error('Failed to fetch songs:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSongs();
  }, [choirId, token, showMasterList]);

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">Songs</p>
        <div className="card-header-icon">
          <div className="field">
            <input
              id="switchShowMasterList"
              type="checkbox"
              name="switchShowMasterList"
              className="switch is-rtl is-rounded"
              checked={showMasterList}
              onChange={e => setShowMasterList(e.target.checked)}
            />
            <label htmlFor="switchShowMasterList">Show Master Song List</label>
          </div>
        </div>
      </header>
      <div className="card-content">
        {loading ? (
          <p>Loading songs...</p>
        ) : (
          <div className="list">
            {songs.map(song => (
              <div key={'choirSongId' in song ? song.choirSongId : song.id} className="list-item">
                <Link to={`/master-songs/${'masterSongId' in song ? song.masterSongId : song.id}`}>
                  {'title' in song ? song.title : song.masterSong?.title}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoirSongsList;
