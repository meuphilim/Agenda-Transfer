import { Modal } from '../Common';
import { PackageWithRelations } from '../../services/financeApi';
import { X } from 'lucide-react';

interface FinancePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PackageWithRelations | null;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const FinancialSummary: React.FC<{ pkg: PackageWithRelations }> = ({ pkg }) => (
  <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
    <h4 className="font-bold text-lg mb-3 text-center">📊 Resumo do Pacote</h4>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-sm text-gray-600">Receita Total</p>
        <p className="text-xl font-bold text-green-700">{formatCurrency(pkg.valor_receita_total)}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Custo Total</p>
        <p className="text-xl font-bold text-red-700">{formatCurrency(pkg.valor_custo_total)}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Margem Bruta</p>
        <p className={`text-xl font-bold ${pkg.valor_margem_bruta >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
          {formatCurrency(pkg.valor_margem_bruta)}
          <span className="text-sm ml-1">({pkg.percentual_margem.toFixed(1)}%)</span>
        </p>
      </div>
    </div>
  </div>
);

const DailyBreakdown: React.FC<{ breakdown: any[] }> = ({ breakdown }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-bold">Detalhamento Financeiro - Dia a Dia</h3>
    {breakdown.map((day) => (
      <div key={day.date} className="border rounded-lg p-4 bg-white shadow-sm">
        <h4 className="font-semibold mb-2 text-gray-800">
          📅 {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Receitas */}
          <div className="bg-green-50 p-3 rounded-md border border-green-200">
            <p className="font-medium text-green-800 mb-2">💰 Receitas</p>
            {day.hasDailyServiceRate && <p className="text-green-700">Diária Serviço: {formatCurrency(day.dailyServiceRateAmount)}</p>}
            {day.netActivities.map((act: any, idx: number) => (
              <p key={idx} className="text-green-600 text-xs">{act.attractionName}: {formatCurrency(act.netValue)}</p>
            ))}
            <p className="font-bold text-green-900 mt-2 pt-2 border-t border-green-200">Total: {formatCurrency(day.dailyRevenue)}</p>
          </div>
          {/* Custos */}
          <div className="bg-red-50 p-3 rounded-md border border-red-200">
            <p className="font-medium text-red-800 mb-2">💸 Custos</p>
            {day.hasDriverDailyCost && <p className="text-red-700">Diária Motorista: {formatCurrency(day.driverDailyCostAmount)}</p>}
            {day.vehicleExpenses.length > 0 && (
              <div className="mt-1">
                <p className="text-red-700 text-xs font-medium mb-1">Despesas Veículo:</p>
                {day.vehicleExpenses.map((exp: any, idx: number) => (
                  <p key={idx} className="text-red-600 text-xs ml-2">• {exp.description}: {formatCurrency(exp.amount)}</p>
                ))}
              </div>
            )}
            <p className="font-bold text-red-900 mt-2 pt-2 border-t border-red-200">Total: {formatCurrency(day.dailyCost)}</p>
          </div>
        </div>
        {/* Margem do Dia */}
        <div className={`mt-3 p-2 rounded text-center font-bold text-sm ${day.dailyMargin >= 0 ? 'bg-purple-100 text-purple-900' : 'bg-red-100 text-red-900'}`}>
          Margem do Dia: {formatCurrency(day.dailyMargin)}
          {day.dailyRevenue > 0 && ` (${((day.dailyMargin / day.dailyRevenue) * 100).toFixed(1)}%)`}
          {day.dailyMargin < 0 && ' ⚠️'}
        </div>
      </div>
    ))}
  </div>
);

export const FinancePackageModal: React.FC<FinancePackageModalProps> = ({ isOpen, onClose, pkg }) => {
  if (!isOpen || !pkg) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes Financeiros: ${pkg.title}`} size="3xl">
       <div className="p-1 max-h-[80vh] overflow-y-auto">
        <FinancialSummary pkg={pkg} />
        <div className="mt-6">
          <DailyBreakdown breakdown={(pkg as any).dailyBreakdown} />
        </div>
       </div>
       <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Fechar
          </button>
        </div>
    </Modal>
  );
};