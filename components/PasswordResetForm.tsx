import React, { useState } from 'react';
import { api } from '../services/api';

interface PasswordResetFormProps {
  onResetComplete?: () => void;
  onCancel?: () => void;
  t: (key: string) => string; // Translation function
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onResetComplete, onCancel, t }) => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 验证输入
    if (!username.trim()) {
      setError(t('username_required') || 'Username is required');
      return;
    }

    if (!newPassword) {
      setError(t('password_required') || 'New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwords_do_not_match') || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError(t('password_too_short') || 'Password is too short');
      return;
    }

    setLoading(true);

    try {
      const result = await api.db.setUserPassword(username, newPassword);
      
      if (result.success) {
        setSuccess(t('password_reset_success') || 'Password reset successfully');
        setTimeout(() => {
          if (onResetComplete) onResetComplete();
        }, 1500);
      } else {
        setError(result.message || t('password_reset_failed') || 'Password reset failed');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || t('password_reset_failed') || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('reset_user_password') || 'Reset User Password'}</h2>
        <p className="text-gray-600 mt-2">{t('enter_username_and_new_password') || 'Enter username and new password'}</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            {t('username') || 'Username'}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
            placeholder={t('enter_username') || 'Enter username'}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {t('new_password') || 'New Password'}
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
            placeholder={t('enter_new_password') || 'Enter new password'}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {t('confirm_password') || 'Confirm Password'}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
            placeholder={t('confirm_password_placeholder') || 'Confirm password'}
            disabled={loading}
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            disabled={loading}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (t('resetting') || 'Resetting...') : (t('reset_password') || 'Reset Password')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordResetForm;