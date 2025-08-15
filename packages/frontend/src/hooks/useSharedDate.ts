import { useContext } from 'react';
import { SharedDateContext } from '../pages/ChoirDashboardPage';
import { getToday } from '../utils/getToday';

export const useSharedDate = () => {
  const context = useContext(SharedDateContext);
  
  // If no context is available (e.g., when used outside ChoirDashboardPage),
  // return a default date of next Sunday
  if (!context) {
    return {
      selectedDate: getToday(),
      setSelectedDate: () => {
        // No-op when not in context
        console.warn('setSelectedDate called outside of SharedDateContext');
      }
    };
  }
  
  return context;
};
