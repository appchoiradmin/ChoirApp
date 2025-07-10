import React, { useState } from 'react';
import { ChoirMember, ChoirRole } from '../../types/choir';
import { Card, Button } from '../ui';
import {
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import './MembersList.scss';

interface MembersListProps {
  members: ChoirMember[];
  onRemoveMember: (userId: string) => void;
  onUpdateMemberRole: (userId: string, role: ChoirRole) => void;
}

interface MemberCardProps {
  member: ChoirMember;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateRole: (role: ChoirRole) => void;
  onRemove: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isExpanded,
  onToggleExpand,
  onUpdateRole,
  onRemove
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const isAdmin = member.role === 'Admin' || member.role === 'ChoirAdmin';
  
  const handleRoleToggle = () => {
    const newRole = isAdmin ? 'Member' : 'Admin';
    onUpdateRole(newRole);
    setDropdownOpen(false);
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from the choir?`)) {
      onRemove();
    }
    setDropdownOpen(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on action buttons
    if ((e.target as HTMLElement).closest('.member-actions')) {
      return;
    }
    onToggleExpand();
  };

  return (
    <Card className={`member-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="member-content">
        {/* Main Member Info */}
        <div className="member-header" onClick={handleCardClick}>
          <div className="member-avatar">
            <UserIcon />
          </div>
          
          <div className="member-info">
            <h3 className="member-name">{member.name}</h3>
            <div className="member-meta">
              <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`}>
                {isAdmin ? <ShieldCheckIcon /> : <UserGroupIcon />}
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
          
          <div className="member-actions">
            {/* Desktop dropdown */}
            <div className="dropdown" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="action-button"
              >
                <EllipsisVerticalIcon />
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleToggle();
                    }}
                    className="dropdown-item"
                  >
                    <PencilIcon />
                    {isAdmin ? 'Demote to Member' : 'Promote to Admin'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="dropdown-item danger"
                  >
                    <TrashIcon />
                    Remove Member
                  </button>
                </div>
              )}
            </div>
            
            {/* Expand/collapse button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`action-button expand-button ${isExpanded ? 'expanded' : ''}`}
            >
              <ChevronDownIcon />
            </button>
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="member-details">
            <div className="detail-item">
              <EnvelopeIcon className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Email</span>
                <span className="detail-value">{member.email}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <ShieldCheckIcon className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Role</span>
                <span className="detail-value">{isAdmin ? 'Administrator' : 'Member'}</span>
              </div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="member-mobile-actions">
              <Button
                variant={isAdmin ? "outlined" : "primary"}
                size="sm"
                onClick={() => handleRoleToggle()}
                className="role-button"
              >
                {isAdmin ? 'Demote to Member' : 'Promote to Admin'}
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={handleRemove}
                className="remove-button danger"
              >
                Remove Member
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const MembersList: React.FC<MembersListProps> = ({
  members,
  onRemoveMember,
  onUpdateMemberRole,
}) => {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const toggleExpand = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  const adminCount = members.filter(m => m.role === 'Admin' || m.role === 'ChoirAdmin').length;
  const memberCount = members.length - adminCount;

  if (members.length === 0) {
    return (
      <Card className="members-empty">
        <div className="empty-state">
          <UserGroupIcon className="empty-icon" />
          <h3 className="empty-title">No Members Yet</h3>
          <p className="empty-message">
            Start building your choir by inviting members to join.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="members-list">
      {/* Stats Header */}
      <div className="members-stats">
        <div className="stat-item">
          <UsersIcon className="stat-icon" />
          <span className="stat-label">Total:</span>
          <span className="stat-value">{members.length}</span>
        </div>
        <div className="stat-item">
          <ShieldCheckIcon className="stat-icon" />
          <span className="stat-label">Admins:</span>
          <span className="stat-value">{adminCount}</span>
        </div>
        <div className="stat-item">
          <UserGroupIcon className="stat-icon" />
          <span className="stat-label">Members:</span>
          <span className="stat-value">{memberCount}</span>
        </div>
      </div>

      {/* Member Cards */}
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isExpanded={expandedMember === member.id}
          onToggleExpand={() => toggleExpand(member.id)}
          onUpdateRole={(role) => onUpdateMemberRole(member.id, role)}
          onRemove={() => onRemoveMember(member.id)}
        />
      ))}
    </div>
  );
};

export default MembersList;
