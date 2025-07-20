import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChoir } from '../services/choirService';
import { useUser } from '../hooks/useUser';
import { useTranslation } from '../hooks/useTranslation';
import { Layout, Navigation } from '../components/ui';

const CreateChoirPage: React.FC = () => {
  const [choirName, setChoirName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading, token, refreshToken } = useUser();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(t('choir.mustBeLoggedIn'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createChoir(choirName, token);
      
      // After creating a choir, the user becomes a choir admin
      // Refresh the token to update the role claim
      await refreshToken();
      
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('choir.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div>{t('common.loading')}...</div>;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <Layout>
      <Navigation 
        title={t('choir.createChoirTitle')}
        showBackButton={true}
        onBackClick={handleGoBack}
        showUserProfile={true}
      />
      <section className="section">
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="choirName">
                {t('choir.choirName')}
              </label>
              <div className="control">
                <input
                  id="choirName"
                  className={`input ${error ? 'is-danger' : ''}`}
                  type="text"
                  placeholder={t('choir.choirNamePlaceholder')}
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
                  {t('choir.createChoirButton')}
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
