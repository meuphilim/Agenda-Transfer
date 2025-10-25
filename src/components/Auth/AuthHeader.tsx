import React from 'react';
import { Briefcase } from 'lucide-react';

interface AuthHeaderProps {
  isSignUp: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isSignUp }) => {
  return (
    <div className="text-center py-8 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <Briefcase className="mx-auto h-12 w-12 text-blue-600" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">TourManager</h1>
        <p className="mt-2 text-sm text-gray-600">
          {isSignUp
            ? 'Crie sua conta de colaborador'
            : 'Acesse sua conta de colaborador'}
        </p>
      </div>
    </div>
  );
};
