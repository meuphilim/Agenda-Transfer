// src/components/agency/SimpleReservationForm.tsx
import { useState } from 'react';
import { reservationService } from '../../services/reservation.service';
import { toast } from 'react-toastify';

interface Props {
  agencyId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const SimpleReservationForm = ({ agencyId, onSuccess, onClose }: Props) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await reservationService.createAgencyReservation({
        title,
        start_date: startDate,
        end_date: endDate,
        observation,
        agency_id: agencyId,
      });

      toast.success('Reserva solicitada com sucesso!');
      onSuccess();
    } catch (err) {
      toast.error('Erro ao criar reserva. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Nova Solicitação de Reserva</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Título da Reserva *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={loading} className="w-full mt-1 px-3 py-2 border rounded-md"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Data de Início *</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={loading} className="w-full mt-1 px-3 py-2 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Data de Fim *</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required disabled={loading} className="w-full mt-1 px-3 py-2 border rounded-md"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">Observações</label>
                <textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={3} disabled={loading} className="w-full mt-1 px-3 py-2 border rounded-md"/>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                    {loading ? 'Enviando...' : 'Solicitar Reserva'}
                </button>
            </div>
            </form>
        </div>
    </div>
  );
};
