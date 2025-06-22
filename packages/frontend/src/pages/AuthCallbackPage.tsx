import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store the token in local storage for future API calls
      localStorage.setItem('authToken', token);
      // Redirect to the dashboard or another appropriate page
      navigate('/dashboard');
    } else {
      // Handle the case where the token is missing
      console.error('Authentication failed: No token received.');
      // Redirect to the home page with an error message if you want
      navigate('/');
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
