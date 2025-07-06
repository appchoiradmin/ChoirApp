import { NavLink } from 'react-router-dom';
import './BottomNavigation.css';

interface Tab {
  name: string;
  path: string;
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
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          {tab.name}
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNavigation;
