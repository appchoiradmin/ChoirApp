import { useState, useEffect } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPushNotificationStatus();
  }, []);

  const checkPushNotificationStatus = async () => {
    setIsLoading(true);
    try {
      const supported = await pushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const permissionGranted = await pushNotificationService.isPermissionGranted();
        setIsPermissionGranted(permissionGranted);

        // Check if already subscribed
        if (permissionGranted && 'serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      }
    } catch (error) {
      console.error('Error checking push notification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.subscribeToPushNotifications();
      if (success) {
        setIsPermissionGranted(true);
        setIsSubscribed(true);
      }
      return success;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribeFromPushNotifications();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async (): Promise<void> => {
    await pushNotificationService.testNotification();
  };

  return {
    isSupported,
    isPermissionGranted,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification
  };
}
