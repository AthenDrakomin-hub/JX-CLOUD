import React from 'react';
import SignUpLogin from './components/SignUpLogin';
import { User as UserType } from './types';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onAuthSuccess: (user: UserType) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  return (
    <div className="auth-page">
      <SignUpLogin onAuthSuccess={onAuthSuccess} />
    </div>
  );
};

export default AuthPage;