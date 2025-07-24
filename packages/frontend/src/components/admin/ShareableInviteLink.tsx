import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { createShareableInvite } from '../../services/shareableInviteService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { LinkIcon, ClipboardIcon, CheckIcon, ShareIcon } from '@heroicons/react/24/outline';
import './ShareableInviteLink.scss';

interface ShareableInviteLinkProps {
  choirId: string;
  token: string;
}

const ShareableInviteLink: React.FC<ShareableInviteLinkProps> = ({ choirId, token }) => {
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await createShareableInvite(choirId, token);
      setInviteLink(result.inviteLink);
    } catch (err: any) {
      setError(err.message || t('shareableInvite.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError(t('shareableInvite.copyError'));
    }
  };

  return (
    <Card className="shareable-invite-card">
      <div className="card-header">
        <h3 className="card-title">
          <LinkIcon className="icon" />
          {t('shareableInvite.title')}
        </h3>
      </div>
      
      <div className="card-content">
        <p className="description">
          {t('shareableInvite.description')}
        </p>
        
        {!inviteLink ? (
          <Button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            variant="primary"
            leftIcon={<LinkIcon />}
            className="generate-button"
          >
            {isGenerating ? t('shareableInvite.generating') : t('shareableInvite.generateLink')}
          </Button>
        ) : (
          <div className="mobile-invite-container">
            {/* Mobile Success State */}
            <div className="mobile-success-card">
              <div className="success-icon-mobile">
                <CheckIcon className="check-icon" />
              </div>
              <h3 className="success-title-mobile">{t('shareableInvite.linkReady')}</h3>
              <p className="success-subtitle-mobile">{t('shareableInvite.shareWithMembers')}</p>
            </div>

            {/* Mobile Link Display */}
            <div className="mobile-link-card">
              <div className="link-header-mobile">
                <LinkIcon className="link-icon-mobile" />
                <span className="link-label-mobile">Invitation Link</span>
              </div>
              
              <div className="link-input-mobile" onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input) input.select();
              }}>
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="link-field-mobile"
                />
              </div>
              
              <Button
                onClick={handleCopyLink}
                variant="primary"
                className={`copy-button-mobile ${isCopied ? 'copied' : ''}`}
                leftIcon={isCopied ? <CheckIcon /> : <ClipboardIcon />}
              >
                {isCopied ? t('shareableInvite.copied') : t('shareableInvite.copy')}
              </Button>
            </div>

            {/* Mobile Info Card */}
            <div className="mobile-info-card">
              <div className="expiry-info-mobile">
                <span className="expiry-icon">⏰</span>
                <span className="expiry-text-mobile">{t('shareableInvite.expiryInfo')}</span>
              </div>
              
              <Button
                onClick={handleGenerateLink}
                variant="outlined"
                size="sm"
                leftIcon={<ShareIcon />}
                className="regenerate-button-mobile"
              >
                {t('shareableInvite.generateNew')}
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShareableInviteLink;
