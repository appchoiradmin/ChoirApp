import { Outlet, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useUser } from '../hooks/useUser';

const ChoirDashboardPage = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { user } = useUser();

  const isAdmin = user?.choirs.some(c => c.id === choirId && c.role === 'Admin');

  const tabs = [
    { name: 'Master Songs', path: `/choir/${choirId}/songs` },
    { name: 'Playlists', path: `/choir/${choirId}/playlists` },
  ];

  if (isAdmin) {
    tabs.push({ name: 'Admin', path: `/choir/${choirId}/admin` });
  }

  return (
    <div>
      <Outlet />
      <BottomNavigation tabs={tabs} />
    </div>
  );
};

export default ChoirDashboardPage;
