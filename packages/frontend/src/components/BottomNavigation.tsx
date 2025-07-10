import { NavLink } from 'react-router-dom';
import './BottomNavigation.css';

interface Tab {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface BottomNavigationProps {
  tabs: Tab[];
}

const BottomNavigation = ({ tabs }: BottomNavigationProps) => {
  return (
    <div className="bottom-navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) => 
            `bottom-navigation__tab ${isActive ? 'active' : ''}`
          }
        >
          {tab.icon && (
            <div className="bottom-navigation__icon">
              {tab.icon}
            </div>
          )}
          <span className="bottom-navigation__label">{tab.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNavigation;
