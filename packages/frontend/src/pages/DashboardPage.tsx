import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { getInvitations, acceptInvitation, rejectInvitation } from '../services/invitationService';
import { Invitation } from '../types/invitation';
import { UserRole } from '../constants/roles';
import InvitationsList from '../components/InvitationsList';
import { Card, Button, LoadingSpinner, Layout, Navigation } from '../components/ui';
import { 
  MusicalNoteIcon, 
  UserGroupIcon, 
  PlusIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import './DashboardPage.scss';

const DashboardPage: React.FC = () => {
  const { user, loading, token, refreshToken } = useUser();
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (user && token) {
      getInvitations(token).then(setInvitations);
    }
  }, [user, token]);

  const handleAccept = async (invitationToken: string) => {
    if (token) {
      await acceptInvitation(invitationToken, token);
      
      // After accepting an invitation, the user's role might change (e.g., becoming a choir admin)
      // Refresh the token to update the role claim
      await refreshToken();
      
      setInvitations(invitations.filter(i => i.invitationToken !== invitationToken));
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
      <Layout 
        navigation={<Navigation title="Dashboard" showBackButton={false} />}
      >
        <div className="dashboard-container">
          <div className="loading-section">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="dashboard-container">
          <Card className="welcome-card">
            <div className="welcome-content">
              <MusicalNoteIcon className="welcome-icon" />
              <h1 className="welcome-title">Welcome to ChoirApp!</h1>
              <p className="welcome-subtitle">Please log in to access your dashboard and manage your choirs.</p>
              <Link to="/">
                <Button variant="primary" size="lg">
                  Go to Homepage
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  const { name, email, choirs } = user;
  const adminOfChoirs = choirs.filter(c => c.role === UserRole.ChoirAdmin);
  const memberOfChoirs = choirs.filter(c => c.role === UserRole.ChoirMember);
  const totalChoirs = choirs.length;
  const pendingInvitations = invitations.length;

  // Progress calculation (example logic)
  const hasChoirs = totalChoirs > 0;
  const hasCompletedProfile = user.hasCompletedOnboarding;
  const progressSteps = [
    { label: t('dashboard.progressSteps.completeProfile'), completed: hasCompletedProfile },
    { label: t('dashboard.progressSteps.joinChoir'), completed: hasChoirs },
    { label: t('dashboard.progressSteps.addSongs'), completed: false }, // This would need real data
  ];
  const completedSteps = progressSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / progressSteps.length) * 100;

  return (
    <Layout 
      navigation={<Navigation title={t('dashboard.title')} showBackButton={false} />}
    >
      <div className="dashboard-container">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="user-welcome">
              <h1 className="dashboard-title">{t('dashboard.welcomeBack', { name })}</h1>
              <p className="dashboard-subtitle">{email}</p>
            </div>
            <div className="header-actions">
              <Link to="/create-choir">
                <Button 
                  variant="primary" 
                  className="create-action"
                >
                  <PlusIcon className="button-icon" />
                  {t('dashboard.createChoir')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon-wrapper primary">
              <UserGroupIcon className="stat-icon" />
            </div>
            <div className="stat-details">
              <h3 className="stat-number">{totalChoirs}</h3>
              <p className="stat-label">{t('dashboard.totalChoirs')}</p>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon-wrapper secondary">
              <MusicalNoteIcon className="stat-icon" />
            </div>
            <div className="stat-details">
              <h3 className="stat-number">{adminOfChoirs.length}</h3>
              <p className="stat-label">{t('dashboard.asAdmin')}</p>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon-wrapper accent">
              <ClockIcon className="stat-icon" />
            </div>
            <div className="stat-details">
              <h3 className="stat-number">{pendingInvitations}</h3>
              <p className="stat-label">{t('dashboard.pendingInvites')}</p>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon-wrapper success">
              <StarIcon className="stat-icon" />
            </div>
            <div className="stat-details">
              <h3 className="stat-number">{memberOfChoirs.length}</h3>
              <p className="stat-label">{t('dashboard.asMember')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      {progressPercentage < 100 && (
        <Card className="progress-card">
          <div className="progress-header">
            <h2 className="section-title">{t('dashboard.completeSetup')}</h2>
            <span className="progress-percentage">{t('dashboard.percentComplete', { percent: Math.round(progressPercentage) })}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            {progressSteps.map((step, index) => (
              <div key={index} className={`progress-step ${step.completed ? 'completed' : 'pending'}`}>
                {step.completed ? (
                  <CheckCircleIconSolid className="step-icon completed" />
                ) : (
                  <CheckCircleIcon className="step-icon pending" />
                )}
                <span className="step-label">{step.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="quick-actions-card">
        <h2 className="section-title">{t('dashboard.quickActionsTitle')}</h2>
        <div className="quick-actions-grid">
          <Link to="/songs">
            <Button 
              variant="outlined" 
              className="quick-action-button"
            >
              <MusicalNoteIcon className="action-icon" />
              <div className="action-content">
                <span className="action-title">{t('dashboard.browseSongs')}</span>
                <span className="action-subtitle">{t('dashboard.browseSongsDesc')}</span>
              </div>
            </Button>
          </Link>

          <Link to="/create-choir">
            <Button 
              variant="outlined" 
              className="quick-action-button"
            >
              <PlusIcon className="action-icon" />
              <div className="action-content">
                <span className="action-title">{t('dashboard.createChoir')}</span>
                <span className="action-subtitle">{t('dashboard.createPlaylistDesc')}</span>
              </div>
            </Button>
          </Link>

          <Link to="/songs/create">
            <Button 
              variant="outlined" 
              className="quick-action-button"
            >
              <MusicalNoteIcon className="action-icon" />
              <div className="action-content">
                <span className="action-title">{t('dashboard.addSong')}</span>
                <span className="action-subtitle">{t('dashboard.browseSongsDesc')}</span>
              </div>
            </Button>
          </Link>

          <Button 
            variant="outlined" 
            className="quick-action-button"
            disabled
          >
            <CogIcon className="action-icon" />
            <div className="action-content">
              <span className="action-title">Settings</span>
              <span className="action-subtitle">Manage preferences</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* Choirs Section */}
      <div className="choirs-section">
        {adminOfChoirs.length > 0 && (
          <Card className="choirs-card">
            <h2 className="section-title">Choirs You Manage</h2>
            <div className="choirs-grid">
              {adminOfChoirs.map(choir => (
                <Link 
                  key={choir.id} 
                  to={`/choir/${choir.id}/songs`} 
                  className="choir-card-link"
                >
                  <Card className="choir-card">
                    <div className="choir-content">
                      <div className="choir-icon-wrapper admin">
                        <UserGroupIcon className="choir-icon" />
                      </div>
                      <div className="choir-details">
                        <h3 className="choir-name">{choir.name}</h3>
                        <p className="choir-role">Administrator</p>
                      </div>
                      <div className="choir-arrow">
                        <ChartBarIcon className="arrow-icon" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {memberOfChoirs.length > 0 && (
          <Card className="choirs-card">
            <h2 className="section-title">Choirs You're In</h2>
            <div className="choirs-grid">
              {memberOfChoirs.map(choir => (
                <Link 
                  key={choir.id} 
                  to={`/choir/${choir.id}/songs`} 
                  className="choir-card-link"
                >
                  <Card className="choir-card">
                    <div className="choir-content">
                      <div className="choir-icon-wrapper member">
                        <MusicalNoteIcon className="choir-icon" />
                      </div>
                      <div className="choir-details">
                        <h3 className="choir-name">{choir.name}</h3>
                        <p className="choir-role">Member</p>
                      </div>
                      <div className="choir-arrow">
                        <ChartBarIcon className="arrow-icon" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {totalChoirs === 0 && (
          <Card className="empty-state-card">
            <div className="empty-state-content">
              <UserGroupIcon className="empty-state-icon" />
              <h3 className="empty-state-title">No Choirs Yet</h3>
              <p className="empty-state-subtitle">
                Create your first choir or wait for an invitation to get started.
              </p>
              <Link to="/create-choir">
                <Button 
                  variant="primary"
                  className="empty-state-action"
                >
                  <PlusIcon className="button-icon" />
                  Create Your First Choir
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Invitations Section */}
      {pendingInvitations > 0 && (
        <Card className="invitations-card">
          <h2 className="section-title">
            Pending Invitations 
            <span className="invitation-count">({pendingInvitations})</span>
          </h2>
          <InvitationsList 
            invitations={invitations} 
            onAccept={handleAccept} 
            onReject={handleReject} 
          />
        </Card>
      )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
