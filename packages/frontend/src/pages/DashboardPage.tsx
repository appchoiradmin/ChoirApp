import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

const DashboardPage: React.FC = () => {
  const { user, loading } = useUser();

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
              <h1 className="title">Dashboard</h1>
              <p className="subtitle">
                Welcome, <strong>{name}</strong>! ({email})
              </p>
            </div>
          </div>
          <div className="level-right">
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
                    <Link to={`/choir/${choir.id}/admin`}>{choir.name}</Link>
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
                    <Link to={`/choir/${choir.id}`}>{choir.name}</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>You are not a member of any choirs.</p>
            )}
          </div>

          <div className="column">
            <h2 className="title is-4">Pending Invitations</h2>
            {/* TODO: Replace with actual invitation data */}
            <p>You have no pending invitations.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
