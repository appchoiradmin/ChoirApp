import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChoir } from '../services/choirService';
import { useUser } from '../hooks/useUser';
import { Layout, Navigation } from '../components/ui';

const CreateChoirPage: React.FC = () => {
  const [choirName, setChoirName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading, token, refetchUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create a choir.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createChoir(choirName, token);
      await refetchUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <Layout>
      <Navigation 
        title="Create Choir"
        showBackButton={true}
        onBackClick={handleGoBack}
        showUserProfile={true}
      />
      <section className="section">
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="choirName">
                Choir Name
              </label>
              <div className="control">
                <input
                  id="choirName"
                  className={`input ${error ? 'is-danger' : ''}`}
                  type="text"
                  placeholder="e.g., St. Peter's Church Choir"
                  value={choirName}
                  onChange={(e) => setChoirName(e.target.value)}
                  required
                />
              </div>
              {error && <p className="help is-danger">{error}</p>}
            </div>
            <div className="field is-grouped">
              <div className="control">
                <button
                  type="submit"
                  className={`button is-primary ${isLoading ? 'is-loading' : ''}`}
                  disabled={isLoading}
                >
                  Create Choir
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default CreateChoirPage;
