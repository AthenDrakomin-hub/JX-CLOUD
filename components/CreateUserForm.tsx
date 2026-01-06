import React, { useState } from 'react';
import { UserCreatePayload, UserRole } from '../types';
import { createUserService, validateUserCreatePayload } from '../services/createUserService';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface CreateUserFormProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess, onCancel }) => {
  const [userData, setUserData] = useState<Omit<UserCreatePayload, 'username'>>({
    email: '',
    full_name: '',
    avatar_url: '',
    metadata: {},
    auth_id: '',
    role: 'staff',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSession } = useAuth(); // To refresh the session after user creation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: name === 'metadata' ? JSON.parse(value || '{}') : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate input
      const validationError = validateUserCreatePayload({
        ...userData,
        username: userData.email // Adding username for validation
      });
      
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      // Create user via Edge Function
      const result = await createUserService({
        ...userData,
        username: userData.email // Include username in the payload
      });

      // Optionally refresh session or update local state
      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form
      setUserData({
        email: '',
        full_name: '',
        avatar_url: '',
        metadata: {},
        auth_id: '',
        role: 'staff',
      });
    } catch (err: any) {
      console.error('创建用户失败:', err);
      setError(err.message || '创建用户失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">创建新用户</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">全名</label>
          <input
            type="text"
            name="full_name"
            value={userData.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="张三"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">头像 URL</label>
          <input
            type="text"
            name="avatar_url"
            value={userData.avatar_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
          <select
            name="role"
            value={userData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="staff">员工 (Staff)</option>
            <option value="admin">管理员 (Admin)</option>
            <option value="maintainer">维护员 (Maintainer)</option>
            <option value="viewer">查看者 (Viewer)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">认证 ID (可选)</label>
          <input
            type="text"
            name="auth_id"
            value={userData.auth_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="UUID of the auth user"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                创建中...
              </>
            ) : (
              '创建用户'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;