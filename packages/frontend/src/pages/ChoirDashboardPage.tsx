import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import DatePicker from '../components/DatePicker';
import { Layout, Navigation } from '../components/ui';
import { useUser } from '../hooks/useUser';
import { getChoirDetails } from '../services/choirService';
import { getNextSunday } from '../utils/getNextSunday';
import { ChoirDetails } from '../types/choir';
import { UserRole } from '../constants/roles';
import { 
  MusicalNoteIcon, 
  QueueListIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

import styles from './ChoirDashboardPage.module.scss';

// Create a shared date context
export const SharedDateContext = React.createContext<{
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}>({
  selectedDate: getNextSunday(),
  setSelectedDate: () => {}
});

const ChoirDashboardPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(getNextSunday());
  const [choir, setChoir] = useState<ChoirDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { choirId } = useParams<{ choirId: string }>();
  const { user, token } = useUser();
  const navigate = useNavigate();

    const isAdmin = user?.choirs.some(c => c.id === choirId && c.role === UserRole.ChoirAdmin);

  // Fetch choir details for navigation title
  useEffect(() => {
    const fetchChoir = async () => {
      if (!choirId || !token) return;
      
      try {
        setLoading(true);
        const choirData = await getChoirDetails(choirId, token);
        setChoir(choirData);
      } catch (error) {
        console.error('Error fetching choir details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChoir();
  }, [choirId, token]);

  const tabs = [
    { name: 'Songs', path: `/choir/${choirId}/songs`, icon: <MusicalNoteIcon /> },
    { name: 'Playlists', path: `/choir/${choirId}/playlists`, icon: <QueueListIcon /> },
  ];

  if (isAdmin) {
    tabs.splice(2, 0, { name: 'Admin', path: `/choir/${choirId}/admin`, icon: <Cog6ToothIcon /> }); // Insert Admin as the last tab
  }

  return (
    <SharedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <Layout
        navigation={
          <Navigation 
            title={loading ? 'Loading...' : choir?.name || 'Choir Dashboard'}
            showBackButton={true} 
            onBackClick={() => navigate('/dashboard')}
          />
        }
        bottomNav={<BottomNavigation tabs={tabs} />}
      >
        <div className={styles['choir-dashboard-root']}>
          {/* Shared Date Picker */}
          <div className={styles['date-picker-container']}>
            <label className={styles.label} htmlFor="playlist-date-picker">Select Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date || getNextSunday())}
              className={styles.input}
            />
          </div>
          <Outlet />
        </div>
      </Layout>
    </SharedDateContext.Provider>
  );
};

export default ChoirDashboardPage;
