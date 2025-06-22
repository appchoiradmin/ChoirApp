import React from 'react';
import { Link } from 'react-router-dom';

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
          <a href="http://localhost:5001/api/auth/signin-google" className="button is-primary is-large">
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
