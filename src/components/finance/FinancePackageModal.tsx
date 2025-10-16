import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, Save, Trash2 } from 'lucide-react';
import { PackageWithRelations } from '../../services/financeApi';
import { Agency, Driver } from '../../types/finance';

interface FinancePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: PackageWithRelations) => Promise<void>;
  onDelete: (packageId: string) => Promise<void>;
  pkg: PackageWithRelations | null;
  agencies: Agency[];
  drivers: Driver[];
}

const formatCurrencyForInput = (value: number) => {
  return value.toFixed(2).replace('.', ',');
};

const parseCurrencyFromInput = (value: string) => {
  return parseFloat(value.replace(',', '.'));
};

export const FinancePackageModal: React.FC<FinancePackageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  pkg,
  agencies,
  drivers,
}) => {
  const [formData, setFormData] = useState<PackageWithRelations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkg) {
      setFormData({ ...pkg });
    }
  }, [pkg]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checked });
    } else if (name.startsWith('valor_')) {
      setFormData({ ...formData, [name]: parseCurrencyFromInput(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      await onSave(formData);
      toast.success('Pacote atualizado com sucesso!');
      onClose();
    } catch {
      toast.error('Erro ao salvar o pacote.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData) return;
    if (window.confirm('Tem certeza que deseja excluir este pacote?')) {
      setLoading(true);
      try {
        await onDelete(formData.id);
        toast.success('Pacote excluído com sucesso!');
        onClose();
      } catch {
        toast.error('Erro ao excluir o pacote.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-5">
            <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
              Gerenciar Pacote Financeiro
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agency */}
              <div>
                <label htmlFor="agency_id" className="block text-sm font-medium text-gray-700">Agência</label>
                <select id="agency_id" name="agency_id" value={formData.agency_id} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Package Title (readonly) */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Pacote</label>
                <input id="title" type="text" name="title" value={formData.title} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"/>
              </div>

              {/* Driver */}
              <div>
                <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700">Motorista</label>
                {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                <select id="driver_id" name="driver_id" value={formData.driver_id ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Nenhum</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status_pagamento" className="block text-sm font-medium text-gray-700">Status Pagamento</label>
                <select id="status_pagamento" name="status_pagamento" value={formData.status_pagamento} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Data Início */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Data de Início</label>
                <input id="start_date" type="date" name="start_date" value={new Date(formData.start_date).toISOString().split('T')[0]} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
              </div>

              {/* Translado */}
              <div className="flex items-center pt-6">
                <input id="translado_aeroporto" type="checkbox" name="translado_aeroporto" checked={formData.translado_aeroporto} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                <label htmlFor="translado_aeroporto" className="ml-2 block text-sm text-gray-900">Translado Aeroporto</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                {/* Valor Total */}
                <div>
                    <label htmlFor="valor_total" className="block text-sm font-medium text-gray-700">Valor Total (R$)</label>
                    <input id="valor_total" type="text" name="valor_total" value={formatCurrencyForInput(formData.valor_total)} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>

                {/* Valor Diária */}
                <div>
                    <label htmlFor="valor_diaria" className="block text-sm font-medium text-gray-700">Valor Diária (R$)</label>
                    <input id="valor_diaria" type="text" name="valor_diaria" value={formatCurrencyForInput(formData.valor_diaria)} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>

                {/* Valor NET */}
                <div>
                    <label htmlFor="valor_net" className="block text-sm font-medium text-gray-700">Valor NET (R$)</label>
                    <input id="valor_net" type="text" name="valor_net" value={formatCurrencyForInput(formData.valor_net)} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 border-t mt-5">
            <button
              onClick={() => void handleDelete()}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {loading ? 'Excluindo...' : 'Excluir'}
            </button>
            <div className="space-x-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => void handleSave()}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};