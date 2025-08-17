import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingState, Button } from '../components/ui';
import { useTranslation } from '../hooks/useTranslation';
import { CheckCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import './PlaylistSharePage.scss';

type DownloadState = 'preparing' | 'downloading' | 'completed' | 'error';

const PlaylistSharePage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>('preparing');
  const { t } = useTranslation();


  useEffect(() => {
    if (playlistId) {
      const downloadPDF = async () => {
        try {
          setDownloadState('preparing');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          const pdfUrl = `${API_BASE_URL}/api/playlists/${playlistId}/pdf`;
          
          // Show preparing message briefly
          await new Promise(resolve => setTimeout(resolve, 800));
          
          setDownloadState('downloading');
          
          // Create a hidden link to trigger download
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `playlist-${playlistId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Show download completed message
          setTimeout(() => {
            setDownloadState('completed');
          }, 1500);
          
        } catch (err) {
          setDownloadState('error');
          setError(t('share.downloadError'));
        }
      };
      
      downloadPDF();
    } else {
      setError(t('share.noPlaylistId'));
    }
  }, [playlistId, t]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  if (error) {
    return (
      <div className="share-page">
        <div className="share-hero">
          <div className="share-content">
            <div className="share-brand">
              <img 
                src="/icons/icon-128x128.png" 
                alt="AppChoir" 
                className="share-brand-icon"
              />
              <h1 className="share-brand-title">
                <span className="brand-accent">App</span>Choir
              </h1>
            </div>
            
            <div className="share-status error">
              <div className="status-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h2 className="status-title">{error}</h2>
              <p className="status-description">{t('share.checkLink')}</p>
            </div>
            
            <div className="share-footer">
              <p className="footer-text">{t('share.poweredBy')}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
                className="join-button"
              >
                <ArrowTopRightOnSquareIcon className="button-icon" />
                {t('share.joinApp')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStateMessage = () => {
    switch (downloadState) {
      case 'preparing':
        return t('share.preparing');
      case 'downloading':
        return t('share.downloading');
      case 'completed':
        return t('share.completed');
      default:
        return t('share.preparing');
    }
  };

  const getStateDescription = () => {
    switch (downloadState) {
      case 'preparing':
        return t('share.preparingDesc');
      case 'downloading':
        return t('share.downloadingDesc');
      case 'completed':
        return t('share.completedDesc');
      default:
        return t('share.preparingDesc');
    }
  };

  const getStateIcon = () => {
    switch (downloadState) {
      case 'completed':
        return (
          <div className="status-icon success">
            <CheckCircleIcon className="icon" />
          </div>
        );
      default:
        return (
          <div className="status-icon loading">
            <LoadingState />
          </div>
        );
    }
  };

  return (
    <div className="share-page">
      <div className="share-hero">
        <div className="share-content">
          <div className="share-brand">
            <img 
              src="/icons/icon-128x128.png" 
              alt="ChoirApp" 
              className="share-brand-icon"
            />
            <h1 className="share-brand-title">
              <span className="brand-accent">Choir</span>App
            </h1>
          </div>
          
          <div className="share-status">
            {getStateIcon()}
            <h2 className="status-title">{getStateMessage()}</h2>
            <p className="status-description">{getStateDescription()}</p>
            
            {downloadState === 'completed' && (
              <div className="completion-note">
                <p>{t('share.completedNote')}</p>
              </div>
            )}
          </div>
          
          <div className="share-footer">
            <p className="footer-text">{t('share.poweredBy')}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
              className="join-button"
            >
              <ArrowTopRightOnSquareIcon className="button-icon" />
              {t('share.joinApp')}
            </Button>
          </div>
        </div>
        
        {/* Background decoration matching home page */}
        <div className="share-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistSharePage;
