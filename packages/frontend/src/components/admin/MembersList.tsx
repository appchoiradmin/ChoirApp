import React, { useState } from 'react';
import { ChoirMember, ChoirRole } from '../../types/choir';
import { UserRole } from '../../constants/roles';
import { useTranslation } from '../../hooks/useTranslation';
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
  onRemoveMember?: (userId: string) => void;
  onUpdateMemberRole?: (userId: string, role: ChoirRole) => void;
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
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
    const isAdmin = member.role === UserRole.ChoirAdmin;
  
  const handleRoleToggle = () => {
        const newRole = isAdmin ? UserRole.ChoirMember : UserRole.ChoirAdmin;
    onUpdateRole(newRole);
    setDropdownOpen(false);
  };

  const handleRemove = () => {
    if (window.confirm(t('confirmRemoveMember', { name: member.name }))) {
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
                {isAdmin ? t('admin') : t('member')}
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
                    {isAdmin ? t('demoteToMember') : t('promoteToAdmin')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="dropdown-item danger"
                  >
                    <TrashIcon />
                    {t('removeMember')}
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
                <span className="detail-label">{t('email')}</span>
                <span className="detail-value">{member.email}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <ShieldCheckIcon className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{t('role')}</span>
                <span className="detail-value">{isAdmin ? t('administrator') : t('member')}</span>
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
                {isAdmin ? t('demoteToMember') : t('promoteToAdmin')}
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={handleRemove}
                className="remove-button danger"
              >
                {t('removeMember')}
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
  const { t } = useTranslation();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const toggleExpand = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

    const adminCount = members.filter(m => m.role === UserRole.ChoirAdmin).length;
  const memberCount = members.length - adminCount;

  if (members.length === 0) {
    return (
      <Card className="members-empty">
        <div className="empty-state">
          <UserGroupIcon className="empty-icon" />
          <h3 className="empty-title">{t('noMembersYet')}</h3>
          <p className="empty-message">
            {t('startBuildingChoir')}
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
          <span className="stat-label">{t('total')}</span>
          <span className="stat-value">{members.length}</span>
        </div>
        <div className="stat-item">
          <ShieldCheckIcon className="stat-icon" />
          <span className="stat-label">{t('admins')}</span>
          <span className="stat-value">{adminCount}</span>
        </div>
        <div className="stat-item">
          <UserGroupIcon className="stat-icon" />
          <span className="stat-label">{t('members')}</span>
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
          onUpdateRole={(role) => onUpdateMemberRole && onUpdateMemberRole(member.id, role)}
          onRemove={() => onRemoveMember && onRemoveMember(member.id)}
        />
      ))}
    </div>
  );
};

export default MembersList;
