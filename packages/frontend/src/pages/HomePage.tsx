import React from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
console.log('Attempting to build sign-in URL with API_BASE_URL:', API_BASE_URL);

const HomePage: React.FC = () => {
  return (
    <section className="hero is-fullheight">
      <div className="hero-body has-text-centered">
        <div className="container">
          <h1 className="title">
            Welcome to ChoirApp
          </h1>
          <h2 className="subtitle">
            Your digital tool for managing songs and playlists.
          </h2>
          <a href={`${API_BASE_URL}/api/auth/signin-google`} className="button is-primary is-large">
            Sign In with Google
          </a>
          <p className="mt-4">
            <Link to="/onboarding">Proceed to Onboarding (temp)</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
