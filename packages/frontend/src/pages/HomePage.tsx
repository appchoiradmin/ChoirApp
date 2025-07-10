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
import './HomePage.scss';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const HomePage: React.FC = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="hero-accent">ChoirApp</span>
            </h1>
            <p className="hero-subtitle">
              Your comprehensive digital platform for choir management, 
              song organization, and seamless musical collaboration.
            </p>
            <div className="hero-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
                className="hero-cta-primary"
              >
                <MusicalNoteIcon className="button-icon" />
                Get Started with Google
              </Button>
              <Button
                variant="outlined"
                size="lg"
                className="hero-cta-secondary"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-card card-1">
                <div className="card-content">
                  <UserGroupIcon className="card-icon" />
                  <h3 className="card-title">Manage Choirs</h3>
                </div>
              </div>
              <div className="hero-card card-2">
                <div className="card-content">
                  <MusicalNoteIcon className="card-icon" />
                  <h3 className="card-title">Song Library</h3>
                </div>
              </div>
              <div className="hero-card card-3">
                <div className="card-content">
                  <QueueListIcon className="card-icon" />
                  <h3 className="card-title">Smart Playlists</h3>
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
            <h2 className="features-title">Why Choose ChoirApp?</h2>
            <p className="features-subtitle">
              Everything you need to manage your choir in one beautiful platform
            </p>
          </div>
          
          <div className="features-grid">
            <Card className="feature-card">
              <div className="feature-content">
                <div className="feature-icon-wrapper primary">
                  <UserGroupIcon className="feature-icon" />
                </div>
                <h3 className="feature-title">Choir Management</h3>
                <p className="feature-description">
                  Easily manage your choir members, roles, and permissions. 
                  Send invitations and organize your musical community.
                </p>
                <div className="feature-benefits">
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>Member invitations</span>
                  </div>
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>Role management</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-content">
                <div className="feature-icon-wrapper secondary">
                  <MusicalNoteIcon className="feature-icon" />
                </div>
                <h3 className="feature-title">Song Library</h3>
                <p className="feature-description">
                  Comprehensive song database with ChordPro support. 
                  Create choir-specific versions and manage your repertoire.
                </p>
                <div className="feature-benefits">
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>ChordPro support</span>
                  </div>
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>Custom arrangements</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-content">
                <div className="feature-icon-wrapper accent">
                  <QueueListIcon className="feature-icon" />
                </div>
                <h3 className="feature-title">Smart Playlists</h3>
                <p className="feature-description">
                  Create dynamic playlists for services and events. 
                  Use templates and organize songs by sections.
                </p>
                <div className="feature-benefits">
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>Template system</span>
                  </div>
                  <div className="benefit-item">
                    <CheckCircleIcon className="benefit-icon" />
                    <span>Event scheduling</span>
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
              <div className="stat-label">Active Choirs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Songs Managed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Choir Members</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
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
                  "ChoirApp has revolutionized how we manage our choir. The song library and playlist features are incredible!"
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <MusicalNoteIcon className="avatar-icon" />
                  </div>
                  <div className="author-info">
                    <div className="author-name">Sarah Johnson</div>
                    <div className="author-role">Choir Director</div>
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
          <h2 className="cta-title">Ready to Transform Your Choir?</h2>
          <p className="cta-subtitle">
            Join thousands of choir directors already using ChoirApp to manage their musical communities
          </p>
          
          <div className="cta-features">
            <div className="cta-feature">
              <ShieldCheckIcon className="cta-feature-icon" />
              <span>Secure & Reliable</span>
            </div>
            <div className="cta-feature">
              <ClockIcon className="cta-feature-icon" />
              <span>Quick Setup</span>
            </div>
            <div className="cta-feature">
              <DevicePhoneMobileIcon className="cta-feature-icon" />
              <span>Mobile Friendly</span>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="xl"
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
            className="cta-button"
          >
            <MusicalNoteIcon className="button-icon" />
            Start Your Musical Journey
          </Button>
          
          <p className="cta-note">
            Free to get started • No credit card required
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
