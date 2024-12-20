import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { updatePassword } from '../../lib/users';

export const SecurityForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityInfo.newPassword !== securityInfo.confirmPassword) {
      setError('profile.password.mismatch');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { success, error } = await updatePassword(
      securityInfo.currentPassword,
      securityInfo.newPassword
    );

    if (success) {
      setSuccess('profile.password.success');
      setSecurityInfo({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setError(error || 'profile.password.error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="password"
        label={<FormattedMessage id="profile.currentPassword" />}
        value={securityInfo.currentPassword}
        onChange={(e) =>
          setSecurityInfo({ ...securityInfo, currentPassword: e.target.value })
        }
      />
      <Input
        type="password"
        label={<FormattedMessage id="profile.newPassword" />}
        value={securityInfo.newPassword}
        onChange={(e) =>
          setSecurityInfo({ ...securityInfo, newPassword: e.target.value })
        }
      />
      <Input
        type="password"
        label={<FormattedMessage id="profile.confirmPassword" />}
        value={securityInfo.confirmPassword}
        onChange={(e) =>
          setSecurityInfo({ ...securityInfo, confirmPassword: e.target.value })
        }
        error={error ? <FormattedMessage id={error} /> : undefined}
      />
      {success && (
        <p className="text-sm text-green-600">
          <FormattedMessage id={success} />
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? (
          <FormattedMessage id="profile.saving" />
        ) : (
          <FormattedMessage id="profile.changePassword" />
        )}
      </Button>
    </form>
  );
};