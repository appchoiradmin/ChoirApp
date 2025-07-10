import React, { useState } from 'react';

interface NavigationProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
}

const Navigation: React.FC<NavigationProps> = ({
  title = 'ChoirApp',
  showBackButton = false,
  onBackClick,
  actions
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          {showBackButton && (
            <button
              className="navbar-item button is-ghost has-text-white"
              onClick={onBackClick}
              aria-label="Go back"
            >
              <span className="icon">
                <i className="fas fa-arrow-left"></i>
              </span>
            </button>
          )}
          
          <span className="navbar-item has-text-white is-size-5 has-text-weight-bold">
            {title}
          </span>

          <button
            className={`navbar-burger burger ${isMenuOpen ? 'is-active' : ''}`}
            aria-label="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
          <div className="navbar-end">
            {actions}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
