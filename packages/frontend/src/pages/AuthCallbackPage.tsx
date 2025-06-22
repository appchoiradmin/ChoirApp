import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthCallbackPage loaded. Checking for token...");
    const token = searchParams.get('token');
    console.log("Token from URL:", token);

    if (token) {
      console.log("Token found. Storing in localStorage...");
      localStorage.setItem('token', token);
      console.log("Redirecting to dashboard...");
      navigate('/dashboard');
    } else {
      console.error('Authentication failed: No token received in URL.');
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
