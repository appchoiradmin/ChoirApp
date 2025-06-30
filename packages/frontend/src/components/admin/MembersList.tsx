import React, { useState } from 'react';
import { ChoirMember, ChoirRole } from '../../types/choir';
import './MembersList.css';

interface MembersListProps {
  members: ChoirMember[];
  onRemoveMember: (userId: string) => void;
  onUpdateMemberRole: (userId: string, role: ChoirRole) => void;
}

const MembersList: React.FC<MembersListProps> = ({
  members,
  onRemoveMember,
  onUpdateMemberRole,
}) => {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const toggleExpand = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">Choir Members</p>
      </header>
      <div className="card-content">
        <div className="content">
          <div className="list">
            {members.map(member => (
              <div key={member.id} className="list-item">
                <div onClick={() => toggleExpand(member.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="has-text-link">{member.name}</span>
                  <span
                    className={`tag is-${
                      member.role === 'Admin' || member.role === 'ChoirAdmin'
                        ? 'primary'
                        : 'info'
                    }`}
                  >
                    {member.role}
                  </span>
                  </div>
                  <span className="icon">
                    <i className={`fas fa-angle-${expandedMember === member.id ? 'up' : 'down'}`}></i>
                  </span>
                </div>
                {expandedMember === member.id && (
                  <div>
                    <p><strong>Email:</strong> {member.email}</p>
                    <p><strong>Role:</strong> {member.role}</p>
                    <div className="buttons">
                      {member.role === 'Admin' ||
                      member.role === 'ChoirAdmin' ? (
                        <button
                          className="button is-small is-warning"
                          onClick={() =>
                            onUpdateMemberRole(member.id, 'Member')
                          }
                        >
                          Demote to Member
                        </button>
                      ) : (
                        <button
                          className="button is-small is-success"
                          onClick={() =>
                            onUpdateMemberRole(member.id, 'Admin')
                          }
                        >
                          Promote to Admin
                        </button>
                      )}
                      <button
                        className="button is-small is-danger"
                        onClick={() => onRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersList;
