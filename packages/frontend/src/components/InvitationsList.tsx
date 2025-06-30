import React, { useState } from 'react';
import { Invitation } from '../types/invitation';

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
        <div key={choirName} className="list-item">
          <div onClick={() => toggleExpand(choirName)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>
              You have been invited to join <strong className="has-text-link">{choirName}</strong>.
            </p>
            {choirInvitations.length > 1 && (
              <span className="icon">
                <i className={`fas fa-angle-${expandedChoir === choirName ? 'up' : 'down'}`}></i>
              </span>
            )}
          </div>
            {expandedChoir === choirName && (
            <div className="list">
              {choirInvitations.map(invitation => (
                <div key={invitation.invitationToken} className="list-item">
                  <span>{new Date(invitation.sentAt).toLocaleString()}</span>
                  <div className="buttons">
                    <button className="button is-success" onClick={() => onAccept(invitation.invitationToken)}>
                      Accept
                    </button>
                    <button className="button is-danger" onClick={() => onReject(invitation.invitationToken)}>
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
