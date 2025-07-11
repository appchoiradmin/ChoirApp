import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaylistSong, PlaylistSection } from '../types/playlist';
import { ChoirSongVersionDto } from '../types/choir';
import { MasterSongDto } from '../types/song';
import styles from './MovableSongItem.module.scss';

interface MovableSongItemProps {
  song: PlaylistSong;
  section: PlaylistSection;
  sections: PlaylistSection[];
  choirSongs: ChoirSongVersionDto[];
  masterSongs: MasterSongDto[];
  onMoveSong: (song: PlaylistSong, fromSectionId: string, toSectionId: string) => void;
  onRemoveSong: (sectionId: string, songId: string) => void;
}

const MovableSongItem: React.FC<MovableSongItemProps> = ({
  song,
  section,
  sections,
  choirSongs,
  masterSongs,
  onMoveSong,
  onRemoveSong,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // First try to get song data from the embedded properties (new structure)
  let title: string | undefined;
  let songId: string | undefined;
  
  if (song.masterSong) {
    title = song.masterSong.title;
    songId = song.masterSong.songId;
  } else if (song.choirSongVersion) {
    // For choir songs, use the choir version title
    title = song.choirSongVersion.title;
    // Use the choirSongId as the song identifier for navigation
    songId = song.choirSongVersion.choirSongId;
  } else {
    // Fallback: lookup in the arrays (old structure)
    const songData = choirSongs.find(cs => cs.choirSongId === song.choirSongVersionId);
    const masterSongFallback = !songData && song.masterSongId
      ? masterSongs.find(ms => ms.songId === song.masterSongId)
      : undefined;

    if (songData && songData.masterSong) {
      title = songData.masterSong.title;
      songId = songData.masterSong.songId;
    } else if (masterSongFallback) {
      title = masterSongFallback.title;
      songId = masterSongFallback.songId;
    }
  }

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleNavigate = (e: React.MouseEvent, songId: string) => {
    e.preventDefault();
    navigate(`/master-songs/${songId}`);
  };

  const handleMove = (toSectionId: string) => {
    onMoveSong(song, section.id, toSectionId);
    closeModal();
  };

  return (
    <li className={styles['movable-song-item']}>
      {title && songId ? (
        <a
          href={`/master-songs/${songId}`}
          onClick={e => handleNavigate(e, songId!)}
          tabIndex={0}
          aria-label={`View details for ${title}`}
        >
          {title}
        </a>
      ) : (
        <span
          style={{ color: '#b5b5b5', fontStyle: 'italic', padding: '8px 0', width: '100%', textAlign: 'center' }}
          aria-label="Unknown Song"
        >
          Unknown Song
        </span>
      )}
      <div className={styles['song-actions']}>
        <button className="button is-small" type="button" onClick={openModal}>
          Move To
        </button>
        <button
          className="delete is-small ml-2"
          type="button"
          onClick={() => onRemoveSong(section.id, song.id)}
          aria-label="Remove song from section"
        ></button>
      </div>

      {/* Bottom Sheet Modal for moving song to another section */}
      {isModalOpen && (
        <>
          <div className="bottom-sheet-overlay" onClick={closeModal}></div>
          <div className="bottom-sheet-modal animate-up">
            <div className="bottom-sheet-drag-handle"></div>
            <div className="bottom-sheet-header">
              <span className="bottom-sheet-title">Move Song To</span>
              <button className="bottom-sheet-close" aria-label="close" onClick={closeModal}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="bottom-sheet-body">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sections.filter(s => s.id !== section.id).map(s => (
                  <li key={s.id} style={{ marginBottom: 12 }}>
                    <button
                      className="bottom-sheet-section-btn"
                      onClick={() => handleMove(s.id)}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bottom-sheet-footer">
              <button className="bottom-sheet-cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>

          {/* Inline CSS for bottom sheet modal */}
          <style>{`
            .bottom-sheet-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(30, 30, 30, 0.25);
              z-index: 1000;
              transition: background 0.2s;
            }
            .bottom-sheet-modal {
              position: fixed;
              left: 0; right: 0;
              bottom: 0;
              margin: 0 auto;
              background: #fff;
              border-radius: 18px 18px 0 0;
              box-shadow: 0 -2px 24px rgba(0,0,0,0.18);
              z-index: 1001;
              max-width: 480px;
              width: 100%;
              min-height: 180px;
              padding: 0 0 12px 0;
              animation: slideUpSheet 0.18s cubic-bezier(.4,1.3,.6,1) 1;
            }
            .animate-up { animation: slideUpSheet 0.18s cubic-bezier(.4,1.3,.6,1) 1; }
            @keyframes slideUpSheet {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .bottom-sheet-drag-handle {
              width: 46px;
              height: 5px;
              background: #e5e5e5;
              border-radius: 3px;
              margin: 12px auto 4px auto;
            }
            .bottom-sheet-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 20px 0 20px;
              margin-bottom: 4px;
              margin-top: 2px;
            }
            .bottom-sheet-title {
              font-size: 1.2rem;
              font-weight: 600;
              color: #222;
            }
            .bottom-sheet-close {
              background: none;
              border: none;
              font-size: 1.6rem;
              color: #888;
              cursor: pointer;
              margin-left: 8px;
              margin-top: -2px;
            }
            .bottom-sheet-body {
              padding: 0 20px 0 20px;
            }
            .bottom-sheet-section-btn {
              width: 100%;
              padding: 14px 0;
              background: #f5f8ff;
              border: none;
              border-radius: 8px;
              color: #2763e6;
              font-size: 1.08rem;
              font-weight: 500;
              margin-bottom: 0;
              cursor: pointer;
              transition: background 0.12s;
            }
            .bottom-sheet-section-btn:hover,
            .bottom-sheet-section-btn:focus {
              background: #e6edff;
            }
            .bottom-sheet-footer {
              display: flex;
              justify-content: flex-end;
              padding: 8px 20px 0 20px;
            }
            .bottom-sheet-cancel-btn {
              background: none;
              border: none;
              color: #555;
              font-size: 1rem;
              padding: 8px 18px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background 0.13s;
            }
            .bottom-sheet-cancel-btn:hover,
            .bottom-sheet-cancel-btn:focus {
              background: #f2f2f2;
            }
            @media (max-width: 600px) {
              .bottom-sheet-modal {
                max-width: 100vw;
                border-radius: 14px 14px 0 0;
                padding-bottom: env(safe-area-inset-bottom, 10px);
              }
            }
          `}</style>
        </>
      )}
    </li>
  );
};

export default MovableSongItem;
