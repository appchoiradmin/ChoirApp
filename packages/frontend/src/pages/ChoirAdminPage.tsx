import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getChoirDetails,
  inviteUser,
  removeMember,
  updateMemberRole,
  updateChoir,
} from '../services/choirService';
import { getInvitationsByChoir } from '../services/invitationService';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { LoadingState } from '../components/ui';
import { ChoirDetails, ChoirRole } from '../types/choir';
import { Invitation } from '../types/invitation';
import MembersList from '../components/admin/MembersList';
import InviteMember from '../components/admin/InviteMember';
import InvitationsAccordion from '../components/admin/InvitationsAccordion';
import ShareableInvitationManager from '../components/admin/ShareableInvitationManager';
import { UserRole } from '../constants/roles';

const ChoirAdminPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();
  const { token, setChoirId, user } = useUser();
  const { t } = useTranslation();
  const [choir, setChoir] = useState<ChoirDetails | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const pendingInvitations = invitations.filter(inv => inv.status === 'Pending');
  const sentInvitations = invitations.filter(inv => inv.status !== 'Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedChoirName, setEditedChoirName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const fetchChoirDetails = useCallback(async () => {
    if (choirId && token && user) {
      try {
        setLoading(true);
        const details = await getChoirDetails(choirId, token);
        
        // Check if the current user is an admin of this choir
        const currentUserMembership = details.members.find(member => member.id === user.id);
        const userIsAdmin = currentUserMembership?.role === UserRole.ChoirAdmin;
        console.log('🔍 DEBUG - User admin status:', {
          userId: user.id,
          currentUserMembership,
          userIsAdmin,
          choirMembers: details.members
        });
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
        setError(t('choirAdmin.failedToFetchChoirDetails'));
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
        alert(t('choirAdmin.invitationSentSuccessfully'));
        fetchChoirDetails(); // Refresh the list
      } catch (error) {
        console.error('Failed to invite member:', error);
        alert(t('choirAdmin.failedToInviteMember'));
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (choirId && token) {
      if (window.confirm(t('choirAdmin.removeMemberConfirmation'))) {
        try {
          await removeMember(choirId, userId, token);
          fetchChoirDetails(); // Refresh the list
        } catch (error) {
          console.error('Failed to remove member:', error);
          alert(t('choirAdmin.failedToRemoveMember'));
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
        alert(t('choirAdmin.failedToUpdateMemberRole'));
      }
    }
  };

  const handleEditChoirName = () => {
    if (choir) {
      setEditedChoirName(choir.name);
      setIsEditingName(true);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedChoirName('');
  };

  const handleSaveChoirName = async () => {
    if (!choirId || !token || !editedChoirName.trim()) {
      return;
    }

    if (editedChoirName.trim().length > 100) {
      alert(t('choirAdmin.choirNameTooLong'));
      return;
    }

    try {
      setIsUpdatingName(true);
      await updateChoir(choirId, editedChoirName.trim(), token);
      setIsEditingName(false);
      setEditedChoirName('');
      fetchChoirDetails(); // Refresh to get updated choir name
      alert(t('choirAdmin.choirNameUpdated'));
    } catch (error: any) {
      console.error('Failed to update choir name:', error);
      const errorMessage = error.message || t('choirAdmin.failedToUpdateChoirName');
      if (errorMessage.includes('already exists')) {
        alert(t('choirAdmin.choirNameExists'));
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsUpdatingName(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('choirAdmin.loadingChoirAdmin')} variant="fullscreen" />;
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
          <p>{t('choirAdmin.choirNotFound')}</p>
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
              {isEditingName && isAdmin ? (
                <div className="box" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', padding: '1.5rem', marginBottom: '1rem' }}>
                  <div className="field">
                    <label className="label is-size-6 has-text-weight-semibold">{t('choirAdmin.choirName')}</label>
                    <div className="control">
                      <input
                        className="input is-medium"
                        type="text"
                        value={editedChoirName}
                        onChange={(e) => setEditedChoirName(e.target.value)}
                        placeholder={t('choirAdmin.choirNamePlaceholder')}
                        maxLength={100}
                        disabled={isUpdatingName}
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveChoirName();
                          } else if (e.key === 'Escape') {
                            handleCancelEditName();
                          }
                        }}
                        style={{ fontSize: '1.1rem' }}
                      />
                    </div>
                    <p className="help is-size-7 has-text-grey">
                      {editedChoirName.length}/100 caracteres
                    </p>
                  </div>
                  <div className="field is-grouped is-grouped-right" style={{ marginTop: '1rem', marginBottom: '0' }}>
                    <div className="control">
                      <button
                        className="button is-light"
                        onClick={handleCancelEditName}
                        disabled={isUpdatingName}
                        style={{ 
                          display: 'flex !important', 
                          alignItems: 'center !important', 
                          justifyContent: 'center !important',
                          textAlign: 'center',
                          minWidth: '120px',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        <i className="fas fa-times" style={{ marginRight: '0.5rem' }}></i>
                        <span>{t('choirAdmin.cancelEdit')}</span>
                      </button>
                    </div>
                    <div className="control">
                      <button
                        className={`button is-primary ${isUpdatingName ? 'is-loading' : ''}`}
                        onClick={handleSaveChoirName}
                        disabled={!editedChoirName.trim() || isUpdatingName}
                        style={{ 
                          display: 'flex !important', 
                          alignItems: 'center !important', 
                          justifyContent: 'center !important',
                          textAlign: 'center',
                          minWidth: '160px',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>
                        <span>{t('choirAdmin.saveChoirName')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="is-flex is-align-items-center is-justify-content-space-between mb-1">
                  <h1 className="title is-3 mb-0">{choir.name}</h1>
                  {isAdmin && (
                    <button
                      className="button is-small is-outlined is-primary"
                      onClick={handleEditChoirName}
                      title={t('choirAdmin.editChoirName')}
                      style={{
                        marginLeft: '1rem',
                        fontWeight: '500',
                        display: 'flex !important',
                        alignItems: 'center !important',
                        justifyContent: 'center !important',
                        gap: '0.25rem',
                        textAlign: 'center',
                        width: 'auto',
                        padding: '0.375rem 0.75rem'
                      }}
                    >
                      <i className="fas fa-edit" style={{ marginRight: '0.25rem' }}></i>
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              )}
              {isAdmin ? (
                <>
                  <p className="subtitle is-5 has-text-weight-semibold mb-4">{t('choirAdmin.adminPanel')}</p>
                  <p className="mb-5">{t('choirAdmin.manageDescription')}</p>
                </>
              ) : (
                <p className="subtitle is-5 has-text-weight-semibold mb-4">{t('choirAdmin.choirDetails')}</p>
              )}
            </div>
          </div>
          <div className="level-right"></div>
        </div>
        <hr />
        <div className="columns is-multiline">
          <div className="column is-12-mobile is-7-tablet">
            <section className="box mb-4">
              <h2 className="title is-5 mb-3">{t('choirAdmin.choirMembers')}</h2>
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
                <h2 className="title is-5 mb-3">{t('choirAdmin.invitations')}</h2>
                <InvitationsAccordion 
                  pendingInvitations={pendingInvitations} 
                  sentInvitations={sentInvitations} 
                />
                <hr className="my-5" />
                <ShareableInvitationManager choirId={choirId!} />
              </section>
            )}
          </div>
          {isAdmin && (
            <div className="column is-12-mobile is-5-tablet">
              <section className="box">
                <h2 className="title is-5 mb-3">{t('choirAdmin.playlistTemplates')}</h2>
                <Link to={`/choir/${choirId}/playlist-templates`} className="button is-info is-fullwidth">
                  <span className="icon"><i className="fas fa-list-alt"></i></span>
                  <span>{t('choirAdmin.managePlaylistTemplates')}</span>
                </Link>
                <p className="help mt-2">{t('choirAdmin.playlistTemplatesDescription')}</p>
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ChoirAdminPage;
