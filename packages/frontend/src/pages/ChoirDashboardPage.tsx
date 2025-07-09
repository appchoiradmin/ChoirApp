import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';
import { useUser } from '../hooks/useUser';
import { getNextSunday } from '../utils/getNextSunday';
import styles from './ChoirDashboardPage.module.scss';

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
      <div className={styles['choir-dashboard-root']}>
        {/* Shared Date Picker */}
        <div className={styles['date-picker-container']}>
          <label className={styles.label} htmlFor="playlist-date-picker">Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            className={styles.input}
          />
          <p className={styles.help}>(This date applies to both Master Songs and Playlists tabs.)</p>
        </div>
        <Outlet />
        <BottomNavigation tabs={tabs} />
      </div>
    </SharedDateContext.Provider>
  );
};

export default ChoirDashboardPage;
