import React from 'react';
import { Link, useParams } from 'react-router-dom';

const ChoirAdminPage: React.FC = () => {
  const { choirId } = useParams<{ choirId: string }>();

  return (
    <section className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title">Choir Admin</h1>
          </div>
          <div className="level-right">
            <Link to="/dashboard" className="button">
              Go Back to Dashboard
            </Link>
          </div>
        </div>
        <p>This is the admin page for choir {choirId}.</p>
      </div>
    </section>
  );
};

export default ChoirAdminPage;
