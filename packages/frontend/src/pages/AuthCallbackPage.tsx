import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthCallbackPage loaded. Checking for token...");
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const isNewUser = searchParams.get('isNewUser') === 'true';
    
    // Check for errors first
    if (error) {
      console.error('Authentication error:', error);
      navigate(`/auth/error?message=${encodeURIComponent(error)}`);
      return;
    }

    console.log("Token from URL:", token ? "Token received" : "No token");
    console.log("Is new user:", isNewUser);

    if (token && token.trim().length > 0) {
      try {
        console.log("Token found. Storing in localStorage...");
        localStorage.setItem('authToken', token);
        
        // Redirect based on whether user is new or returning
        if (isNewUser) {
          console.log("New user detected. Redirecting to onboarding...");
          navigate('/onboarding', { replace: true });
        } else {
          console.log("Returning user. Redirecting to dashboard...");
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error storing token:', error);
        navigate('/auth/error?message=Failed+to+store+authentication+token');
      }
    } else {
      console.error('Authentication failed: No token received in URL.');
      navigate('/auth/error?message=No+authentication+token+received');
    }
  }, [searchParams, navigate]);

  return (
    <section className="hero is-fullheight">
      <div className="hero-body has-text-centered">
        <div className="container">
          <p className="title">Authenticating...</p>
          <button className="button is-loading is-large is-white"></button>
        </div>
      </div>
    </section>
  );
};

export default AuthCallbackPage;
