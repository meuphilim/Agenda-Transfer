import React from 'react';
import { Briefcase } from 'lucide-react';

interface AuthHeaderProps {
  isSignUp: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isSignUp }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 text-center">
      <Briefcase className="w-10 h-10 text-eco-primary-500 mx-auto mb-3" />
      <h1 className="text-3xl font-bold text-eco-dark-700 tracking-tight">
        TourManager
      </h1>
      <p className="mt-2 text-base text-eco-dark-500">
        {isSignUp
          ? 'Crie sua conta de colaborador'
          : 'Acesse sua conta de colaborador'}
      </p>
    </div>
  );
};
