import { useContext } from 'react';
import { SharedDateContext } from '../pages/ChoirDashboardPage';
import { getNextSunday } from '../utils/getNextSunday';

export const useSharedDate = () => {
  const context = useContext(SharedDateContext);
  
  // If no context is available (e.g., when used outside ChoirDashboardPage),
  // return a default date of next Sunday
  if (!context) {
    return {
      selectedDate: getNextSunday(),
      setSelectedDate: () => {
        // No-op when not in context
        console.warn('setSelectedDate called outside of SharedDateContext');
      }
    };
  }
  
  return context;
};
