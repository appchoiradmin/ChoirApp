import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { MusicalNoteIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/ui';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, user, loading } = useUser();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('auth.authenticating'));

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(error);
      setTimeout(() => navigate(`/auth/error?message=${encodeURIComponent(error)}`), 2000);
      return;
    }

    if (token && token.trim().length > 0) {
      setToken(token);
    } else {
      setStatus('error');
      setMessage(t('auth.noTokenReceived'));
      setTimeout(() => navigate(`/auth/error?message=${encodeURIComponent(t('auth.noTokenReceived'))}`), 2000);
    }
  }, [searchParams, navigate, setToken]);

  useEffect(() => {
    if (!loading && user) {
      setStatus('success');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      // Check for invitation token from URL parameter (sent by backend) or sessionStorage (fallback)
      const urlInviteToken = searchParams.get('inviteToken');
      const sessionInviteToken = sessionStorage.getItem('pendingInviteToken');
      const pendingInviteToken = urlInviteToken || sessionInviteToken;
      
      console.log('🟢 AuthCallback - URL invite token:', urlInviteToken);
      console.log('🟢 AuthCallback - Session invite token:', sessionInviteToken);
      console.log('🟢 AuthCallback - Using invite token:', pendingInviteToken);
      console.log('🟢 AuthCallback - Is new user:', isNewUser);
      console.log('🟢 AuthCallback - Full URL:', window.location.href);
      
      if (pendingInviteToken) {
        // Clear the pending invite token from sessionStorage if it exists
        if (sessionInviteToken) {
          sessionStorage.removeItem('pendingInviteToken');
        }
        console.log('🟢 AuthCallback - Redirecting to invitation page with token:', pendingInviteToken);
        setMessage(t('auth.redirectingToInvitation'));
        setTimeout(() => {
          navigate(`/invite/${pendingInviteToken}`, { replace: true });
        }, 1500);
      } else {
        console.log('🟢 AuthCallback - No invitation token, proceeding with normal flow');
        setMessage(isNewUser ? t('auth.welcomeNewUser') : t('auth.welcomeBackUser'));
        setTimeout(() => {
          if (isNewUser) {
            console.log('🟢 AuthCallback - Redirecting new user to onboarding');
            navigate('/onboarding', { replace: true });
          } else {
            console.log('🟢 AuthCallback - Redirecting existing user to dashboard');
            navigate('/dashboard', { replace: true });
          }
        }, 1500);
      }
    }
  }, [user, loading, navigate, searchParams]);

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
                    {status === 'loading' && t('auth.authenticating')}
                    {status === 'success' && t('auth.success')}
                    {status === 'error' && t('auth.authenticationError')}
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
                      <progress className="progress is-primary" max="100">{t('auth.loading')}</progress>
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
