import React, { useState, useContext } from 'react';
import { getNextSunday } from '../utils/getNextSunday';
import { PlaylistProvider } from '../context/PlaylistContext';
import PlaylistsPage from './PlaylistsPage';
import { useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import DatePicker from '../components/DatePicker';
import { SharedDateContext } from './ChoirDashboardPage';

const ChoirPlaylistsTab: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { user, loading } = useUser();
  const sharedDateContext = useContext(SharedDateContext);
  
  // Local state for when not using shared context (standalone route)
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(getNextSunday());
  
  // Use shared date if available, otherwise use local state
  const selectedDate = sharedDateContext?.selectedDate ?? localSelectedDate;
  const setSelectedDate = sharedDateContext?.setSelectedDate ?? setLocalSelectedDate;
  
  const token = user?.token || null;

  // Don't render the PlaylistProvider until user authentication is complete
  if (loading) {
    return (
      <div>
        <div className="title">Playlists</div>
        <div>Loading user authentication...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Only show date picker when not in shared context */}
      {!sharedDateContext && (
        <div className="mb-4" style={{ maxWidth: 280 }}>
          <label className="label" htmlFor="playlist-date-picker">Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => { if (date) setSelectedDate(date); }}
            className="input"
          />
          <p className="help">(Changing the date will show playlists for that date.)</p>
        </div>
      )}
      
      <PlaylistProvider choirId={choirId || null} date={selectedDate} token={token}>
        <PlaylistsPage />
      </PlaylistProvider>
    </div>
  );
};

export default ChoirPlaylistsTab;
