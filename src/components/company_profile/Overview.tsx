import { CompanyProfile } from '@/services/companyProfileApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Building, Mail, Phone, MapPin, Hash, Car, User } from 'lucide-react'

interface OverviewProps {
  profile: CompanyProfile | null
}

const Overview = ({ profile }: OverviewProps) => {
  if (!profile) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30 shadow-none bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhuma informação do perfil da empresa encontrada. <br />
            Por favor, preencha os dados na aba de configuração.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Perfil da Empresa */}
      <Card className="hover:shadow-md transition-all duration-300 border border-border/40">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt="Logo da Empresa"
                className="h-20 w-20 rounded-full object-cover border border-border/30 shadow-sm hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center shadow-inner">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl font-semibold text-foreground">
                {profile.name || 'Nome da Empresa'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Informações de Contato e Cadastro
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <InfoItem icon={<Hash />} label="CNPJ" value={profile.cnpj} />
          <InfoItem icon={<MapPin />} label="Endereço" value={profile.address} />
          <InfoItem icon={<Phone />} label="Telefone" value={profile.phone} />
          <InfoItem icon={<Mail />} label="E-mail" value={profile.email} />
        </CardContent>
      </Card>

      {/* Acessos Rápidos */}
      <Card className="border border-border/40 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Acessos Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <QuickAccess
            to="/cadastros?tab=Veículos"
            icon={<Car className="mr-2 h-4 w-4" />}
            label="Gerenciar Veículos"
          />
          <QuickAccess
            to="/cadastros?tab=Motoristas"
            icon={<User className="mr-2 h-4 w-4" />}
            label="Gerenciar Motoristas"
          />
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------- COMPONENTES AUXILIARES ----------------- */

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value?: string | null
}

const InfoItem = ({ icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
    <div className="text-muted-foreground">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium text-foreground">
        {value || 'Não informado'}
      </p>
    </div>
  </div>
)

interface QuickAccessProps {
  to: string
  icon: React.ReactNode
  label: string
}

const QuickAccess = ({ to, icon, label }: QuickAccessProps) => (
  <Button
    asChild
    variant="secondary"
    className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
  >
    <Link to={to}>
      {icon}
      {label}
    </Link>
  </Button>
)

export default Overview
