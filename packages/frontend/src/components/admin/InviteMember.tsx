import React, { useState } from 'react';
import './InviteMember.scss';

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
    <div className="invite-member-card card">
      <header className="card-header">
        <p className="card-header-title">Invite New Member</p>
      </header>
      <div className="card-content">
        <form onSubmit={handleSubmit} className="invite-form">
          <div className="field is-grouped">
            <div className="control is-expanded">
              <input
                className="input"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                aria-label="Email address"
              />
            </div>
            <div className="control send-button-container">
              <button 
                className="button is-primary" 
                type="submit"
                aria-label="Send invitation"
              >
                <span className="icon">
                  <i className="fas fa-paper-plane"></i>
                </span>
                <span className="button-text">Send</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMember;
