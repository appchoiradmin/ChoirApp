import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { QrCodeIcon, DocumentIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Button } from './ui';
import './SharePlaylistModal.scss';

interface SharePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  playlistTitle: string;
}

const SharePlaylistModal: React.FC<SharePlaylistModalProps> = ({
  isOpen,
  onClose,
  playlistId,
  playlistTitle
}) => {
  const { t } = useTranslation();
  const [shareUrl, setShareUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && playlistId) {
      // Generate the PDF share URL using the API base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const pdfUrl = `${API_BASE_URL}/api/playlists/${playlistId}/pdf`;
      setShareUrl(pdfUrl);
    }
  }, [isOpen, playlistId]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownloadPdf = () => {
    window.open(shareUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card share-playlist-modal">
        <header className="modal-card-head">
          <p className="modal-card-title">
            <ShareIcon className="icon" />
            {t('playlists.sharePlaylist')}
          </p>
          <button 
            className="delete" 
            aria-label="close" 
            onClick={onClose}
          ></button>
        </header>
        
        <section className="modal-card-body">
          <div className="share-content">
            <div className="playlist-info">
              <h4 className="playlist-title">{playlistTitle}</h4>
              <p className="share-description">
                {t('playlists.shareDescription')}
              </p>
            </div>

            <div className="share-options">
              {/* QR Code Toggle */}
              <div className="field">
                <div className="control">
                  <Button
                    variant={showQR ? 'primary' : 'secondary'}
                    onClick={() => setShowQR(!showQR)}
                    className="qr-toggle-btn"
                  >
                    <QrCodeIcon className="icon" />
                    {showQR ? t('playlists.hideQR') : t('playlists.showQR')}
                  </Button>
                </div>
              </div>

              {/* QR Code Display */}
              {showQR && (
                <div className="qr-code-container">
                  <div className="qr-code-wrapper">
                    <QRCode
                      value={shareUrl}
                      size={200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox="0 0 256 256"
                    />
                  </div>
                  <p className="qr-instructions">
                    {t('playlists.qrInstructions')}
                  </p>
                </div>
              )}

              {/* Share URL */}
              <div className="field">
                <label className="label">{t('playlists.shareUrl')}</label>
                <div className="field has-addons">
                  <div className="control is-expanded">
                    <input
                      className="input"
                      type="text"
                      value={shareUrl}
                      readOnly
                    />
                  </div>
                  <div className="control">
                    <Button
                      variant="secondary"
                      onClick={handleCopyUrl}
                      className={copied ? 'is-success' : ''}
                    >
                      {copied ? t('common.copied') : t('common.copy')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="field">
                <div className="control">
                  <Button
                    variant="primary"
                    onClick={handleDownloadPdf}
                    className="download-pdf-btn"
                  >
                    <DocumentIcon className="icon" />
                    {t('playlists.downloadPdf')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="modal-card-foot">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default SharePlaylistModal;
