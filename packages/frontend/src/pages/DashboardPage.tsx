import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getInvitations, acceptInvitation, rejectInvitation } from '../services/invitationService';
import { Invitation } from '../types/invitation';
import InvitationsList from '../components/InvitationsList';
import styles from './DashboardPage.module.scss';

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
      <section className={styles.section}>
        <div className={styles.container}>
          <p>Loading dashboard...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <h1 className={styles.title}>Welcome!</h1>
          <p>Please log in to see your dashboard.</p>
          <Link to="/" className={styles.button}>Go to Homepage</Link>
        </div>
      </section>
    );
  }

  const { name, email, choirs } = user;

  const adminOfChoirs = choirs.filter(c => c.role === 'Admin');
  const memberOfChoirs = choirs.filter(c => c.role === 'Member');
  // TODO: Fetch pending invitations

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h1 className={styles.title}>Dashboard</h1>
        <p>Welcome, {name} ({email})!</p>

        <div style={{ marginBottom: '2rem' }}>
          <h2 className={styles.sectionHeader}>Your Choirs</h2>
          {adminOfChoirs.length > 0 && (
            <div>
              <h3 className={styles.subSectionHeader}>As Admin</h3>
              <ul className={styles.choirList}>
                {adminOfChoirs.map(c => (
                  <li key={c.id} className={styles.choirListItem}>
                    <Link to={`/choir/${c.id}/songs`} className={styles.button}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {memberOfChoirs.length > 0 && (
            <div>
              <h3 className={styles.subSectionHeader}>As Member</h3>
              <ul className={styles.choirList}>
                {memberOfChoirs.map(c => (
                  <li key={c.id} className={styles.choirListItem}>
                    <Link to={`/choir/${c.id}/songs`} className={styles.button}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionHeader}>Pending Invitations</h2>
          <InvitationsList invitations={invitations} onAccept={handleAccept} onReject={handleReject} />
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
