// src/pages/AgencyOnboarding.tsx
import React from 'react';
import { AgencyOnboardingForm } from '../components/agency/AgencyOnboardingForm';
import { PageHeader } from '../components/Common/PageHeader';

export const AgencyOnboarding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <PageHeader
        title="Cadastro de Nova Agência"
        subtitle="Preencha os dados abaixo para criar a conta da sua agência e seu usuário de acesso."
      />
      <main className="flex justify-center items-center py-12 px-4">
        <div className="w-full max-w-4xl bg-white p-8 md:p-12 rounded-xl shadow-lg">
          <AgencyOnboardingForm />
        </div>
      </main>
    </div>
  );
};
