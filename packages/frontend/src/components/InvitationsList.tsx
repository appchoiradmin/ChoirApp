import React, { useState } from 'react';
import { Invitation } from '../types/invitation';
import styles from './InvitationsList.module.scss';

interface InvitationsListProps {
  invitations: Invitation[];
  onAccept: (token: string) => void;
  onReject: (token: string) => void;
}

const InvitationsList: React.FC<InvitationsListProps> = ({ invitations, onAccept, onReject }) => {
  const [expandedChoir, setExpandedChoir] = useState<string | null>(null);

  if (invitations.length === 0) {
    return <p>You have no pending invitations.</p>;
  }

  const groupedInvitations = invitations.reduce((acc, invitation) => {
    if (!acc[invitation.choirName]) {
      acc[invitation.choirName] = [];
    }
    acc[invitation.choirName].push(invitation);
    acc[invitation.choirName].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return acc;
  }, {} as Record<string, Invitation[]>);

  const toggleExpand = (choirName: string) => {
    setExpandedChoir(expandedChoir === choirName ? null : choirName);
  };

  return (
    <div className="invitations-list">
      {Object.entries(groupedInvitations).map(([choirName, choirInvitations]) => (
        <div key={choirName} className={styles.listItem}>
          <div onClick={() => toggleExpand(choirName)} className={styles.choirHeader}>
            <p>
              You have been invited to join <strong className={styles.choirName}>{choirName}</strong>.
            </p>
            {choirInvitations.length > 1 && (
              <span className={styles.icon}>
                <i className={`fas fa-angle-${expandedChoir === choirName ? 'up' : 'down'}`}></i>
              </span>
            )}
          </div>
            {expandedChoir === choirName && (
            <div className="list">
              {choirInvitations.map(invitation => (
                <div key={invitation.invitationToken} className={styles.listItem}>
                  <span>{new Date(invitation.sentAt).toLocaleString()}</span>
                  <div className="buttons">
                    <button className={styles.button + ' ' + styles.acceptButton} onClick={() => onAccept(invitation.invitationToken)}>
                      Accept
                    </button>
                    <button className={styles.button + ' ' + styles.rejectButton} onClick={() => onReject(invitation.invitationToken)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InvitationsList;
