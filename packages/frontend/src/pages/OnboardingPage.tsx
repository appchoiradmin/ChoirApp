import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserGroupIcon, MusicalNoteIcon, ArrowRightIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { completeOnboarding } from '../services/userService';
import { Button, Card, Layout } from '../components/ui';
import './OnboardingPage.scss';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState<'admin' | 'general' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteOnboarding = async (userType: 'admin' | 'general') => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="onboarding-container">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-10-desktop is-12-tablet">
              
              {/* Welcome Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="welcome-section"
              >
                <SparklesIcon className="welcome-icon" />
                <h1 className="title is-1-desktop is-2-tablet is-3-mobile welcome-title">
                  Welcome to ChoirApp! 🎵
                </h1>
                <p className="subtitle is-3-desktop is-4-tablet is-5-mobile welcome-subtitle">
                  Let's get you started with your musical journey
                </p>
              </motion.div>

              {/* Instructions */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="has-text-centered mb-6"
              >
                <Card className="instructions-card mb-5">
                  <h2 className="title is-4 has-text-primary mb-3">Choose how you'd like to use ChoirApp:</h2>
                  <p className="subtitle is-6 has-text-grey">
                    Don't worry - you can always change this later or be invited to join choirs.
                  </p>
                </Card>
              </motion.div>

              {/* User Type Selection */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="columns is-multiline"
              >
                
                {/* Administrator Option */}
                <div className="column is-6-desktop is-12-tablet">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card 
                      className={`user-type-card h-100 ${
                        selectedUserType === 'admin' ? 'selected-admin' : ''
                      }`}
                      onClick={() => setSelectedUserType('admin')}
                    >
                      <div className="media mb-4">
                        <div className="media-left">
                          <UserGroupIcon 
                            className={`user-type-icon ${
                              selectedUserType === 'admin' ? 'has-text-primary' : 'has-text-grey'
                            }`}
                          />
                        </div>
                        <div className="media-content">
                          <p className="title is-4">Choir Administrator</p>
                          <p className="subtitle is-6 has-text-grey">Lead and manage a choir</p>
                          {selectedUserType === 'admin' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                              className="has-text-primary"
                            >
                              <CheckIcon className="icon is-size-5" style={{ width: '1.5rem', height: '1.5rem' }} />
                              <span className="ml-2 has-text-weight-semibold">Selected</span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="content">
                        <div className="mb-4">
                          <p className="has-text-weight-semibold mb-2">Perfect for:</p>
                          <ul className="is-size-7">
                            <li>Choir directors and music ministers</li>
                            <li>Those who want to create and manage choirs</li>
                            <li>Leaders who invite and organize choir members</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="has-text-weight-semibold mb-2">You'll be able to:</p>
                          <ul className="is-size-7">
                            <li>Create and manage your choir</li>
                            <li>Invite unlimited choir members</li>
                            <li>Create playlists and templates for services</li>
                            <li>Manage choir-specific song versions</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* General User Option */}
                <div className="column is-6-desktop is-12-tablet">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card 
                      className={`user-type-card h-100 ${
                        selectedUserType === 'general' ? 'selected-general' : ''
                      }`}
                      onClick={() => setSelectedUserType('general')}
                    >
                      <div className="media mb-4">
                        <div className="media-left">
                          <MusicalNoteIcon 
                            className={`user-type-icon ${
                              selectedUserType === 'general' ? 'has-text-secondary' : 'has-text-grey'
                            }`}
                          />
                        </div>
                        <div className="media-content">
                          <p className="title is-4">General User</p>
                          <p className="subtitle is-6 has-text-grey">Explore and discover music</p>
                          {selectedUserType === 'general' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                              className="has-text-secondary"
                            >
                              <CheckIcon className="icon is-size-5" style={{ width: '1.5rem', height: '1.5rem' }} />
                              <span className="ml-2 has-text-weight-semibold">Selected</span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="content">
                        <div className="mb-4">
                          <p className="has-text-weight-semibold mb-2">Perfect for:</p>
                          <ul className="is-size-7">
                            <li>Music enthusiasts and casual users</li>
                            <li>Those exploring before joining a choir</li>
                            <li>Anyone wanting access to the song database</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="has-text-weight-semibold mb-2">You'll be able to:</p>
                          <ul className="is-size-7">
                            <li>Browse the complete master song database</li>
                            <li>View public playlists from other choirs</li>
                            <li>Search and discover new music</li>
                            <li>Join choirs when invited by administrators</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>

              {/* Continue Button */}
              {selectedUserType && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="continue-section"
                >
                  <Button
                    variant={selectedUserType === 'admin' ? 'primary' : 'secondary'}
                    size="xl"
                    loading={isLoading}
                    onClick={() => handleCompleteOnboarding(selectedUserType)}
                    className="continue-button"
                  >
                    {selectedUserType === 'admin' ? 'Create My Choir' : 'Start Exploring'}
                    <ArrowRightIcon className="icon ml-2" style={{ width: '1.25rem', height: '1.25rem' }} />
                  </Button>
                </motion.div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OnboardingPage;
