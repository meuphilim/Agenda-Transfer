import { CompanyProfile } from '@/services/companyProfileApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building, Mail, Phone, MapPin, Hash, Car, User } from 'lucide-react';

interface OverviewProps {
  profile: CompanyProfile | null;
}

const Overview = ({ profile }: OverviewProps) => {
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nenhuma informação do perfil da empresa encontrada. Por favor, preencha os dados na aba de configuração.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt="Logo da Empresa" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-500" />
            </div>
          )}
          <div>
            <CardTitle className="text-2xl">{profile.name || 'Nome da Empresa'}</CardTitle>
            <p className="text-sm text-gray-500">Informações de Contato e Cadastro</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Hash className="h-5 w-5 text-gray-500" />
          <span>CNPJ: {profile.cnpj || 'Não informado'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <span>Endereço: {profile.address || 'Não informado'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-5 w-5 text-gray-500" />
          <span>Telefone: {profile.phone || 'Não informado'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-gray-500" />
          <span>Email: {profile.email || 'Não informado'}</span>
        </div>
      </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Acessos Rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
            <Button asChild>
                <Link to="/cadastros?tab=Veículos">
                    <Car className="mr-2 h-4 w-4" />
                    Gerenciar Veículos
                </Link>
            </Button>
            <Button asChild>
                <Link to="/cadastros?tab=Motoristas">
                    <User className="mr-2 h-4 w-4" />
                    Gerenciar Motoristas
                </Link>
            </Button>
        </CardContent>
    </Card>
    </div>
  );
};

export default Overview;
