import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '../services/userService';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState<'admin' | 'general' | null>(null);

  const handleCompleteOnboarding = async (userType: 'admin' | 'general') => {
    try {
      await completeOnboarding(userType);

      if (userType === 'admin') {
        navigate('/create-choir');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/auth/error?message=Failed+to+complete+onboarding');
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-8">
            <div className="has-text-centered mb-6">
              <h1 className="title is-2">Welcome to ChoirApp! 🎵</h1>
              <p className="subtitle is-4">Let's get you started with your musical journey</p>
            </div>

            <div className="content mb-6">
              <h2 className="title is-4">Choose how you'd like to use ChoirApp:</h2>
            </div>

            <div className="columns">
              <div className="column">
                <div className={`card ${selectedUserType === 'admin' ? 'has-background-primary-light' : ''}`}>
                  <div className="card-content">
                    <div className="media">
                      <div className="media-left">
                        <figure className="image is-48x48">
                          <span className="icon is-large">
                            <i className="fas fa-users fa-2x"></i>
                          </span>
                        </figure>
                      </div>
                      <div className="media-content">
                        <p className="title is-4">Choir Administrator</p>
                        <p className="subtitle is-6">Lead and manage a choir</p>
                      </div>
                    </div>

                    <div className="content">
                      <p><strong>Perfect for:</strong></p>
                      <ul>
                        <li>Choir directors and music ministers</li>
                        <li>Those who want to create and manage choirs</li>
                        <li>Leaders who invite and organize choir members</li>
                      </ul>
                      
                      <p><strong>You'll be able to:</strong></p>
                      <ul>
                        <li>Create and manage your choir</li>
                        <li>Invite unlimited choir members</li>
                        <li>Create playlists and templates for services</li>
                        <li>Manage choir-specific song versions</li>
                      </ul>
                    </div>

                    <footer className="card-footer">
                      <button 
                        className={`card-footer-item button ${selectedUserType === 'admin' ? 'is-primary' : 'is-light'}`}
                        onClick={() => setSelectedUserType('admin')}
                      >
                        Select Administrator
                      </button>
                    </footer>
                  </div>
                </div>
              </div>

              <div className="column">
                <div className={`card ${selectedUserType === 'general' ? 'has-background-info-light' : ''}`}>
                  <div className="card-content">
                    <div className="media">
                      <div className="media-left">
                        <figure className="image is-48x48">
                          <span className="icon is-large">
                            <i className="fas fa-music fa-2x"></i>
                          </span>
                        </figure>
                      </div>
                      <div className="media-content">
                        <p className="title is-4">General User</p>
                        <p className="subtitle is-6">Explore and discover music</p>
                      </div>
                    </div>

                    <div className="content">
                      <p><strong>Perfect for:</strong></p>
                      <ul>
                        <li>Music enthusiasts and casual users</li>
                        <li>Those exploring before joining a choir</li>
                        <li>Anyone wanting access to the song database</li>
                      </ul>
                      
                      <p><strong>You'll be able to:</strong></p>
                      <ul>
                        <li>Browse the complete master song database</li>
                        <li>View public playlists from other choirs</li>
                        <li>Search and discover new music</li>
                        <li>Join choirs when invited by administrators</li>
                      </ul>
                    </div>

                    <footer className="card-footer">
                      <button 
                        className={`card-footer-item button ${selectedUserType === 'general' ? 'is-info' : 'is-light'}`}
                        onClick={() => setSelectedUserType('general')}
                      >
                        Select General User
                      </button>
                    </footer>
                  </div>
                </div>
              </div>
            </div>

            {selectedUserType && (
              <div className="has-text-centered mt-6">
                <button 
                  className={`button is-large ${selectedUserType === 'admin' ? 'is-primary' : 'is-info'}`}
                  onClick={() => handleCompleteOnboarding(selectedUserType)}
                >
                  {selectedUserType === 'admin' ? 'Create My Choir' : 'Start Exploring'}
                  <span className="icon">
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </button>
                <p className="help mt-2">
                  Don't worry - you can always change this later or be invited to join choirs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingPage;
