import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useTranslation } from '../hooks/useTranslation';

export const PushNotificationTest: React.FC = () => {
  const { t } = useTranslation();
  const {
    isSupported,
    isPermissionGranted,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="notification is-warning">
        <p><strong>Push notifications are not supported</strong></p>
        <p>Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.</p>
      </div>
    );
  }

  return (
    <div className="box">
      <h3 className="title is-5">🔔 Push Notification Settings</h3>
      
      <div className="content">
        <div className="field">
          <label className="label">Status</label>
          <div className="control">
            <div className="tags has-addons">
              <span className="tag">Permission</span>
              <span className={`tag ${isPermissionGranted ? 'is-success' : 'is-danger'}`}>
                {isPermissionGranted ? 'Granted' : 'Not Granted'}
              </span>
            </div>
            <div className="tags has-addons">
              <span className="tag">Subscription</span>
              <span className={`tag ${isSubscribed ? 'is-success' : 'is-warning'}`}>
                {isSubscribed ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="field is-grouped">
          <div className="control">
            <button
              className={`button is-primary ${isLoading ? 'is-loading' : ''}`}
              onClick={subscribe}
              disabled={isLoading || isSubscribed}
            >
              📱 Enable Notifications
            </button>
          </div>
          
          <div className="control">
            <button
              className={`button is-light ${isLoading ? 'is-loading' : ''}`}
              onClick={unsubscribe}
              disabled={isLoading || !isSubscribed}
            >
              🔕 Disable Notifications
            </button>
          </div>
          
          <div className="control">
            <button
              className="button is-info"
              onClick={testNotification}
              disabled={!isPermissionGranted}
            >
              🧪 Test Notification
            </button>
          </div>
        </div>

        <div className="notification is-info is-light">
          <p><strong>How it works:</strong></p>
          <ul>
            <li>✅ <strong>Enable notifications</strong> to receive choir invitations</li>
            <li>🎵 When someone invites you to a choir, you'll get a push notification</li>
            <li>📱 Notifications work even when the app is closed</li>
            <li>🔧 Use "Test Notification" to verify everything is working</li>
          </ul>
        </div>

        {isSubscribed && (
          <div className="notification is-success is-light">
            <p>🎉 <strong>Great!</strong> You're all set to receive choir invitation notifications!</p>
            <p>Ask someone to invite you to a choir to test the feature.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotificationTest;
