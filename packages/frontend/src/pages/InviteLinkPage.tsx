import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { 
  getShareableInvitationByToken, 
  acceptShareableInvitation,
  ShareableInvitation 
} from '../services/shareableInvitationService';
import { getChoirDetails } from '../services/choirService';
import { LoadingState } from '../components/ui';
import './InviteLinkPage.scss';

const InviteLinkPage: React.FC = () => {
  const { token: inviteToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, token: authToken, refetchUser } = useUser();
  const { t } = useTranslation();
  const [invitation, setInvitation] = useState<ShareableInvitation | null>(null);
  const [choirName, setChoirName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!inviteToken) {
        setError(t('invitation.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        console.log('🔵 Fetching invitation details for token:', inviteToken);
        
        // Store the invitation token in sessionStorage for later use
        sessionStorage.setItem('inviteToken', inviteToken);
        
        const invitationData = await getShareableInvitationByToken(inviteToken);
        setInvitation(invitationData);

        // Fetch choir details to get the choir name
        if (authToken) {
          try {
            const choirDetails = await getChoirDetails(invitationData.choirId, authToken);
            setChoirName(choirDetails.name);
          } catch (err) {
            console.warn('Could not fetch choir details:', err);
            setChoirName(t('common.choir', 'Coro'));
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch invitation details:', err);
        setError(err.message || t('invitation.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [inviteToken, authToken]);

  const handleSignUp = () => {
    console.log('🔵 handleSignUp called');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const oauthUrl = `${API_BASE_URL}/api/auth/signin-google?inviteToken=${encodeURIComponent(inviteToken || '')}`;
    console.log('🔵 Full OAuth URL:', oauthUrl);
    
    // Small delay to ensure sessionStorage is set
    setTimeout(() => {
      window.location.href = oauthUrl;
    }, 100);
  };

  const handleAcceptInvitation = async () => {
    if (!inviteToken || !authToken) return;

    try {
      setAccepting(true);
      setError(null);

      await acceptShareableInvitation({ invitationToken: inviteToken }, authToken);
      
      // Clear the stored invitation token
      sessionStorage.removeItem('inviteToken');
      
      // Refresh user data to show the new choir in dashboard
      await refetchUser();
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      if (err.message.includes('already a member')) {
        setError(t('invitation.alreadyMember'));
      } else if (err.message.includes('expired') || err.message.includes('deactivated')) {
        setError(t('invitation.expired'));
      } else {
        setError(err.message || t('invitation.acceptError'));
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectInvitation = () => {
    // Clear the stored invitation token
    sessionStorage.removeItem('inviteToken');
    
    // Redirect to dashboard
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingState message={t('invitation.loading')} variant="fullscreen" />;
  }

  if (error) {
    return (
      <section className="section invite-link-page">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-half">
              <div className="card error-card">
                <div className="card-content has-text-centered">
                  <div className="icon-container mb-4">
                    <i className="fas fa-exclamation-triangle has-text-danger" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h1 className="title is-4">{t('common.error')}</h1>
                  <p className="subtitle">{error}</p>
                  <button 
                    className="button is-primary"
                    onClick={() => navigate('/')}
                  >
                    {t('invitation.backToHome')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!invitation) {
    return (
      <section className="section invite-link-page">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-half">
              <div className="card">
                <div className="card-content has-text-centered">
                  <h1 className="title is-4">{t('invitation.notFound')}</h1>
                  <p className="subtitle">{t('invitation.notFoundMessage')}</p>
                  <button 
                    className="button is-primary"
                    onClick={() => navigate('/')}
                  >
                    {t('invitation.backToHome')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section invite-link-page">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="card invitation-card">
              <div className="card-content">
                <div className="has-text-centered mb-5">
                  <div className="icon-container mb-4">
                    <img 
                      src="/icons/icon-128x128.png" 
                      alt="ChoirApp" 
                      className="app-icon"
                    />
                  </div>
                  <h1 className="title is-3">{t('invitation.title')}</h1>
                  <p className="subtitle is-5">
                    {t('invitation.subtitle')} <strong>{choirName || t('common.choir', 'un coro')}</strong>
                  </p>
                </div>

                <div className="invitation-details mb-5">
                  <div className="field">
                    <div className="content">
                      <div className="choir-info mb-4">
                        <p className="choir-name">
                          <span className="icon-text">
                            <span className="icon">
                              <i className="fas fa-music"></i>
                            </span>
                            <span><strong>{choirName || 'Cargando...'}</strong></span>
                          </span>
                        </p>
                      </div>
                      
                      {invitation.expiryDate && (
                        <div className="expiry-info">
                          <p className="expiry-text">
                            <span className="icon-text">
                              <span className="icon">
                                <i className="fas fa-clock"></i>
                              </span>
                              <span>{t('invitation.linkExpiresOn')} {new Date(invitation.expiryDate).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {user ? (
                  // User is authenticated
                  <div className="has-text-centered">
                    <p className="mb-5 welcome-message">
                      {t('invitation.welcomeUser').replace('{name}', user.name || user.email?.split('@')[0] || 'there')}
                    </p>
                    <div className="buttons is-centered">
                      <button 
                        className={`button is-primary is-large ${accepting ? 'is-loading' : ''}`}
                        onClick={handleAcceptInvitation}
                        disabled={accepting}
                      >
                        <span className="icon">
                          <i className="fas fa-check"></i>
                        </span>
                        <span>{t('invitation.joinChoir')}</span>
                      </button>
                      <button 
                        className="button is-light is-large"
                        onClick={handleRejectInvitation}
                        disabled={accepting}
                      >
                        <span className="icon">
                          <i className="fas fa-times"></i>
                        </span>
                        <span>{t('invitation.noThanks')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // User is not authenticated
                  <div className="has-text-centered">
                    <p className="mb-4">
                      {t('invitation.signInToJoin')}
                    </p>
                    <button 
                      className="button is-primary is-large signup-button"
                      onClick={(e) => {
                        console.log('🟠 Button clicked! Event:', e);
                        console.log('🟠 Current inviteToken at click time:', inviteToken);
                        e.preventDefault();
                        handleSignUp();
                      }}
                      type="button"
                    >
                      <span className="icon">
                        <i className="fab fa-google"></i>
                      </span>
                      <span>{t('invitation.signInWithGoogle')}</span>
                    </button>
                    <p className="help mt-3">
                      {t('invitation.signInNote')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InviteLinkPage;
