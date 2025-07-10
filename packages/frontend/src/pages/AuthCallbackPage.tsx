import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MusicalNoteIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/ui';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    console.log("AuthCallbackPage loaded. Checking for token...");
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const isNewUser = searchParams.get('isNewUser') === 'true';
    
    // Check for errors first
    if (error) {
      console.error('Authentication error:', error);
      setStatus('error');
      setMessage(error);
      setTimeout(() => {
        navigate(`/auth/error?message=${encodeURIComponent(error)}`);
      }, 2000);
      return;
    }

    console.log("Token from URL:", token ? "Token received" : "No token");
    console.log("Is new user:", isNewUser);

    if (token && token.trim().length > 0) {
      try {
        console.log("Token found. Storing in localStorage...");
        localStorage.setItem('authToken', token);
        
        setStatus('success');
        setMessage(isNewUser ? 'Welcome! Setting up your account...' : 'Welcome back! Redirecting...');
        
        // Redirect based on whether user is new or returning
        setTimeout(() => {
          if (isNewUser) {
            console.log("New user detected. Redirecting to onboarding...");
            navigate('/onboarding', { replace: true });
          } else {
            console.log("Returning user. Redirecting to dashboard...");
            navigate('/dashboard', { replace: true });
          }
        }, 1500);
      } catch (error) {
        console.error('Error storing token:', error);
        setStatus('error');
        setMessage('Failed to store authentication token');
        setTimeout(() => {
          navigate('/auth/error?message=Failed+to+store+authentication+token');
        }, 2000);
      }
    } else {
      console.error('Authentication failed: No token received in URL.');
      setStatus('error');
      setMessage('No authentication token received');
      setTimeout(() => {
        navigate('/auth/error?message=No+authentication+token+received');
      }, 2000);
    }
  }, [searchParams, navigate]);

  const renderStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <MusicalNoteIcon className="icon has-text-primary" style={{ width: '4rem', height: '4rem' }} />
          </motion.div>
        );
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CheckIcon className="icon has-text-success" style={{ width: '4rem', height: '4rem' }} />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ExclamationTriangleIcon className="icon has-text-danger" style={{ width: '4rem', height: '4rem' }} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <section className="hero is-fullheight bg-gradient-to-br from-primary-light to-secondary-light">
        <div className="hero-body has-text-centered">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container"
          >
            <div className="columns is-centered">
              <div className="column is-6-desktop is-8-tablet">
                <div className="card has-background-white-ter p-6">
                  <div className="mb-5">
                    {renderStatusIcon()}
                  </div>
                  
                  <motion.h1 
                    className={`title is-3 mb-4 ${
                      status === 'success' ? 'has-text-success' : 
                      status === 'error' ? 'has-text-danger' : 
                      'has-text-primary'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {status === 'loading' && 'Authenticating...'}
                    {status === 'success' && 'Success!'}
                    {status === 'error' && 'Authentication Error'}
                  </motion.h1>
                  
                  <motion.p 
                    className="subtitle is-5 has-text-grey"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {message}
                  </motion.p>
                  
                  {status === 'loading' && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <progress className="progress is-primary" max="100">Loading...</progress>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default AuthCallbackPage;
