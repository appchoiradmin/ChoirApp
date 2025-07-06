import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getInvitations, acceptInvitation, rejectInvitation } from '../services/invitationService';
import { Invitation } from '../types/invitation';
import InvitationsList from '../components/InvitationsList';

const DashboardPage: React.FC = () => {
  const { user, loading } = useUser();
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const { token } = useUser();
  useEffect(() => {
    if (user && token) {
      getInvitations(token).then(setInvitations);
    }
  }, [user, token]);

  const handleAccept = async (invitationToken: string) => {
    if (token) {
      await acceptInvitation(invitationToken, token);
      setInvitations(invitations.filter(i => i.invitationToken !== invitationToken));
      // Ideally, we should also update the user's choirs list
    }
  };

  const handleReject = async (invitationToken: string) => {
    if (token) {
      await rejectInvitation(invitationToken, token);
      setInvitations(invitations.filter(i => i.invitationToken !== invitationToken));
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Loading dashboard...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Welcome!</h1>
          <p>Please log in to see your dashboard.</p>
          <Link to="/" className="button is-primary">Go to Homepage</Link>
        </div>
      </section>
    );
  }

  const { name, email, choirs } = user;

  const adminOfChoirs = choirs.filter(c => c.role === 'Admin');
  const memberOfChoirs = choirs.filter(c => c.role === 'Member');
  // TODO: Fetch pending invitations

  return (
    <section className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <div>
              <h1 className="title">Choir Dashboard</h1>
              <p className="subtitle">
                Welcome, <strong>{name}</strong>! ({email})
              </p>
            </div>
          </div>
          <div className="level-right">
            <Link to="/master-songs" className="button is-link">
              <span className="icon"><i className="fas fa-music"></i></span>
              <span>Master Song List</span>
            </Link>
            <Link to="/create-choir" className="button is-primary">
              <span className="icon"><i className="fas fa-plus"></i></span>
              <span>Create New Choir</span>
            </Link>
          </div>
        </div>
        <hr />

        <div className="columns">
          <div className="column">
            <h2 className="title is-4">My Choirs (Admin)</h2>
            {adminOfChoirs.length > 0 ? (
              <div className="list">
                {adminOfChoirs.map(choir => (
                  <div key={choir.id} className="list-item">
                    <Link to={`/choirs/${choir.id}/songs`}>{choir.name}</Link>
                    <Link to={`/choir/${choir.id}/admin`} className="button is-link is-small ml-4">Admin</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>You haven't created any choirs yet.</p>
            )}
          </div>

          <div className="column">
            <h2 className="title is-4">Choirs I'm a Member Of</h2>
            {memberOfChoirs.length > 0 ? (
              <div className="list">
                {memberOfChoirs.map(choir => (
                  <div key={choir.id} className="list-item">
                    <Link to={`/choirs/${choir.id}/songs`}>{choir.name}</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>You are not a member of any choirs.</p>
            )}
          </div>

          <div className="column">
            <h2 className="title is-4">Pending Invitations</h2>
            <InvitationsList invitations={invitations} onAccept={handleAccept} onReject={handleReject} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
