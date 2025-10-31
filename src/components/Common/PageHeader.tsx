// src/components/Common/PageHeader.tsx
import React from 'react';
import { Briefcase } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="w-full bg-white shadow-sm py-8">
      <div className="max-w-7xl mx-auto text-center px-4">
        <Briefcase className="w-10 h-10 text-lime-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-md text-gray-600">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
