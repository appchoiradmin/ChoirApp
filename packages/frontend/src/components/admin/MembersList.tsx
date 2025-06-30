import React from 'react';
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
  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">Choir Members</p>
      </header>
      <div className="card-content">
        <div className="content">
          <table className="table is-fullwidth members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td data-label="Name"><span>{member.name}</span></td>
                  <td data-label="Email"><span>{member.email}</span></td>
                  <td data-label="Role"><span>{member.role}</span></td>
                  <td data-label="Actions">
                    <div className="buttons">
                      {member.role === 'Admin' ? (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembersList;
