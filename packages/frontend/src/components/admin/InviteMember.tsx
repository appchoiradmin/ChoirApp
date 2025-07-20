import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './InviteMember.scss';

interface InviteMemberProps {
  onInviteMember: (email: string) => void;
}

const InviteMember: React.FC<InviteMemberProps> = ({ onInviteMember }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onInviteMember(email);
      setEmail('');
    }
  };

  return (
    <div className="invite-member-card card">
      <header className="card-header">
        <p className="card-header-title">{t('inviteNewMember')}</p>
      </header>
      <div className="card-content">
        <form onSubmit={handleSubmit} className="invite-form">
          <div className="field is-grouped">
            <div className="control is-expanded">
              <input
                className="input"
                type="email"
                placeholder={t('enterEmailAddress')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                aria-label={t('emailAddress')}
              />
            </div>
            <div className="control send-button-container">
              <button 
                className="button is-primary send-button" 
                type="submit"
                aria-label={t('sendInvitation')}
              >
                {t('send')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMember;
