import React, { useState } from 'react';

interface InviteMemberProps {
  onInviteMember: (email: string) => void;
}

const InviteMember: React.FC<InviteMemberProps> = ({ onInviteMember }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onInviteMember(email);
      setEmail('');
    }
  };

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">Invite New Member</p>
      </header>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="field has-addons">
            <div className="control is-expanded">
              <input
                className="input"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="control">
              <button className="button is-primary" type="submit">
                Send Invitation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMember;
