// src/pages/AgencyPortal.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reservationService } from '../services/reservation.service';
import { PackageReservation } from '../types/custom';

export const AgencyPortal = () => {
  const { profile } = useAuth();
  const [reservations, setReservations] = useState<PackageReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  useEffect(() => {
    if (profile?.agencyId) {
      setLoadingReservations(true);
      reservationService.getReservationsByAgency(profile.agencyId)
        .then(data => setReservations(data))
        .catch(console.error)
        .finally(() => setLoadingReservations(false));
    }
  }, [profile]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Portal da Agência</h1>

      {/* Aqui entrará o formulário para criar novas reservas,
          usando o calendário e um formulário simplificado.
          Por enquanto, vamos focar em listar as reservas existentes. */}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Minhas Reservas</h2>
        {loadingReservations ? (
          <p>Carregando reservas...</p>
        ) : reservations.length === 0 ? (
          <p>Nenhuma reserva encontrada.</p>
        ) : (
          <ul className="space-y-4">
            {reservations.map(res => (
              <li key={res.id} className="p-4 bg-white rounded-lg shadow">
                <p className="font-bold text-lg">{res.title}</p>
                <p>Status: <span className="font-medium capitalize">{res.status}</span></p>
                <p className="text-sm text-gray-600">
                  {new Date(res.start_date).toLocaleDateString()} - {new Date(res.end_date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
