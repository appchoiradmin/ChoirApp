import React, { useState } from 'react';
import { Card, Button } from '../ui';
import {
  UserPlusIcon,
  EnvelopeIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './InviteMemberEnhanced.scss';

interface InviteMemberEnhancedProps {
  onInviteMember: (email: string) => void;
  isLoading?: boolean;
}

const InviteMemberEnhanced: React.FC<InviteMemberEnhancedProps> = ({ 
  onInviteMember, 
  isLoading = false 
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await onInviteMember(email);
      setEmail('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null); // Clear error when user starts typing
    if (success) setSuccess(false); // Clear success when user starts typing
  };

  return (
    <Card className="invite-member-enhanced">
      <div className="invite-header">
        <div className="invite-icon">
          <UserPlusIcon />
        </div>
        <div className="invite-title">
          <h3>Invite New Member</h3>
          <p>Send an invitation to join your choir</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invite-form">
        <div className="form-group">
          <label htmlFor="email-input" className="form-label">
            Email Address
          </label>
          <div className="input-container">
            <div className="input-icon">
              <EnvelopeIcon />
            </div>
            <input
              id="email-input"
              type="email"
              className={`form-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
              placeholder="Enter member's email address"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          
          {error && (
            <div className="form-message error">
              <ExclamationTriangleIcon className="message-icon" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="form-message success">
              <CheckIcon className="message-icon" />
              <span>Invitation sent successfully!</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!email.trim() || isLoading}
          leftIcon={<UserPlusIcon />}
          className="invite-button"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </form>

      <div className="invite-help">
        <p>
          <strong>Note:</strong> The invited user will receive an email with instructions 
          to join your choir. They'll need to create an account if they don't have one.
        </p>
      </div>
    </Card>
  );
};

export default InviteMemberEnhanced;
