// src/pages/AgencyPortal.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reservationService } from '../services/reservation.service';
import { PackageReservation } from '../types/custom';
import { PlusCircle } from 'lucide-react';
import { SimpleReservationForm } from '../components/agency/SimpleReservationForm';
import { AgencySelector } from '../components/agency/AgencySelector';
import { LoadingSpinner } from '../components/Common';

export const AgencyPortal = () => {
  const { profile, signOut, isAdmin } = useAuth();
  const [reservations, setReservations] = useState<PackageReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const agencyIdToFetch = isAdmin ? searchParams.get('agency_id') : profile?.agency_id;

  const fetchReservations = useCallback(() => {
    if (agencyIdToFetch) {
      setLoading(true);
      reservationService.getReservationsByAgency(agencyIdToFetch)
        .then(setReservations)
        .catch(error => {
          console.error("Erro ao buscar reservas:", error);
          setReservations([]); // Limpa em caso de erro
        })
        .finally(() => setLoading(false));
    } else {
      setReservations([]);
      setLoading(false);
    }
  }, [agencyIdToFetch]);

  useEffect(() => {
    if (agencyIdToFetch) {
      fetchReservations();
    } else {
      setReservations([]);
      setLoading(false);
    }
  }, [agencyIdToFetch, fetchReservations]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchReservations(); // Recarrega a lista de reservas
  };

  const portalTitle = isAdmin && searchParams.get('agency_name')
    ? `Visualizando como: ${searchParams.get('agency_name')}`
    : `Portal da Agência: ${profile?.full_name}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">{portalTitle}</h1>
          <button onClick={signOut} className="text-sm text-blue-600 hover:underline">Sair</button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {isAdmin && <AgencySelector />}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Reservas da Agência</h2>
            {(profile?.agency_id || (isAdmin && searchParams.get('agency_id'))) && (
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <PlusCircle size={20} />
                  Nova Reserva
              </button>
            )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700">Nenhuma reserva encontrada</h3>
            <p className="text-gray-500 mt-2">Clique em "Nova Reserva" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(res => (
              <div key={res.id} className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg text-gray-800">{res.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(res.start_date).toLocaleDateString()} - {new Date(res.end_date).toLocaleDateString()}
                    </p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full
                    ${res.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${res.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    ${res.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                `}>
                    {res.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <SimpleReservationForm
            agencyId={agencyIdToFetch}
            onSuccess={handleSuccess}
            onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
