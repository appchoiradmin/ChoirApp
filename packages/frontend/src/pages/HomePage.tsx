import React from 'react';
import Button from '../components/Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
          <Button
            primary
            className="is-large"
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
