import React, { useState } from 'react';
import { getNextSunday } from '../utils/getNextSunday';
import { PlaylistProvider } from '../context/PlaylistContext';
import PlaylistsPage from './PlaylistsPage';
import { useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import DatePicker from '../components/DatePicker';

const ChoirPlaylistsTab: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(getNextSunday());
  // You would get the token from user context or similar
  const token = user?.token || null;

  return (
    <div>
      <div className="mb-4" style={{ maxWidth: 280 }}>
        <label className="label" htmlFor="playlist-date-picker">Select Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date)}
          className="input"
        />
        <p className="help">(Changing the date will show playlists for that date.)</p>
        
      </div>
      <PlaylistProvider choirId={choirId || null} date={selectedDate} token={token}>
        <PlaylistsPage />
      </PlaylistProvider>
    </div>
  );
};

export default ChoirPlaylistsTab;
