import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { getShareableInviteInfo, acceptShareableInvite, ShareableInviteInfo } from '../services/shareableInviteService';
import { Layout, LoadingState, Button, Card } from '../components/ui';
import { CheckCircleIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import './InviteLinkPage.scss';

const InviteLinkPage: React.FC = () => {
  const { token: inviteToken } = useParams<{ token: string }>();
  const { user, token: authToken } = useUser();
  const navigate = useNavigate();
  
  const [inviteInfo, setInviteInfo] = useState<ShareableInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);



  useEffect(() => {
    if (!inviteToken) {
      setLoading(false);
      return;
    }

    const fetchInviteInfo = async () => {
      try {
        const info = await getShareableInviteInfo(inviteToken);
        
        if (info.isValid && !info.isExpired) {
          setInviteInfo(info);
        } else {
          setError(info.errorMessage || 'Invalid or expired invitation');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load invitation details');
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [inviteToken]);

  const handleAcceptInvitation = async () => {
    if (!inviteToken || !authToken) return;

    setAccepting(true);
    setError(null);

    try {
      await acceptShareableInvite(inviteToken, authToken);
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleSignUp = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const oauthUrl = `${API_BASE_URL}/api/auth/signin-google?inviteToken=${encodeURIComponent(inviteToken || '')}`;
    window.location.href = oauthUrl;
  };

  if (loading) {
    return (
      <Layout>
        <div className="invite-link-container">
          <LoadingState message="Loading invitation details..." />
        </div>
      </Layout>
    );
  }

  if (error && !inviteInfo) {
    return (
      <Layout>
        <div className="invite-link-container">
          <Card className="invite-card error-card">
            <div className="card-content">
              <div className="error-content">
                <ExclamationTriangleIcon className="error-icon" />
                <h1 className="error-title">Invalid Invitation</h1>
                <p className="error-message">{error}</p>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="primary"
                  className="mt-4"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="invite-link-container">
          <Card className="invite-card success-card">
            <div className="card-content">
              <div className="success-content">
                <CheckCircleIcon className="success-icon" />
                <h1 className="success-title">Welcome to {inviteInfo?.choirName}!</h1>
                <p className="success-message">
                  You have successfully joined the choir. Redirecting to your dashboard...
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!inviteInfo?.isValid || inviteInfo.isExpired) {
    return (
      <Layout>
        <div className="invite-link-container">
          <Card className="invite-card error-card">
            <div className="card-content">
              <div className="error-content">
                <ExclamationTriangleIcon className="error-icon" />
                <h1 className="error-title">
                  {inviteInfo?.isExpired ? 'Invitation Expired' : 'Invalid Invitation'}
                </h1>
                <p className="error-message">
                  {inviteInfo?.isExpired 
                    ? 'This invitation link has expired. Please ask the choir admin for a new invitation.'
                    : 'This invitation link is not valid or has already been used.'
                  }
                </p>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="primary"
                  className="mt-4"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="invite-link-container">
        <Card className="invite-card">
          <div className="card-header">
            <div className="header-content">
              <UserGroupIcon className="choir-icon" />
              <div className="header-text">
                <h1 className="choir-name">{inviteInfo.choirName}</h1>
                <p className="invite-subtitle">You've been invited to join this choir</p>
              </div>
            </div>
          </div>
          
          <div className="card-content">
            <div className="invite-info">
              <p className="invite-description">
                Join <strong>{inviteInfo.choirName}</strong> to collaborate on songs, 
                create playlists, and participate in choir activities.
              </p>
              
              <div className="expiry-notice">
                <p className="expiry-text">
                  This invitation link expires after 24 hours for security
                </p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <ExclamationTriangleIcon className="error-icon-small" />
                <span>{error}</span>
              </div>
            )}

            <div className="action-buttons">
              {(() => {
                console.log('🟠 Rendering action buttons. User:', user ? 'authenticated' : 'not authenticated');
                console.log('🟠 InviteToken available:', inviteToken);
                console.log('🟠 Will show sign-in button:', !user);
                return null;
              })()}
              {user ? (
                <Button
                  onClick={handleAcceptInvitation}
                  variant="primary"
                  size="lg"
                  disabled={accepting}
                  className="accept-button"
                >
                  {accepting ? 'Joining Choir...' : 'Accept Invitation'}
                </Button>
              ) : (
                <div className="auth-actions">
                  <p className="auth-message">
                    You need to sign in to accept this invitation
                  </p>
                  <button
                    onClick={handleSignUp}
                    className="button is-primary is-large signup-button"
                    type="button"
                    style={{
                      width: '100%',
                      marginTop: '1rem',
                      fontSize: '1.2rem',
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      backgroundColor: '#3273dc',
                      color: 'white',
                      border: 'none',
                      pointerEvents: 'auto'
                    }}
                  >
                    Sign In with Google
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default InviteLinkPage;
