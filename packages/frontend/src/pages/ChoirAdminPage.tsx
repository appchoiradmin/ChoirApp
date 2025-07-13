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
import InvitationsAccordion from '../components/admin/InvitationsAccordion';
import { UserRole } from '../constants/roles';

const ChoirAdminPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId, user } = useUser();
  const [choir, setChoir] = useState<ChoirDetails | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const pendingInvitations = invitations.filter(inv => inv.status === 'Pending');
  const sentInvitations = invitations.filter(inv => inv.status !== 'Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchChoirDetails = useCallback(async () => {
    if (choirId && token && user) {
      try {
        setLoading(true);
        const details = await getChoirDetails(choirId, token);
        
        // Check if the current user is an admin of this choir
        const currentUserMembership = details.members.find(member => member.id === user.id);
        const userIsAdmin = currentUserMembership?.role === UserRole.ChoirAdmin;
        setIsAdmin(userIsAdmin);
        
        // Only fetch invitations if user is an admin
        let invitationsList: Invitation[] = [];
        if (userIsAdmin) {
          invitationsList = await getInvitationsByChoir(choirId, token);
        }
        
        setChoir(details);
        setInvitations(invitationsList);
      } catch (err) {
        console.error('Error fetching choir details:', err);
        setError('Failed to fetch choir details.');
      } finally {
        setLoading(false);
      }
    }
  }, [choirId, token, user]);

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
              <h1 className="title is-3 mb-1">{choir.name}</h1>
              {isAdmin ? (
                <>
                  <p className="subtitle is-5 has-text-weight-semibold mb-4">Admin Panel</p>
                  <p className="mb-5">Manage your choir members and playlist templates.</p>
                </>
              ) : (
                <p className="subtitle is-5 has-text-weight-semibold mb-4">Choir Details</p>
              )}
            </div>
          </div>
          <div className="level-right"></div>
        </div>
        <hr />
        <div className="columns is-multiline">
          <div className="column is-12-mobile is-7-tablet">
            <section className="box mb-4">
              <h2 className="title is-5 mb-3">Choir Members</h2>
              <MembersList
                members={choir.members}
                onRemoveMember={isAdmin ? handleRemoveMember : undefined}
                onUpdateMemberRole={isAdmin ? handleUpdateMemberRole : undefined}
              />
              {isAdmin && (
                <div className="mt-4">
                  <InviteMember onInviteMember={handleInviteMember} />
                </div>
              )}
            </section>
            {isAdmin && (
              <section className="box mb-4">
                <h2 className="title is-5 mb-3">Invitations</h2>
                <InvitationsAccordion 
                  pendingInvitations={pendingInvitations} 
                  sentInvitations={sentInvitations} 
                />
              </section>
            )}
          </div>
          {isAdmin && (
            <div className="column is-12-mobile is-5-tablet">
              <section className="box">
                <h2 className="title is-5 mb-3">Playlist Templates</h2>
                <Link to={`/choir/${choirId}/playlist-templates`} className="button is-info is-fullwidth">
                  <span className="icon"><i className="fas fa-list-alt"></i></span>
                  <span>Manage Playlist Templates</span>
                </Link>
                <p className="help mt-2">Create and edit reusable playlist structures for your choir's events.</p>
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ChoirAdminPage;
