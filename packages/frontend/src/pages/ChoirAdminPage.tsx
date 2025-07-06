import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getChoirDetails,
  inviteUser,
  removeMember,
  updateMemberRole,
} from '../services/choirService';
import { getInvitationsByChoir } from '../services/invitationService';
import { useUser } from '../hooks/useUser';
import { ChoirDetails, ChoirRole } from '../types/choir';
import { Invitation } from '../types/invitation';
import MembersList from '../components/admin/MembersList';
import InviteMember from '../components/admin/InviteMember';
import ChoirSongsList from '../components/admin/ChoirSongsList';
import SentInvitationsList from '../components/admin/SentInvitationsList';

const ChoirAdminPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId } = useUser();
  const [choir, setChoir] = useState<ChoirDetails | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChoirDetails = useCallback(async () => {
    if (choirId && token) {
      try {
        setLoading(true);
        const details = await getChoirDetails(choirId, token);
        const invitations = await getInvitationsByChoir(choirId, token);
        setChoir(details);
        setInvitations(invitations);
      } catch (err) {
        setError('Failed to fetch choir details.');
      } finally {
        setLoading(false);
      }
    }
  }, [choirId, token]);

  useEffect(() => {
    if (choirId) {
      setChoirId(choirId);
    }
    fetchChoirDetails();
  }, [choirId, fetchChoirDetails, setChoirId]);

  const handleInviteMember = async (email: string) => {
    if (choirId && token) {
      try {
        await inviteUser(choirId, email, token);
        alert('Invitation sent successfully!');
        fetchChoirDetails(); // Refresh the list
      } catch (error) {
        console.error('Failed to invite member:', error);
        alert('Failed to invite member. Please try again.');
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (choirId && token) {
      if (window.confirm('Are you sure you want to remove this member?')) {
        try {
          await removeMember(choirId, userId, token);
          fetchChoirDetails(); // Refresh the list
        } catch (error) {
          console.error('Failed to remove member:', error);
          alert('Failed to remove member. Please try again.');
        }
      }
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: ChoirRole) => {
    if (choirId && token) {
      try {
        await updateMemberRole(choirId, userId, role, token);
        fetchChoirDetails(); // Refresh the list
      } catch (error) {
        console.error('Failed to update member role:', error);
        alert('Failed to update member role. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Loading choir admin...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <p className="has-text-danger">{error}</p>
        </div>
      </section>
    );
  }

  if (!choir) {
    return (
      <section className="section">
        <div className="container">
          <p>Choir not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <div>
              <h1 className="title">{choir.name} - Admin</h1>
              <p className="subtitle">Manage your choir members, songs, and playlists.</p>
            </div>
          </div>
          <div className="level-right">
            <Link to="/master-songs" className="button is-link">
              <span className="icon"><i className="fas fa-music"></i></span>
              <span>Master Song List</span>
            </Link>
            <Link to={`/choir/${choirId}/playlist-templates`} className="button is-info">
              <span className="icon"><i className="fas fa-list-alt"></i></span>
              <span>Playlist Templates</span>
            </Link>
            <Link to="/dashboard" className="button">
              Go Back to Dashboard
            </Link>
          </div>
        </div>
        <hr />
        <div className="columns">
          <div className="column is-three-fifths">
            <MembersList
              members={choir.members}
              onRemoveMember={handleRemoveMember}
              onUpdateMemberRole={handleUpdateMemberRole}
            />
            <div className="mt-5">
              <ChoirSongsList choirId={choir.id} />
            </div>
          </div>
          <div className="column is-two-fifths">
            <InviteMember onInviteMember={handleInviteMember} />
            <div className="mt-5">
              <SentInvitationsList invitations={invitations || []} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChoirAdminPage;
