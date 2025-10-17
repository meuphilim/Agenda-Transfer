import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Truck, MapPin, Clock, Edit2, Save, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Common/Button';

interface Package {
  id: string;
  title: string;
  agency: { id: string; name: string };
  driver: { id: string; name: string };
  vehicle: { id: string; model: string; plate: string };
  start_date: string;
  end_date: string;
  status: string;
  activities?: Activity[];
}

interface Activity {
  id: string;
  attraction: { id: string; name: string; location: string };
  date: string;
  time: string;
}

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: Package | null;
  mode: 'view' | 'edit';
  onSave?: (pkg: Package) => void;
  onDelete?: (id: string) => void;
}

export const PackageModal = ({
  isOpen,
  onClose,
  packageData: pkg,
  mode: initialMode,
  onSave,
  onDelete
}: PackageModalProps) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [formData, setFormData] = useState<Package | null>(null);

  useEffect(() => {
    if (pkg) {
      setFormData({ ...pkg });
    }
  }, [pkg]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!pkg || !formData) return null;

  const handleSave = () => {
    if (onSave && formData) {
      onSave(formData);
      setMode('view');
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Tem certeza que deseja excluir este pacote?')) {
      onDelete(pkg.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'view' ? 'Detalhes do Pacote' : 'Editar Pacote'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {pkg.id.substring(0, 8)}...
                  </p>
                </div>

                {/* Ações do Header */}
                <div className="flex items-center space-x-2">
                  {mode === 'view' ? (
                    <Button
                      variant="secondary"
                      icon={Edit2}
                      onClick={() => setMode('edit')}
                    >
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => setMode('view')}>
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        icon={Save}
                        onClick={handleSave}
                      >
                        Salvar
                      </Button>
                    </>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">

                  {/* Informações Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Título */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título do Pacote
                      </label>
                      {mode === 'view' ? (
                        <p className="text-base text-gray-900">{formData.title}</p>
                      ) : (
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      )}
                    </div>

                    {/* Agência */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline h-4 w-4 mr-1" />
                        Agência
                      </label>
                      {mode === 'view' ? (
                        <p className="text-base text-gray-900">{formData.agency.name}</p>
                      ) : (
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option>{formData.agency.name}</option>
                        </select>
                      )}
                    </div>

                    {/* Motorista */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline h-4 w-4 mr-1" />
                        Motorista
                      </label>
                      {mode === 'view' ? (
                        <p className="text-base text-gray-900">{formData.driver.name}</p>
                      ) : (
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option>{formData.driver.name}</option>
                        </select>
                      )}
                    </div>

                    {/* Veículo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Truck className="inline h-4 w-4 mr-1" />
                        Veículo
                      </label>
                      {mode === 'view' ? (
                        <p className="text-base text-gray-900">
                          {formData.vehicle.model} - {formData.vehicle.plate}
                        </p>
                      ) : (
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option>{formData.vehicle.model} - {formData.vehicle.plate}</option>
                        </select>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      {mode === 'view' ? (
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                          formData.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          formData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {formData.status === 'confirmed' ? 'Confirmado' :
                           formData.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      ) : (
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="pending">Pendente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      )}
                    </div>

                    {/* Datas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Data Início
                      </label>
                      {mode === 'view' ? (
                        <p className="text-base text-gray-900">
                          {new Date(formData.start_date).toLocaleDateString('pt-BR')}
                        </p>
                      ) : (
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Data Fim
                      </label>
                      {mode === 'view' ? (
                        <p className="text-base text-gray-900">
                          {new Date(formData.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      ) : (
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        />
                      )}
                    </div>
                  </div>

                  {/* Atividades */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Atividades</h3>
                      {mode === 'edit' && (
                        <Button variant="success" size="sm">
                          + Adicionar Atividade
                        </Button>
                      )}
                    </div>

                    {formData.activities && formData.activities.length > 0 ? (
                      <div className="space-y-3">
                        {formData.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {activity.attraction.name}
                                </h4>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {activity.attraction.location}
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(activity.date).toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {activity.time}
                                  </span>
                                </div>
                              </div>
                              {mode === 'edit' && (
                                <Button variant="danger" size="sm" className="ml-4 p-2">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Nenhuma atividade cadastrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              {mode === 'view' && (
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={handleDelete}
                  >
                    Excluir Pacote
                  </Button>

                  <Button variant="secondary" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};