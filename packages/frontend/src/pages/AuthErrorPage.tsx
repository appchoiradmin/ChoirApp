import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const AuthErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An unknown error occurred during authentication.';

  return (
    <section className="hero is-fullheight">
      <div className="hero-body has-text-centered">
        <div className="container">
          <h1 className="title has-text-danger">Authentication Error</h1>
          <p className="subtitle">{decodeURIComponent(errorMessage)}</p>
          <Link to="/" className="button is-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AuthErrorPage;
