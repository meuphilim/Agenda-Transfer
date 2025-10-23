// src/pages/AgencyPortal.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reservationService } from '../services/reservation.service';
import { PackageReservation } from '../types/custom';
import { PlusCircle } from 'lucide-react';
import { SimpleReservationForm } from '../components/agency/SimpleReservationForm';

export const AgencyPortal = () => {
  const { profile, signOut } = useAuth();
  const [reservations, setReservations] = useState<PackageReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReservations = () => {
    if (profile?.agency_id) {
      setLoading(true);
      reservationService.getReservationsByAgency(profile.agency_id)
        .then(setReservations)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [profile]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchReservations(); // Recarrega a lista de reservas
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Portal da Agência: {profile?.full_name}</h1>
          <button onClick={signOut} className="text-sm text-blue-600 hover:underline">Sair</button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Minhas Reservas</h2>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <PlusCircle size={20} />
                Nova Reserva
            </button>
        </div>

        {loading ? (
          <p>Carregando reservas...</p>
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

      {isModalOpen && profile?.agency_id && (
        <SimpleReservationForm
            agencyId={profile.agency_id}
            onSuccess={handleSuccess}
            onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
