import React from 'react';
import MasterSongsListPage from '../pages/MasterSongsListPage';
import { PlaylistProvider } from '../context/PlaylistContext';
import { useUser } from '../hooks/useUser';

const GeneralMasterSongsListWrapper: React.FC = () => {
  const { token } = useUser();
  // For general users, no choirId or date is provided
  return (
    <PlaylistProvider choirId={null} date={null} token={token}>
      <MasterSongsListPage />
    </PlaylistProvider>
  );
};

export default GeneralMasterSongsListWrapper;
