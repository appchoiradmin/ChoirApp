import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { getInvitations, acceptInvitation, rejectInvitation } from '../services/invitationService';
import { getMySongs } from '../services/songService';
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
  const [userSongsCount, setUserSongsCount] = useState<number>(0);
  
  // Refs for smooth scrolling
  const choirsSectionRef = React.useRef<HTMLDivElement>(null);
  const adminChoirsRef = React.useRef<HTMLDivElement>(null);
  const memberChoirsRef = React.useRef<HTMLDivElement>(null);
  const invitationsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && token) {
      getInvitations(token).then(setInvitations);
      getMySongs(token).then(songs => setUserSongsCount(songs.length));
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
            <p className="loading-text">{t('dashboard.loading')}</p>
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
              <h1 className="welcome-title">{t('dashboard.welcomeTitle')}</h1>
              <p className="welcome-subtitle">{t('dashboard.welcomeSubtitle')}</p>
              <Link to="/">
                <Button variant="primary" size="lg">
                  {t('dashboard.goToHomepage')}
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

  // Progress calculation
  const hasChoirs = totalChoirs > 0;
  const hasCompletedProfile = user.hasCompletedOnboarding;
  const hasSongs = userSongsCount > 0;
  const progressSteps = [
    { label: t('dashboard.progressSteps.completeProfile'), completed: hasCompletedProfile },
    { label: t('dashboard.progressSteps.joinChoir'), completed: hasChoirs },
    { label: t('dashboard.progressSteps.addSongs'), completed: hasSongs },
  ];
  const completedSteps = progressSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / progressSteps.length) * 100;

  // Smooth scroll helper function
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest'
    });
  };

  // Click handlers for stat cards
  const handleTotalChoirsClick = () => {
    scrollToSection(choirsSectionRef);
  };

  const handleAdminChoirsClick = () => {
    if (adminOfChoirs.length > 0) {
      scrollToSection(adminChoirsRef);
    } else {
      scrollToSection(choirsSectionRef);
    }
  };

  const handleMemberChoirsClick = () => {
    if (memberOfChoirs.length > 0) {
      scrollToSection(memberChoirsRef);
    } else {
      scrollToSection(choirsSectionRef);
    }
  };

  const handlePendingInvitesClick = () => {
    if (pendingInvitations > 0) {
      scrollToSection(invitationsRef);
    }
  };

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
        <Card 
          className="stat-card clickable" 
          onClick={handleTotalChoirsClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleTotalChoirsClick()}
          aria-label={t('dashboard.totalChoirs') + ' - ' + t('dashboard.clickToViewChoirs')}
        >
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

        <Card 
          className="stat-card clickable" 
          onClick={handleAdminChoirsClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAdminChoirsClick()}
          aria-label={t('dashboard.asAdmin') + ' - ' + t('dashboard.clickToViewAdminChoirs')}
        >
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

        <Card 
          className={`stat-card ${pendingInvitations > 0 ? 'clickable' : ''}`}
          onClick={pendingInvitations > 0 ? handlePendingInvitesClick : undefined}
          role={pendingInvitations > 0 ? "button" : undefined}
          tabIndex={pendingInvitations > 0 ? 0 : undefined}
          onKeyDown={pendingInvitations > 0 ? (e: React.KeyboardEvent) => e.key === 'Enter' && handlePendingInvitesClick() : undefined}
          aria-label={pendingInvitations > 0 ? t('dashboard.pendingInvites') + ' - ' + t('dashboard.clickToViewInvitations') : t('dashboard.pendingInvites')}
        >
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

        <Card 
          className="stat-card clickable" 
          onClick={handleMemberChoirsClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleMemberChoirsClick()}
          aria-label={t('dashboard.asMember') + ' - ' + t('dashboard.clickToViewMemberChoirs')}
        >
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

          <Link to="/settings">
            <Button 
              variant="outlined" 
              className="quick-action-button"
            >
              <CogIcon className="action-icon" />
              <div className="action-content">
                <span className="action-title">{t('dashboard.settings')}</span>
                <span className="action-subtitle">{t('dashboard.settingsDesc')}</span>
              </div>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Choirs Section */}
      <div className="choirs-section" ref={choirsSectionRef}>
        {adminOfChoirs.length > 0 && (
          <Card className="choirs-card" ref={adminChoirsRef}>
            <h2 className="section-title">{t('dashboard.choirsYouManage')}</h2>
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
                        <p className="choir-role">{t('dashboard.administrator')}</p>
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
          <Card className="choirs-card" ref={memberChoirsRef}>
            <h2 className="section-title">{t('dashboard.choirsYouAreIn')}</h2>
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
                        <p className="choir-role">{t('dashboard.member')}</p>
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
              <h3 className="empty-state-title">{t('dashboard.noChoirsYet')}</h3>
              <p className="empty-state-subtitle">
                {t('dashboard.noChoirsDescription')}
              </p>
              <Link to="/create-choir">
                <Button 
                  variant="primary"
                  className="empty-state-action"
                >
                  <PlusIcon className="button-icon" />
                  {t('dashboard.createFirstChoir')}
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Invitations Section */}
      {pendingInvitations > 0 && (
        <Card className="invitations-card" ref={invitationsRef}>
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
