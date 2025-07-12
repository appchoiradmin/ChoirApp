import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { UserRole } from '../constants/roles';
import MembersListEnhanced from '../components/admin/MembersListEnhanced';
import InviteMemberEnhanced from '../components/admin/InviteMemberEnhanced';
import ChoirSongsList from '../components/admin/ChoirSongsList';
import InvitationsAccordion from '../components/admin/InvitationsAccordion';
import { Button, LoadingSpinner } from '../components/ui';
import Layout from '../components/ui/Layout';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import './ChoirAdminPageEnhanced.scss';

const ChoirAdminPageEnhanced: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId } = useUser();
  const navigate = useNavigate();
  const [choir, setChoir] = useState<ChoirDetails | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const pendingInvitations = invitations.filter(inv => inv.status === 'Pending');
  const sentInvitations = invitations.filter(inv => inv.status !== 'Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchChoirDetails = useCallback(async () => {
    if (choirId && token) {
      try {
        setLoading(true);
        const [details, invitationsData] = await Promise.all([
          getChoirDetails(choirId, token),
          getInvitationsByChoir(choirId, token)
        ]);
        setChoir(details);
        setInvitations(invitationsData);
      } catch (err) {
        setError('Failed to fetch choir details.');
        toast.error('Failed to load choir details');
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
    if (!choirId || !token) return;
    
    setInviteLoading(true);
    try {
      await inviteUser(choirId, email, token);
      toast.success('Invitation sent successfully!');
      fetchChoirDetails(); // Refresh the data
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send invitation';
      toast.error(errorMessage);
      throw error; // Re-throw to let the component handle it
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!choirId || !token) return;
    
    try {
      await removeMember(choirId, userId, token);
      toast.success('Member removed successfully');
      fetchChoirDetails(); // Refresh the data
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: ChoirRole) => {
    if (!choirId || !token) return;
    
    try {
      await updateMemberRole(choirId, userId, role, token);
      toast.success('Member role updated successfully');
      fetchChoirDetails(); // Refresh the data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member role');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-container">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="admin-container">
          <div className="error-state">
            <h2>Error loading choir</h2>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!choir) {
    return (
      <Layout>
        <div className="admin-container">
          <div className="error-state">
            <h2>Choir not found</h2>
            <p>The choir you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = {
    totalMembers: choir.members.length,
        admins: choir.members.filter(m => m.role === UserRole.ChoirAdmin).length,
    pendingInvitations: invitations.length,
    songs: 0 // This would come from ChoirSongsList component
  };

  return (
    <Layout>
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div className="header-content">
            <div className="header-title">
              <Button
                variant="ghost"
                leftIcon={<ArrowLeftIcon />}
                onClick={() => navigate('/dashboard')}
                className="back-button"
              >
                Back
              </Button>
              <div className="title-content">
                <h1 className="page-title">{choir.name}</h1>
                <p className="page-subtitle">Choir Administration</p>
              </div>
            </div>
            <div className="header-actions">
              <Button
                variant="outlined"
                leftIcon={<Cog6ToothIcon />}
                onClick={() => navigate(`/choirs/${choirId}/settings`)}
                className="settings-button"
              >
                Settings
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <UserGroupIcon />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.totalMembers}</span>
                <span className="stat-label">Total Members</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <ChartBarIcon />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.admins}</span>
                <span className="stat-label">Admins</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <DocumentTextIcon />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.pendingInvitations}</span>
                <span className="stat-label">Pending Invites</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <MusicalNoteIcon />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.songs}</span>
                <span className="stat-label">Choir Songs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Button
            variant="primary"
            leftIcon={<MusicalNoteIcon />}
            onClick={() => navigate('/master-songs')}
            className="action-button"
          >
            Master Songs
          </Button>
          <Button
            variant="outlined"
            leftIcon={<DocumentTextIcon />}
            onClick={() => navigate(`/choir/${choirId}/playlist-templates`)}
            className="action-button"
          >
            Templates
          </Button>
          <Button
            variant="outlined"
            leftIcon={<UserGroupIcon />}
            onClick={() => navigate(`/choir/${choirId}/playlists`)}
            className="action-button"
          >
            Playlists
          </Button>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          <div className="content-grid">
            {/* Left Column - Members Management */}
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Members</h2>
                <p className="section-subtitle">
                  Manage choir members and their roles
                </p>
              </div>
              
              <MembersListEnhanced
                members={choir.members}
                onRemoveMember={handleRemoveMember}
                onUpdateMemberRole={handleUpdateMemberRole}
              />
            </div>

            {/* Right Column - Invitations & Other */}
            <div className="content-section">
              <InviteMemberEnhanced
                onInviteMember={handleInviteMember}
                isLoading={inviteLoading}
              />
              
              {(pendingInvitations.length > 0 || sentInvitations.length > 0) && (
                <div className="section-spacer">
                  <div className="section-header">
                    <h3 className="section-title">Invitations</h3>
                    <p className="section-subtitle">
                      Manage choir invitations
                    </p>
                  </div>
                  <InvitationsAccordion 
                    pendingInvitations={pendingInvitations} 
                    sentInvitations={sentInvitations} 
                  />
                </div>
              )}

              <div className="section-spacer">
                <div className="section-header">
                  <h3 className="section-title">Choir Songs</h3>
                  <p className="section-subtitle">
                    Songs customized for your choir
                  </p>
                </div>
                <ChoirSongsList choirId={choir.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChoirAdminPageEnhanced;
