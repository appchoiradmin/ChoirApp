import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Invitation } from '../../types/invitation';
import './InvitationsAccordion.scss';

interface InvitationsAccordionProps {
  pendingInvitations: Invitation[];
  sentInvitations: Invitation[];
}

const InvitationsAccordion: React.FC<InvitationsAccordionProps> = ({ 
  pendingInvitations, 
  sentInvitations 
}) => {
  const { t } = useTranslation();
  const [isPendingExpanded, setIsPendingExpanded] = useState(true);
  const [isSentExpanded, setIsSentExpanded] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});

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

  const toggleSection = (section: 'pending' | 'sent') => {
    if (section === 'pending') {
      setIsPendingExpanded(!isPendingExpanded);
    } else {
      setIsSentExpanded(!isSentExpanded);
    }
  };

  const toggleEmail = (email: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  // Group invitations by email
  const groupInvitationsByEmail = (invitations: Invitation[]) => {
    return invitations.reduce((acc, invitation) => {
      if (!acc[invitation.email]) {
        acc[invitation.email] = [];
      }
      acc[invitation.email].push(invitation);
      // Sort by date, newest first
      acc[invitation.email].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      return acc;
    }, {} as Record<string, Invitation[]>);
  };

  const pendingGrouped = groupInvitationsByEmail(pendingInvitations);
  const sentGrouped = groupInvitationsByEmail(sentInvitations);

  const renderInvitationGroup = (groupedInvitations: Record<string, Invitation[]>) => {
    return Object.entries(groupedInvitations).map(([email, invitations]) => (
      <div key={email} className="invitation-email-group">
        <div 
          className="invitation-email-header"
          onClick={() => toggleEmail(email)}
        >
          <div className="invitation-email-info">
            <span className="invitation-email">{email}</span>
            <span className={`tag ${getStatusTagClass(invitations[0].status)}`}>
              {getTranslatedStatus(invitations[0].status)}
            </span>
          </div>
          <span className="icon">
            <i className={`fas fa-angle-${expandedEmails[email] ? 'up' : 'down'}`}></i>
          </span>
        </div>
        
        {expandedEmails[email] && (
          <div className="invitation-details">
            {invitations.map(invitation => (
              <div key={invitation.invitationToken} className="invitation-item">
                <div className="invitation-date">
                  {new Date(invitation.sentAt).toLocaleDateString()} 
                  {" "}
                  {new Date(invitation.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <span className={`tag ${getStatusTagClass(invitation.status)}`}>
                  {getTranslatedStatus(invitation.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  const getStatusTagClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'is-warning';
      case 'Accepted': return 'is-success';
      case 'Rejected': return 'is-danger';
      default: return 'is-light';
    }
  };

  return (
    <div className="invitations-accordion">
      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="accordion-section">
          <div 
            className={`accordion-header ${isPendingExpanded ? 'is-active' : ''}`}
            onClick={() => toggleSection('pending')}
          >
            <h3 className="accordion-title">
              {t('pendingInvitations')}
              <span className="tag is-warning is-light ml-2">{pendingInvitations.length}</span>
            </h3>
            <span className="icon">
              <i className={`fas fa-angle-${isPendingExpanded ? 'up' : 'down'}`}></i>
            </span>
          </div>
          
          {isPendingExpanded && (
            <div className="accordion-content">
              {pendingInvitations.length > 0 ? (
                renderInvitationGroup(pendingGrouped)
              ) : (
                <p className="has-text-grey">{t('noPendingInvitations')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sent Invitations Section */}
      {sentInvitations.length > 0 && (
        <div className="accordion-section">
          <div 
            className={`accordion-header ${isSentExpanded ? 'is-active' : ''}`}
            onClick={() => toggleSection('sent')}
          >
            <h3 className="accordion-title">
              {t('sentInvitations')}
              <span className="tag is-light ml-2">{sentInvitations.length}</span>
            </h3>
            <span className="icon">
              <i className={`fas fa-angle-${isSentExpanded ? 'up' : 'down'}`}></i>
            </span>
          </div>
          
          {isSentExpanded && (
            <div className="accordion-content">
              {sentInvitations.length > 0 ? (
                renderInvitationGroup(sentGrouped)
              ) : (
                <p className="has-text-grey">{t('noSentInvitations')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {pendingInvitations.length === 0 && sentInvitations.length === 0 && (
        <p className="has-text-grey">{t('noInvitationsSentYet')}</p>
      )}
    </div>
  );
};

export default InvitationsAccordion;
