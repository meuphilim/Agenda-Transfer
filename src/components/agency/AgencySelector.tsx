
// src/components/agency/AgencySelector.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { Agency } from '../../types/database.types';
import { LoadingSpinner } from '../Common';

export const AgencySelector = () => {
  const [agencies, setAgencies] = useState<Pick<Agency, 'id' | 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedAgencyId = searchParams.get('agency_id') || '';

  useEffect(() => {
    adminApi.getAllAgencies()
      .then(setAgencies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgencyId = e.target.value;
    const selectedAgency = agencies.find(a => a.id === newAgencyId);

    if (selectedAgency) {
      setSearchParams({ agency_id: selectedAgency.id, agency_name: selectedAgency.name });
    } else {
      setSearchParams({});
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2"><LoadingSpinner size={16} /><p>Carregando agências...</p></div>;
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
      <label htmlFor="agency-selector" className="block text-sm font-bold text-blue-800 mb-2">
        Visualizando como Administrador
      </label>
      <select
        id="agency-selector"
        value={selectedAgencyId}
        onChange={handleAgencyChange}
        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Selecione uma agência para visualizar</option>
        {agencies.map(agency => (
          <option key={agency.id} value={agency.id}>
            {agency.name}
          </option>
        ))}
      </select>
    </div>
  );
};
