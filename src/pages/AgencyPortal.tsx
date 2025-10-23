// src/pages/AgencyPortal.tsx
import { useState } from 'react';
import { ReservationCalendar } from '../components/agency/ReservationCalendar';
import { SimpleReservationForm } from '../components/agency/SimpleReservationForm';
import { MyReservations } from '../components/agency/MyReservations';
import { useAuth } from '../contexts/AuthContext';

export const AgencyPortal = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: string; end: string } | null>(null);
  const { profile, loading } = useAuth();

  const handlePeriodSelection = (start: string, end:string) => {
    setSelectedPeriod({ start, end });
  };

  const handleReservationSuccess = () => {
    alert('Reserva criada com sucesso!');
    setSelectedPeriod(null); // Limpa a seleção para permitir nova reserva
  };

  if (loading || !profile) {
    return <div>Carregando portal...</div>
  }

  if (!profile.agency_id) {
    return <div>Erro: Perfil de agência não encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Portal da Agência: {profile.full_name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ReservationCalendar onSelectPeriod={handlePeriodSelection} />
          {selectedPeriod && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Criar Nova Reserva</h2>
              <SimpleReservationForm
                startDate={selectedPeriod.start}
                endDate={selectedPeriod.end}
                agencyId={profile.agency_id}
                onSuccess={handleReservationSuccess}
              />
            </div>
          )}
        </div>

        <div>
          <MyReservations agencyId={profile.agency_id} />
        </div>
      </div>
    </div>
  );
};
