import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { MusicalNoteIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/ui';
import { acceptShareableInvitation } from '../services/shareableInvitationService';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, user, loading, refetchUser } = useUser();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('auth.authenticating'));
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const inviteTokenFromUrl = searchParams.get('inviteToken');
    const inviteTokenFromSession = sessionStorage.getItem('inviteToken');
    const inviteToken = inviteTokenFromUrl || inviteTokenFromSession;


    // Store invitation token for later use if present
    if (inviteToken) {
      sessionStorage.setItem('inviteToken', inviteToken);
    }

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
  }, [searchParams, navigate, setToken, t]);

  useEffect(() => {
    if (!loading && user && !hasProcessed) {
      setHasProcessed(true); // Prevent multiple executions
      setStatus('success');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      const inviteToken = sessionStorage.getItem('inviteToken');
      
      setMessage(isNewUser ? t('auth.welcomeNewUser') : t('auth.welcomeBackUser'));
      
      setTimeout(async () => {
        // Handle invitation acceptance for existing users
        if (!isNewUser && inviteToken && user.token) {
          try {
            await acceptShareableInvitation({ invitationToken: inviteToken }, user.token);
            sessionStorage.removeItem('inviteToken');
            
            // Refresh user data to show the new choir in dashboard
            await refetchUser();
            
            navigate('/dashboard', { replace: true });
            return;
          } catch (error: any) {
            console.error('Failed to accept invitation:', error);
            // Continue to normal flow even if invitation fails
          }
        }
        
        // Normal flow
        if (isNewUser) {
          // If new user has an invitation token, skip onboarding and accept invitation directly
          if (inviteToken && user.token) {
            try {
              await acceptShareableInvitation({ invitationToken: inviteToken }, user.token);
              sessionStorage.removeItem('inviteToken');
              
              // Refresh user data to show the new choir in dashboard
              await refetchUser();
              
              navigate('/dashboard', { replace: true });
              return;
            } catch (error: any) {
              console.error('Failed to accept invitation for new user:', error);
              // Fall back to onboarding if invitation fails
              navigate('/onboarding', { replace: true });
              return;
            }
          }
          
          // For new users without invitation token, go through normal onboarding
          navigate('/onboarding', { replace: true });
        } else {
          // Preserve URL parameters when redirecting to dashboard after authentication
          let redirectUrl = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
          
          // CRITICAL FIX: Ensure My Songs default for dashboard context after sign-in
          if (redirectUrl.includes('/songs') && !redirectUrl.includes('/choir/')) {
            const url = new URL(redirectUrl, window.location.origin);
            if (url.searchParams.has('showAll')) {
              url.searchParams.delete('showAll');
              redirectUrl = url.pathname + (url.search || '');
            }
          }
          
          sessionStorage.removeItem('redirectAfterAuth'); // Clean up
          navigate(redirectUrl, { replace: true });
        }
      }, 1500);
    }
  }, [user, loading, navigate, searchParams, t, hasProcessed]);

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
