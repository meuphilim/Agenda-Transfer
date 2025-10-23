// src/components/agency/MyReservations.tsx
import { useState, useEffect } from 'react';
import { reservationService } from '../../services/reservation.service';
import { PackageReservation } from '../../types/agency-portal';

interface Props {
  agencyId: string;
}

export const MyReservations = ({ agencyId }: Props) => {
  const [reservations, setReservations] = useState<PackageReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agencyId) {
      loadReservations(agencyId);
    }
  }, [agencyId]);

  const loadReservations = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservationService.getAgencyReservations(id);
      setReservations(data);
    } catch (err) {
      setError('Erro ao carregar reservas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando suas reservas...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Minhas Reservas</h3>
      {reservations.length === 0 ? (
        <p>Você ainda não fez nenhuma reserva.</p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((reservation) => (
            <li key={reservation.id} className="p-4 border rounded-lg">
              <p className="font-bold">{reservation.title}</p>
              <p>De: {new Date(reservation.start_date).toLocaleDateString()}</p>
              <p>Até: {new Date(reservation.end_date).toLocaleDateString()}</p>
              <p>Status: <span className="font-medium">{reservation.status}</span></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
