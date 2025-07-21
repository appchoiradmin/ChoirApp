import React from 'react';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  navigation,
  bottomNav,
  className = ''
}) => {
  return (
    <div className={`layout-container mobile-safe-area ${className}`}>
      {navigation && (
        <header className="layout-header">
          {navigation}
        </header>
      )}
      
      <main className="layout-main mobile-container">
        {children}
      </main>
      
      {bottomNav && (
        <footer className="layout-footer">
          {bottomNav}
        </footer>
      )}
    </div>
  );
};

export default Layout;
