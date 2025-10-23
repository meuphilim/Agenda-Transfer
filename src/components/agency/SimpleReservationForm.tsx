// src/components/agency/SimpleReservationForm.tsx
import { useState } from 'react';
import { reservationService } from '../../services/reservation.service';

interface Props {
  startDate: string;
  endDate: string;
  agencyId: string;
  onSuccess: () => void;
}

export const SimpleReservationForm = ({
  startDate,
  endDate,
  agencyId,
  onSuccess
}: Props) => {
  const [title, setTitle] = useState('');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await reservationService.create({
        title,
        start_date: startDate,
        end_date: endDate,
        observation,
        agency_id: agencyId,
        created_by_agency: true,
        status: 'pending',
        vehicle_id: null,
        driver_id: null
      });

      onSuccess();
    } catch (err) {
      setError('Erro ao criar reserva. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título da Reserva *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Ex: Grupo Escola XYZ"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Início
          </label>
          <input
            type="date"
            value={startDate}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            value={endDate}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          rows={4}
          placeholder="Detalhes adicionais sobre a reserva..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Solicitar Reserva'}
      </button>
    </form>
  );
};
