import React from 'react';
import { Briefcase } from 'lucide-react';

interface AuthHeaderProps {
  isSignUp: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isSignUp }) => {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-12 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          TourManager
        </h1>
        <p className="mt-3 text-base text-gray-600 font-medium">
          {isSignUp
            ? 'Crie sua conta de colaborador'
            : 'Acesse sua conta de colaborador'}
        </p>
      </div>
    </div>
  );
};
