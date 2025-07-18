import React from 'react';
import { PlaylistSection } from '../types/playlist';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

interface SectionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: PlaylistSection[];
  onSelectSection: (sectionId: string) => void;
  title?: string;
  isLoading?: boolean;
}

const SectionSelectionModal: React.FC<SectionSelectionModalProps> = ({
  isOpen,
  onClose,
  sections,
  onSelectSection,
  title = "Add Song To Section",
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleSectionSelect = (sectionId: string) => {
    onSelectSection(sectionId);
    onClose();
  };

  return (
    <>
      <div className="section-modal-overlay" onClick={onClose}></div>
      <div className="section-modal animate-up">
        <div className="section-modal-drag-handle"></div>
        <div className="section-modal-header">
          <span className="section-modal-title">{title}</span>
          <button className="section-modal-close" aria-label="close" onClick={onClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="section-modal-body">
          {isLoading ? (
            <div className="section-modal-loading">
              <div className="loading-spinner"></div>
              <span>Loading sections...</span>
            </div>
          ) : sections.length > 0 ? (
            <ul className="section-modal-list">
              {sections.map(section => (
                <li key={section.id} className="section-modal-item">
                  <button
                    className="section-modal-btn"
                    onClick={() => handleSectionSelect(section.id)}
                  >
                    <MusicalNoteIcon className="section-modal-icon" />
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="section-modal-empty">
              <MusicalNoteIcon className="section-modal-empty-icon" />
              <span>No sections available</span>
            </div>
          )}
        </div>
        <div className="section-modal-footer">
          <button className="section-modal-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>

      {/* Inline CSS for section selection modal */}
      <style>{`
        .section-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(30, 30, 30, 0.25);
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .section-modal {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
        }

        .section-modal.animate-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .section-modal-drag-handle {
          width: 40px;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          margin: 12px auto 8px;
          flex-shrink: 0;
        }

        .section-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px 16px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }

        .section-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .section-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .section-modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .section-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .section-modal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #666;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e0e0e0;
          border-top: 2px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .section-modal-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .section-modal-item {
          margin-bottom: 8px;
        }

        .section-modal-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          font-size: 16px;
          color: #333;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .section-modal-btn:hover {
          background: #e9ecef;
          border-color: #4f46e5;
          transform: translateY(-1px);
        }

        .section-modal-btn:active {
          transform: translateY(0);
        }

        .section-modal-icon {
          width: 20px;
          height: 20px;
          color: #4f46e5;
          flex-shrink: 0;
        }

        .section-modal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #666;
        }

        .section-modal-empty-icon {
          width: 48px;
          height: 48px;
          color: #ccc;
          margin-bottom: 12px;
        }

        .section-modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #f0f0f0;
          flex-shrink: 0;
        }

        .section-modal-cancel-btn {
          width: 100%;
          padding: 12px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .section-modal-cancel-btn:hover {
          background: #e9ecef;
          color: #333;
        }

        /* Desktop styles */
        @media (min-width: 768px) {
          .section-modal {
            left: 50%;
            right: auto;
            bottom: auto;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 16px;
            max-width: 400px;
            max-height: 500px;
          }

          .section-modal.animate-up {
            animation: scaleIn 0.3s ease-out;
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        }
      `}</style>
    </>
  );
};

export default SectionSelectionModal;
