import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';
import { useUser } from '../hooks/useUser';
import { getNextSunday } from '../utils/getNextSunday';

// Create a shared date context
export const SharedDateContext = React.createContext<{
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
} | null>(null);

const ChoirDashboardPage = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(getNextSunday());

  const isAdmin = user?.choirs.some(c => c.id === choirId && c.role === 'Admin');

  const tabs = [
    { name: 'Master Songs', path: `/choir/${choirId}/songs` },
    { name: 'Playlists', path: `/choir/${choirId}/playlists` },
  ];

  if (isAdmin) {
    tabs.push({ name: 'Admin', path: `/choir/${choirId}/admin` });
  }

  return (
    <SharedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <div>
        {/* Shared Date Picker */}
        <div className="container mt-4">
          <div className="mb-4" style={{ maxWidth: 280 }}>
            <label className="label" htmlFor="playlist-date-picker">Select Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              className="input"
            />
            <p className="help">(This date applies to both Master Songs and Playlists tabs.)</p>
          </div>
        </div>
        
        <Outlet />
        <BottomNavigation tabs={tabs} />
      </div>
    </SharedDateContext.Provider>
  );
};

export default ChoirDashboardPage;
