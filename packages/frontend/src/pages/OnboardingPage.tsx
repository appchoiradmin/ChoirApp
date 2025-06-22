import React from 'react';
import { Link } from 'react-router-dom';

const OnboardingPage: React.FC = () => {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Onboarding</h1>
        <p className="subtitle">What would you like to do?</p>
        <div className="buttons">
          <Link to="/create-choir" className="button is-primary">
            Create a Choir
          </Link>
          <button className="button">
            Join as a Regular User
          </button>
        </div>
      </div>
    </section>
  );
};

export default OnboardingPage;
