import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Invitation } from '../../types/invitation';

interface SentInvitationsListProps {
  invitations: Invitation[];
}

const SentInvitationsList: React.FC<SentInvitationsListProps> = ({ invitations }) => {
  const { t } = useTranslation();
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const getTranslatedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return t('pending');
      case 'accepted':
        return t('accepted');
      case 'rejected':
        return t('rejected');
      default:
        return status;
    }
  };

  if (invitations.length === 0) {
    return <p>{t('choirAdmin.noInvitationsSentYet')}</p>;
  }

  const groupedInvitations = invitations.reduce((acc, invitation) => {
    if (!acc[invitation.email]) {
      acc[invitation.email] = [];
    }
    acc[invitation.email].push(invitation);
    acc[invitation.email].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return acc;
  }, {} as Record<string, Invitation[]>);

  const toggleExpand = (email: string) => {
    setExpandedEmail(expandedEmail === email ? null : email);
  };

  return (
    <div>
      <h3 className="title is-4">{t('sentInvitations')}</h3>
      <div className="list">
        {Object.entries(groupedInvitations).map(([email, userInvitations]) => (
          <div key={email} className="list-item">
            <div onClick={() => toggleExpand(email)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="has-text-link">{email}</span>
                <span className={`tag is-${userInvitations[0].status === 'Pending' ? 'warning' : userInvitations[0].status === 'Accepted' ? 'success' : 'danger'}`}>
                  {getTranslatedStatus(userInvitations[0].status)}
                </span>
              </div>
              {userInvitations.length > 1 && (
                <span className="icon">
                  <i className={`fas fa-angle-${expandedEmail === email ? 'up' : 'down'}`}></i>
                </span>
              )}
            </div>
            {expandedEmail === email && (
              <div className="list">
                {userInvitations.map(invitation => (
                  <div key={invitation.invitationToken} className="list-item">
                    <span>{new Date(invitation.sentAt).toLocaleString()}</span>
                    <span className={`tag is-${invitation.status === 'Pending' ? 'warning' : invitation.status === 'Accepted' ? 'success' : 'danger'}`}>
                      {getTranslatedStatus(invitation.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentInvitationsList;
