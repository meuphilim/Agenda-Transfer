import { useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { getCompanyProfile, CompanyProfile } from '@/services/companyProfileApi';
import Overview from '@/components/company_profile/Overview';
import Configuration from '@/components/company_profile/Configuration';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase'; // Importação direta para consistência

const CompanyProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // O AuthProvider já nos dá acesso ao cliente supabase autenticado.
  // Não precisamos mais do hook useAuth aqui se a instância for consistente.

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCompanyProfile(supabase);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar o perfil da empresa.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileUpdate = (updatedProfile: CompanyProfile) => {
    setProfile(updatedProfile);
    setSearchParams({ tab: 'overview' }); // Switch to overview after update
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Perfil da Empresa</h1>
      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="config">Configuração do Perfil</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <>
            {activeTab === 'overview' && (
              <Overview profile={profile} />
            )}
            {activeTab === 'config' && (
              <Configuration currentProfile={profile} onProfileUpdate={handleProfileUpdate} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyProfilePage;
