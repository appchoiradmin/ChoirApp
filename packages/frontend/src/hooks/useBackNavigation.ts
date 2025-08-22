import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseBackNavigationOptions {
  /**
   * The route to navigate to when back button is pressed
   */
  backRoute: string;
  /**
   * Optional condition to determine if back navigation should be intercepted
   * If false, default browser back behavior will be used
   */
  shouldIntercept?: boolean;
  /**
   * Optional custom handler for back navigation
   * If provided, this will be called instead of navigating to backRoute
   */
  onBackNavigation?: () => void;
}

/**
 * Hook to handle phone/browser back button navigation
 * Intercepts the browser's popstate event and redirects to a specific route
 * 
 * @param options Configuration for back navigation behavior
 */
export const useBackNavigation = ({
  backRoute,
  shouldIntercept = true,
  onBackNavigation
}: UseBackNavigationOptions) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInterceptingRef = useRef(false);

  useEffect(() => {
    if (!shouldIntercept) return;

    let isComponentMounted = true;

    const handlePopState = () => {
      if (!isComponentMounted || !isInterceptingRef.current) return;

      // Prevent default back navigation by immediately pushing forward
      const currentPath = location.pathname + location.search;
      window.history.pushState(null, '', currentPath);

      // Navigate to the desired route
      if (onBackNavigation) {
        onBackNavigation();
      } else {
        navigate(backRoute, { replace: true });
      }
    };

    // Set up interception
    isInterceptingRef.current = true;
    
    // Push a state to ensure we can intercept back navigation
    window.history.pushState(null, '', location.pathname + location.search);

    // Listen for popstate events (triggered by back button)
    window.addEventListener('popstate', handlePopState);

    return () => {
      isComponentMounted = false;
      isInterceptingRef.current = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [backRoute, shouldIntercept, onBackNavigation, navigate, location.pathname, location.search]);
};
