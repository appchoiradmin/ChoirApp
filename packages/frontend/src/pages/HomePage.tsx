import React from 'react';
import { Button, Card } from '../components/ui';
import { 
  MusicalNoteIcon, 
  UserGroupIcon, 
  QueueListIcon,
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import './HomePage.scss';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              {t('home.title').split('AppChoir')[0]}<span className="hero-accent">AppChoir</span>
            </h1>
            <p className="hero-subtitle">
              {t('home.subtitle')}
            </p>
            <div className="hero-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
                className="hero-cta-primary"
              >
                <MusicalNoteIcon className="button-icon" />
                {t('home.getStarted')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  const featuresSection = document.querySelector('.features-section');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="hero-cta-secondary"
              >
                {t('home.learnMore')}
              </Button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-card card-1">
                <div className="card-content">
                  <UserGroupIcon className="card-icon" />
                  <h3 className="card-title">{t('home.heroCards.manageChoirs')}</h3>
                </div>
              </div>
              <div className="hero-card card-2">
                <div className="card-content">
                  <MusicalNoteIcon className="card-icon" />
                  <h3 className="card-title">{t('home.heroCards.songLibrary')}</h3>
                </div>
              </div>
              <div className="hero-card card-3">
                <div className="card-content">
                  <QueueListIcon className="card-icon" />
                  <h3 className="card-title">{t('home.heroCards.smartPlaylists')}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-content">
          <div className="features-header">
            <h2 className="features-title">{t('home.features.title')}</h2>
            <p className="features-subtitle">
              {t('home.features.subtitle')}
            </p>
          </div>
          
          <div className="features-grid">
            <Card className="feature-card">
              <div className="feature-content">
                <div className="feature-icon-wrapper primary">
                  <UserGroupIcon className="feature-icon" />
                </div>
                <h3 className="feature-title">{t('home.features.choirManagement.title')}</h3>
                <p className="feature-description">
                  {t('home.features.choirManagement.description')}
                </p>
                <div className="feature-benefits">
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>{t('home.features.choirManagement.benefits.memberInvitations')}</span>
                  </div>
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>{t('home.features.choirManagement.benefits.roleManagement')}</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-content">
                <div className="feature-icon-wrapper secondary">
                  <MusicalNoteIcon className="feature-icon" />
                </div>
                <h3 className="feature-title">{t('home.features.songLibrary.title')}</h3>
                <p className="feature-description">
                  {t('home.features.songLibrary.description')}
                </p>
                <div className="feature-benefits">
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>{t('home.features.songLibrary.benefits.chordproSupport')}</span>
                  </div>
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>{t('home.features.songLibrary.benefits.customArrangements')}</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-content">
                <div className="feature-icon-wrapper accent">
                  <QueueListIcon className="feature-icon" />
                </div>
                <h3 className="feature-title">{t('home.features.smartPlaylists.title')}</h3>
                <p className="feature-description">
                  {t('home.features.smartPlaylists.description')}
                </p>
                <div className="feature-benefits">
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>{t('home.features.smartPlaylists.benefits.templateSystem')}</span>
                  </div>
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>{t('home.features.smartPlaylists.benefits.eventScheduling')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof-section">
        <div className="social-proof-content">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">{t('home.stats.activeChoirs')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">{t('home.stats.songsManaged')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">{t('home.stats.choirMembers')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">{t('home.stats.uptime')}</div>
            </div>
          </div>
          
          <div className="testimonials">
            <Card className="testimonial">
              <div className="testimonial-content">
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="star-icon" />
                  ))}
                </div>
                <p className="testimonial-text">
                  "{t('home.testimonial.text')}"
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <MusicalNoteIcon className="avatar-icon" />
                  </div>
                  <div className="author-info">
                    <div className="author-name">{t('home.testimonial.authorName')}</div>
                    <div className="author-role">{t('home.testimonial.authorRole')}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">{t('home.cta.title')}</h2>
          <p className="cta-subtitle">
            {t('home.cta.subtitle')}
          </p>
          
          <div className="cta-features">
            <div className="cta-feature">
              <ShieldCheckIcon className="cta-feature-icon" />
              <span>{t('home.cta.features.secure')}</span>
            </div>
            <div className="cta-feature">
              <ClockIcon className="cta-feature-icon" />
              <span>{t('home.cta.features.quickSetup')}</span>
            </div>
            <div className="cta-feature">
              <DevicePhoneMobileIcon className="cta-feature-icon" />
              <span>{t('home.cta.features.mobileFriendly')}</span>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="xl"
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
            className="cta-button"
          >
            <MusicalNoteIcon className="button-icon" />
            {t('home.cta.button')}
          </Button>
          
          <p className="cta-note">
            {t('home.cta.note')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
