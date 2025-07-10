import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Card, Layout } from '../components/ui';

const AuthErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An unknown error occurred during authentication.';

  const getErrorDetails = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('token')) {
      return {
        title: 'Authentication Token Error',
        description: 'There was an issue with your authentication token. This usually happens when the login session expires.',
        suggestion: 'Please try signing in again.'
      };
    } else if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to our authentication service.',
        suggestion: 'Please check your internet connection and try again.'
      };
    } else if (lowerMessage.includes('cancelled') || lowerMessage.includes('denied')) {
      return {
        title: 'Authentication Cancelled',
        description: 'The authentication process was cancelled or access was denied.',
        suggestion: 'You can try signing in again or contact support if this persists.'
      };
    } else {
      return {
        title: 'Authentication Error',
        description: 'Something went wrong during the authentication process.',
        suggestion: 'Please try signing in again or contact support if the problem continues.'
      };
    }
  };

  const errorDetails = getErrorDetails(errorMessage);

  return (
    <Layout>
      <section className="hero is-fullheight bg-gradient-to-br from-danger-light to-warning-light">
        <div className="hero-body has-text-centered">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container"
          >
            <div className="columns is-centered">
              <div className="column is-8-desktop is-10-tablet">
                <Card className="has-background-white p-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    className="mb-5"
                  >
                    <ExclamationTriangleIcon 
                      className="icon has-text-danger" 
                      style={{ width: '4rem', height: '4rem' }} 
                    />
                  </motion.div>
                  
                  <motion.h1 
                    className="title is-2 has-text-danger mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {errorDetails.title}
                  </motion.h1>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="content mb-6"
                  >
                    <p className="subtitle is-5 has-text-grey mb-4">
                      {errorDetails.description}
                    </p>
                    
                    <div className="notification is-warning is-light">
                      <p className="has-text-weight-semibold mb-2">What you can do:</p>
                      <p>{errorDetails.suggestion}</p>
                    </div>
                    
                    {errorMessage !== 'An unknown error occurred during authentication.' && (
                      <details className="mt-4">
                        <summary className="has-text-weight-semibold cursor-pointer">
                          Technical Details
                        </summary>
                        <div className="notification is-light mt-2">
                          <code className="has-text-danger">
                            {decodeURIComponent(errorMessage)}
                          </code>
                        </div>
                      </details>
                    )}
                  </motion.div>

                  <motion.div 
                    className="buttons is-centered"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Link to="/" className="mr-3">
                      <Button
                        variant="primary"
                        size="lg"
                      >
                        <HomeIcon className="icon mr-2" style={{ width: '1.25rem', height: '1.25rem' }} />
                        Back to Home
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outlined"
                      size="lg"
                      onClick={() => window.history.back()}
                    >
                      <ArrowLeftIcon className="icon mr-2" style={{ width: '1.25rem', height: '1.25rem' }} />
                      Go Back
                    </Button>
                  </motion.div>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default AuthErrorPage;
