import React, { useState } from 'react';
import { Card, Button } from '../ui';
import {
  UserPlusIcon,
  EnvelopeIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './InviteMemberEnhanced.scss';
import { useTranslation } from '../../hooks/useTranslation';

interface InviteMemberEnhancedProps {
  onInviteMember: (email: string) => void;
  isLoading?: boolean;
}

const InviteMemberEnhanced: React.FC<InviteMemberEnhancedProps> = ({ 
  onInviteMember, 
  isLoading = false 
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!email.trim()) {
      setError(t('inviteMemberEnhanced.emailRequired'));
      return;
    }
    
    if (!validateEmail(email)) {
      setError(t('inviteMemberEnhanced.emailInvalid'));
      return;
    }

    try {
      await onInviteMember(email);
      setEmail('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (err: any) {
      setError(err.message || t('inviteMemberEnhanced.invitationFailed'));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null); // Clear error when user starts typing
    if (success) setSuccess(false); // Clear success when user starts typing
  };

  return (
    <Card className="invite-member-enhanced">
      <div className="invite-header">
        <div className="invite-icon">
          <UserPlusIcon />
        </div>
        <div className="invite-title">
          <h3>{t('inviteMemberEnhanced.title')}</h3>
          <p>{t('inviteMemberEnhanced.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invite-form">
        <div className="form-group">
          <label htmlFor="email-input" className="form-label">
            {t('inviteMemberEnhanced.emailLabel')}
          </label>
          <div className="input-container">
            <div className="input-icon">
              <EnvelopeIcon />
            </div>
            <input
              id="email-input"
              type="email"
              className={`form-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
              placeholder={t('inviteMemberEnhanced.emailPlaceholder')}
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          
          {error && (
            <div className="form-message error">
              <ExclamationTriangleIcon className="message-icon" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="form-message success">
              <CheckIcon className="message-icon" />
              <span>{t('inviteMemberEnhanced.invitationSuccess')}</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!email.trim() || isLoading}
          leftIcon={<UserPlusIcon />}
          className="invite-button"
        >
          {isLoading ? t('inviteMemberEnhanced.sending') : t('inviteMemberEnhanced.sendInvitation')}
        </Button>
      </form>

      <div className="invite-help">
        <p>
          <strong>{t('inviteMemberEnhanced.noteTitle')}</strong> {t('inviteMemberEnhanced.noteText')}
        </p>
      </div>
    </Card>
  );
};

export default InviteMemberEnhanced;
