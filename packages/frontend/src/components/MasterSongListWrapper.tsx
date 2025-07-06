import React from 'react';
import { useParams } from 'react-router-dom';
import MasterSongList from './MasterSongList';

const MasterSongListWrapper: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();

  if (!choirId) {
    return <div>Choir ID not found</div>;
  }

  return <MasterSongList />;
};

export default MasterSongListWrapper;
