import React, { useState } from 'react';

const CreateChoirPage: React.FC = () => {
  const [choirName, setChoirName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Mock API call
    console.log('Creating choir with name:', choirName);
    setTimeout(() => {
      if (choirName.toLowerCase() === 'taken') {
        setError('This choir name is already taken.');
      } else if (choirName.length < 3) {
        setError('Choir name must be at least 3 characters long.');
      } else {
        // On success, you would navigate to the dashboard
        alert('Choir created successfully!');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Create a New Choir</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="choirName">Choir Name</label>
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
          <div className="control">
            <button
              type="submit"
              className={`button is-primary ${isLoading ? 'is-loading' : ''}`}
              disabled={isLoading}
            >
              Create Choir
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateChoirPage;
