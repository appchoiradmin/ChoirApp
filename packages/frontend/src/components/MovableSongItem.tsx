import React from 'react';
import { PlaylistSong, PlaylistSection } from '../types/playlist';
import { ChoirSongVersionDto } from '../types/choir';

interface MovableSongItemProps {
  song: PlaylistSong;
  section: PlaylistSection;
  sections: PlaylistSection[];
  choirSongs: ChoirSongVersionDto[];
  onMoveSong: (song: PlaylistSong, fromSectionId: string, toSectionId: string) => void;
  onRemoveSong: (sectionId: string, songId: string) => void;
}

const MovableSongItem: React.FC<MovableSongItemProps> = ({
  song,
  section,
  sections,
  choirSongs,
  onMoveSong,
  onRemoveSong,
}) => {
  const songData = choirSongs.find(cs => cs.choirSongId === song.choirSongVersionId);

  const handleMove = (toSectionId: string) => {
    onMoveSong(song, section.id, toSectionId);
  };

  return (
    <li className="movable-song-item">
      <span>{songData?.masterSong?.title}</span>
      <div className="song-actions">
        <div className="select is-small">
          <select
            value={section.id}
            onChange={(e) => handleMove(e.target.value)}
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <button
          className="delete is-small ml-2"
          onClick={() => onRemoveSong(section.id, song.masterSongId!)}
        ></button>
      </div>
    </li>
  );
};

export default MovableSongItem;
