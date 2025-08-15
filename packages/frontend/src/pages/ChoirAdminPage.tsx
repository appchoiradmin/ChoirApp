import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  getChoirDetails,
  inviteUser,
  removeMember,
  updateMemberRole,
  updateChoir,
  deleteChoir,
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
  const navigate = useNavigate();
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteChoir = async () => {
    if (!choirId || !token || !choir) return;

    try {
      setIsDeleting(true);
      await deleteChoir(choirId, token);
      
      // Close the confirmation modal
      setShowDeleteConfirmation(false);
      
      // Navigate back to dashboard after successful deletion
      navigate('/dashboard');
      
      // Show success message
      alert(t('choirAdmin.choirDeletedSuccessfully'));
      
      // Force refresh of user data to update choir list
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to delete choir:', error);
      const errorMessage = error.message || t('choirAdmin.failedToDeleteChoir');
      alert(errorMessage);
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
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

              {/* Danger Zone Section */}
              <section className="box mt-4" style={{ borderColor: '#ff3860', borderWidth: '2px' }}>
                <h2 className="title is-5 mb-3 has-text-danger">
                  <span className="icon"><i className="fas fa-exclamation-triangle"></i></span>
                  <span>{t('choirAdmin.dangerZone')}</span>
                </h2>
                <div className="content">
                  <p className="has-text-grey-dark mb-4">
                    {t('choirAdmin.deleteChoirWarning')}
                  </p>
                  <button
                    className="button is-danger is-fullwidth"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={isDeleting}
                  >
                    <span className="icon"><i className="fas fa-trash"></i></span>
                    <span>{t('choirAdmin.deleteChoir')}</span>
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowDeleteConfirmation(false)}></div>
            <div className="modal-card" style={{ 
              maxWidth: '520px',
              maxHeight: '90vh',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <header className="modal-card-head" style={{ 
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                border: 'none',
                padding: '1.5rem 2rem',
                flexShrink: 0
              }}>
                <div className="has-text-centered" style={{ width: '100%' }}>
                  <div className="mb-3">
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="has-text-white" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>⚠</span>
                    </div>
                  </div>
                  <p className="modal-card-title has-text-white is-size-5 has-text-weight-bold" style={{ border: 'none', margin: 0 }}>
                    {t('choirAdmin.confirmDeleteChoir')}
                  </p>
                </div>
                <button 
                  className="delete is-large" 
                  aria-label="close"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                ></button>
              </header>
              <section className="modal-card-body" style={{ 
                padding: '1.5rem 2rem', 
                overflowY: 'auto',
                flex: 1
              }}>
                <div className="has-text-centered mb-4">
                  <p className="is-size-6 has-text-weight-semibold has-text-grey-darker">
                    {t('choirAdmin.deleteChoirConfirmMessage', { choirName: choir?.name })}
                  </p>
                </div>
                
                <div className="box" style={{ 
                  background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                  border: '1px solid #f39c12',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  marginBottom: '1rem'
                }}>
                  <div className="has-text-centered mb-3">
                    <div style={{
                      backgroundColor: 'rgba(243, 156, 18, 0.1)',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="has-text-warning" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>!</span>
                    </div>
                  </div>
                  <p className="has-text-weight-bold is-size-6 has-text-centered mb-3 has-text-warning-dark">
                    {t('choirAdmin.deleteChoirWarningTitle')}
                  </p>
                  <div className="content">
                    <div className="media mb-2">
                      <div className="media-left">
                        <span className="icon is-small has-text-warning">
                          <i className="fas fa-list"></i>
                        </span>
                      </div>
                      <div className="media-content">
                        <p className="has-text-warning-dark is-size-7">{t('choirAdmin.deleteChoirWarning1')}</p>
                      </div>
                    </div>
                    <div className="media mb-2">
                      <div className="media-left">
                        <span className="icon is-small has-text-warning">
                          <i className="fas fa-users"></i>
                        </span>
                      </div>
                      <div className="media-content">
                        <p className="has-text-warning-dark is-size-7">{t('choirAdmin.deleteChoirWarning2')}</p>
                      </div>
                    </div>
                    <div className="media mb-2">
                      <div className="media-left">
                        <span className="icon is-small has-text-warning">
                          <i className="fas fa-music"></i>
                        </span>
                      </div>
                      <div className="media-content">
                        <p className="has-text-warning-dark is-size-7">{t('choirAdmin.deleteChoirWarning3')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="has-text-centered">
                  <div className="media is-align-items-center" style={{ justifyContent: 'center' }}>
                    <div className="media-left">
                      <span className="icon is-small has-text-danger">
                        <i className="fas fa-ban"></i>
                      </span>
                    </div>
                    <div className="media-content">
                      <p className="has-text-grey-dark is-size-7 has-text-weight-medium">
                        {t('choirAdmin.deleteChoirFinalWarning')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              <footer className="modal-card-foot" style={{ 
                padding: '1rem 2rem',
                background: '#fafafa',
                justifyContent: 'space-between',
                flexShrink: 0,
                borderTop: '1px solid #dbdbdb'
              }}>
                <button
                  className="button is-light is-medium"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  style={{ 
                    borderRadius: '8px',
                    minWidth: '120px',
                    fontWeight: '600'
                  }}
                >
                  <span className="icon">
                    <i className="fas fa-times"></i>
                  </span>
                  <span>{t('choirAdmin.cancel')}</span>
                </button>
                <button
                  className={`button is-danger is-medium ${isDeleting ? 'is-loading' : ''}`}
                  onClick={handleDeleteChoir}
                  disabled={isDeleting}
                  style={{ 
                    borderRadius: '8px',
                    minWidth: '160px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                    border: 'none'
                  }}
                >
                  <span className="icon">
                    <i className="fas fa-trash"></i>
                  </span>
                  <span>{t('choirAdmin.deleteChoirConfirm')}</span>
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChoirAdminPage;
