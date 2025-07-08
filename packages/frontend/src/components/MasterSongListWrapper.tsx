import React from 'react';
import { useParams } from 'react-router-dom';
import MasterSongList from './MasterSongList';
import { PlaylistProvider } from '../context/PlaylistContext';
import { useUser } from '../hooks/useUser';
import { useSharedDate } from '../hooks/useSharedDate';

const MasterSongListWrapper: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, loading } = useUser();
  const { selectedDate } = useSharedDate();

  if (!choirId) {
    return <div>Choir ID not found</div>;
  }

  if (loading) {
    return <div>Loading user authentication...</div>;
  }

  return (
    <PlaylistProvider choirId={choirId} date={selectedDate} token={token}>
      <MasterSongList choirId={choirId} />
    </PlaylistProvider>
  );
};

export default MasterSongListWrapper;
