import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Choir Dashboard</h1>
        <p className="subtitle">
          Welcome to your choir's central hub!
        </p>
        <Link to="/master-songs" className="button is-primary">Manage Master Songs</Link>
        {/* Further dashboard content will go here */}
      </div>
    </section>
  );
};

export default DashboardPage;
