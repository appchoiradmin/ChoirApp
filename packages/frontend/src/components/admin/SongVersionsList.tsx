import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SongDto } from '../../types/song';
import { getSongsForChoir, searchSongs } from '../../services/songService';
import { useTranslation } from '../../hooks/useTranslation';
import { useUser } from '../../hooks/useUser';

interface SongVersionsListProps {
  choirId: string;
}

const SongVersionsList: React.FC<SongVersionsListProps> = ({ choirId }) => {
  const { t } = useTranslation();
  const { token } = useUser();
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [showMasterList, setShowMasterList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      if (token) {
        setLoading(true);
        try {
          if (showMasterList) {
            const songs = await searchSongs({}, token);
            setSongs(songs);
          } else {
            const choirSongs = await getSongsForChoir(choirId, token);
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
        <p className="card-header-title">{t('songs')}</p>
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
            <label htmlFor="switchShowMasterList">{t('showMasterSongList')}</label>
          </div>
        </div>
      </header>
      <div className="card-content">
        {loading ? (
          <p>{t('loadingSongs')}</p>
        ) : (
          <div className="list">
            {songs.map(song => (
              <div key={song.songId} className="list-item">
                <Link to={`/songs/${song.songId}`}>
                  {song.title}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongVersionsList;
