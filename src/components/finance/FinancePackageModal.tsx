import { Modal } from '../Common';
import { PackageWithRelations, DailyBreakdown } from '../../../services/financeApi';
import { Calendar, User, Truck, Briefcase } from 'lucide-react';

interface FinancePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PackageWithRelations | null;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

const PackageHeader: React.FC<{ pkg: PackageWithRelations }> = ({ pkg }) => (
  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 mb-4">
    <h3 className="text-xl font-bold text-blue-900 mb-2">{pkg.title}</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <User size={14} className="text-blue-600" />
        <span><strong>Cliente:</strong> {pkg.client_name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Briefcase size={14} className="text-blue-600" />
        <span><strong>Agência:</strong> {pkg.agencies?.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <User size={14} className="text-blue-600" />
        <span><strong>Motorista:</strong> {pkg.drivers?.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Truck size={14} className="text-blue-600" />
        <span><strong>Veículo:</strong> {pkg.vehicles?.license_plate}</span>
      </div>
    </div>
    {pkg.is_partial && (
      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
        ⚠️ <strong>Relatório Parcial:</strong> {pkg.dias_no_periodo} dia(s) no período de {pkg.dias_no_periodo + pkg.dias_fora_periodo} dia(s) totais do pacote
      </div>
    )}
  </div>
);

const FinancialSummary: React.FC<{ pkg: PackageWithRelations }> = ({ pkg }) => (
  <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg mb-6">
    <h4 className="font-bold text-lg mb-3 text-center">📊 Resumo Financeiro do Período</h4>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-sm text-gray-600">Receita Total</p>
        <p className="text-xl font-bold text-green-700">{formatCurrency(pkg.valor_receita_total)}</p>
        <div className="text-xs text-gray-500 mt-1">
          <p>Diárias: {formatCurrency(pkg.valor_diaria_servico_calculado)}</p>
          <p>NET: {formatCurrency(pkg.valor_net_receita)}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600">Custo Total</p>
        <p className="text-xl font-bold text-red-700">{formatCurrency(pkg.valor_custo_total)}</p>
        <div className="text-xs text-gray-500 mt-1">
          <p>Motorista: {formatCurrency(pkg.valor_diaria_motorista_calculado)}</p>
          <p>Veículo: {formatCurrency(pkg.valor_despesas_veiculo)}</p>
        </div>
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

const DailyReport: React.FC<{ day: DailyBreakdown; pax: number }> = ({ day, pax }) => (
  <div className="border rounded-lg overflow-hidden mb-4 bg-white shadow-sm">
    <div className="bg-blue-600 text-white p-3 font-bold">
      <Calendar size={16} className="inline mr-2" />
      {formatDate(day.date)}
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Hora</th>
            <th className="px-4 py-2 text-left">Serviço Executado</th>
            <th className="px-4 py-2 text-center">Pax</th>
            <th className="px-4 py-2 text-right">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          {/* Diária de Serviço */}
          {day.hasDailyServiceRate && (
            <tr className="border-t">
              <td className="px-4 py-3 text-gray-600">
                {day.netActivities.length > 0 ? day.netActivities[0].startTime.slice(0, 5) : '-'}
              </td>
              <td className="px-4 py-3">
                <strong>PRIVATIVO - DIÁRIA DE PASSEIOS</strong>
                <div className="text-xs text-gray-600 mt-1">
                  Atrativos: {day.netActivities.map(a => a.attractionName).join(', ') || 'Nenhum atrativo com NET'}
                </div>
              </td>
              <td className="px-4 py-3 text-center font-semibold">{pax}</td>
              <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(day.dailyServiceRateAmount)}</td>
            </tr>
          )}

          {/* Valores NET */}
          {day.netActivities.map((act, idx) => (
            <tr key={idx} className="border-t bg-green-50">
              <td className="px-4 py-2 text-gray-600">{act.startTime.slice(0, 5)}</td>
              <td className="px-4 py-2 text-xs">
                <span className="font-medium">Valor NET:</span> {act.attractionName}
              </td>
              <td className="px-4 py-2 text-center">-</td>
              <td className="px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(act.netValue)}</td>
            </tr>
          ))}

          {/* Custos do Motorista */}
          {day.hasDriverDailyCost && (
            <tr className="border-t bg-red-50">
              <td className="px-4 py-2 text-gray-600">-</td>
              <td className="px-4 py-2 text-xs"><span className="font-medium">Custo:</span> Diária do Motorista</td>
              <td className="px-4 py-2 text-center">-</td>
              <td className="px-4 py-2 text-right font-semibold text-red-600">-{formatCurrency(day.driverDailyCostAmount)}</td>
            </tr>
          )}

          {/* Despesas de Veículo */}
          {day.vehicleExpenses.map((exp, idx) => (
            <tr key={`exp-${idx}`} className="border-t bg-red-50">
              <td className="px-4 py-2 text-gray-600">-</td>
              <td className="px-4 py-2 text-xs">
                <span className="font-medium">Custo:</span> {exp.description} <span className="text-gray-500">({exp.category})</span>
              </td>
              <td className="px-4 py-2 text-center">-</td>
              <td className="px-4 py-2 text-right font-semibold text-red-600">-{formatCurrency(exp.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-gray-100 p-3 grid grid-cols-3 gap-4 text-sm border-t">
      <div>
        <p className="text-gray-600">Receita do Dia:</p>
        <p className="font-bold text-green-700">{formatCurrency(day.dailyRevenue)}</p>
      </div>
      <div>
        <p className="text-gray-600">Custo do Dia:</p>
        <p className="font-bold text-red-700">{formatCurrency(day.dailyCost)}</p>
      </div>
      <div>
        <p className="text-gray-600">Margem do Dia:</p>
        <p className={`font-bold ${day.dailyMargin >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
          {formatCurrency(day.dailyMargin)}
          {day.dailyMargin < 0 && ' ⚠️'}
        </p>
      </div>
    </div>
  </div>
);

const TotalsTable: React.FC<{ breakdown: DailyBreakdown[] }> = ({ breakdown }) => (
  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
    <div className="bg-gray-700 text-white p-3 font-bold">
      📈 Totais por Data
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-right">Receita (R$)</th>
            <th className="px-4 py-2 text-right">Custos (R$)</th>
            <th className="px-4 py-2 text-right">Margem (R$)</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((day, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(day.dailyRevenue)}</td>
              <td className="px-4 py-2 text-right font-semibold text-red-600">{formatCurrency(day.dailyCost)}</td>
              <td className={`px-4 py-2 text-right font-semibold ${day.dailyMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(day.dailyMargin)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 bg-gray-100 font-bold">
            <td className="px-4 py-3">TOTAL GERAL</td>
            <td className="px-4 py-3 text-right text-green-700">
              {formatCurrency(breakdown.reduce((sum, d) => sum + d.dailyRevenue, 0))}
            </td>
            <td className="px-4 py-3 text-right text-red-700">
              {formatCurrency(breakdown.reduce((sum, d) => sum + d.dailyCost, 0))}
            </td>
            <td className="px-4 py-3 text-right text-purple-700">
              {formatCurrency(breakdown.reduce((sum, d) => sum + d.dailyMargin, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const FinancePackageModal: React.FC<FinancePackageModalProps> = ({ isOpen, onClose, pkg }) => {
  if (!isOpen || !pkg) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relatório Financeiro Detalhado" size="4xl">
      <div className="max-h-[80vh] overflow-y-auto p-1">
        <PackageHeader pkg={pkg} />
        <FinancialSummary pkg={pkg} />

        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-bold">📋 Detalhamento Diário</h4>
          {pkg.dailyBreakdown.map((day, idx) => (
            <DailyReport key={idx} day={day} pax={pkg.total_participants} />
          ))}
        </div>

        <TotalsTable breakdown={pkg.dailyBreakdown} />
      </div>

      <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
          Fechar
        </button>
      </div>
    </Modal>
  );
};
