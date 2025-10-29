import { CompanyProfile } from '@/services/companyProfileApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Building, Mail, Phone, MapPin, Hash, Car, User, Globe, Users, FileText, Briefcase
} from 'lucide-react'

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

  const fullAddress = [profile.address, profile.city, profile.state, profile.zip_code].filter(Boolean).join(', ');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {profile.logo_url ? (
          <img
            src={profile.logo_url}
            alt="Logo da Empresa"
            className="h-24 w-24 rounded-full object-cover border-2 border-border/30 shadow-lg hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center shadow-inner">
            <Building className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="text-center sm:text-left pt-2">
          <h1 className="text-3xl font-bold text-foreground">
            {profile.name || 'Nome da Empresa'}
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            {profile.company_description || 'Descrição da empresa não informada.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda */}
        <div className="lg:col-span-2 space-y-6">
            <OverviewCard title="Informações da Empresa">
                <InfoItem icon={<Hash />} label="CNPJ" value={profile.cnpj} />
                <InfoItem icon={<FileText />} label="Razão Social" value={profile.legal_name} />
                <InfoItem icon={<MapPin />} label="Endereço Completo" value={fullAddress} />
                <InfoItem icon={<Globe />} label="Website" value={profile.website} isLink />
            </OverviewCard>

            <OverviewCard title="Detalhes Operacionais">
                <InfoItem icon={<Users />} label="Tamanho da Frota" value={profile.fleet_size?.toString()} />
                <InfoItem icon={<Users />} label="Capacidade Total" value={profile.total_capacity?.toString()} />
                <InfoItem icon={<Car />} label="Tipos de Veículos" value={profile.vehicle_types} />
                <InfoItem icon={<FileText />} label="Licenças" value={profile.licenses} />
            </OverviewCard>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
            <OverviewCard title="Contato">
                <InfoItem icon={<Phone />} label="Telefone" value={profile.phone} />
                <InfoItem icon={<Mail />} label="E-mail" value={profile.email} />
                <InfoItem icon={<i className="fab fa-whatsapp h-4 w-4" />} label="WhatsApp" value={profile.whatsapp} isLink={`https://wa.me/${profile.whatsapp}`} />
                <InfoItem icon={<i className="fab fa-instagram h-4 w-4" />} label="Instagram" value={profile.instagram} />
            </OverviewCard>

             <OverviewCard title="Responsável">
                <InfoItem icon={<User />} label="Nome" value={profile.responsible_name} />
                <InfoItem icon={<Briefcase />} label="Cargo" value={profile.responsible_role} />
                <InfoItem icon={<Phone />} label="Contato Direto" value={profile.responsible_phone} />
            </OverviewCard>

            <Card className="border border-border/40 hover:shadow-md transition-all duration-300">
                <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Acessos Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                <QuickAccess to="/cadastros?tab=Veículos" icon={<Car className="mr-2 h-4 w-4" />} label="Gerenciar Veículos" />
                <QuickAccess to="/cadastros?tab=Motoristas" icon={<User className="mr-2 h-4 w-4" />} label="Gerenciar Motoristas" />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

/* ----------------- COMPONENTES AUXILIARES ----------------- */

const OverviewCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="hover:shadow-md transition-all duration-300 border border-border/40">
        <CardHeader>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </CardContent>
    </Card>
)

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value?: string | null
  isLink?: boolean | string
}

const InfoItem = ({ icon, label, value, isLink }: InfoItemProps) => {
    const content = value || 'Não informado';
    const href = typeof isLink === 'string' ? isLink : (isLink && value ? (value.startsWith('http') ? value : `https://${value}`) : undefined);

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
            <p className="text-xs text-muted-foreground uppercase">{label}</p>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                    {content}
                </a>
            ) : (
                <p className="text-sm font-medium text-foreground">{content}</p>
            )}
            </div>
        </div>
    )
}

interface QuickAccessProps {
  to: string
  icon: React.ReactNode
  label: string
}

const QuickAccess = ({ to, icon, label }: QuickAccessProps) => (
  <Button asChild variant="secondary" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 justify-start">
    <Link to={to}>
      {icon}
      {label}
    </Link>
  </Button>
)

export default Overview;
