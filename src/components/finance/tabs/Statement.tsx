import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { financeApi } from '../../../services/financeApi';
import { FinanceFilters, FinanceFiltersState } from '../FinanceFilters';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface StatementEntry {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  type: 'revenue' | 'expense';
}

const getInitialFilters = (): FinanceFiltersState => {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    status: 'all',
    agencyId: 'all',
    searchTerm: '',
  };
};

export const Statement: React.FC = () => {
  const [entries, setEntries] = useState<StatementEntry[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FinanceFiltersState>(getInitialFilters());

  const fetchStatementData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await financeApi.getFinancialStatement(filters);
      if (error) throw new Error(error.message);
      if (data) {
        setEntries(data.entries);
        setOpeningBalance(data.openingBalance);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar extrato: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.searchTerm]);

  useEffect(() => {
    void fetchStatementData();
  }, [fetchStatementData]);

  const { statementWithBalance, finalBalance } = useMemo(() => {
    let balance = openingBalance;
    const statementWithBalance = entries.map(entry => {
      balance += (entry.credit ?? 0) - (entry.debit ?? 0);
      return { ...entry, balance };
    });
    return { statementWithBalance, finalBalance: balance };
  }, [entries, openingBalance]);

  const formatCurrency = (value: number | null) =>
    value !== null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  return (
    <div>
      <FinanceFilters
        filters={filters}
        onFilterChange={setFilters}
        agencies={[]}
        hideStatusFilter
        hideAgencyFilter
      />

      {/* Summary Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 font-semibold">Total Débitos</p>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(entries.reduce((sum, e) => sum + (e.debit || 0), 0))}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-semibold">Total Créditos</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(entries.reduce((sum, e) => sum + (e.credit || 0), 0))}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-semibold">Saldo Final</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(finalBalance)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Data</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Descrição</th>
              <th className="text-right py-3 px-4 font-semibold text-sm text-red-600">Débito</th>
              <th className="text-right py-3 px-4 font-semibold text-sm text-green-600">Crédito</th>
              <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">Carregando...</td>
              </tr>
            ) : (
              <>
                <tr className="border-b bg-gray-50">
                  <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-gray-700">SALDO ANTERIOR</td>
                  <td className={`py-3 px-4 text-sm text-right font-mono font-semibold ${openingBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {formatCurrency(openingBalance)}
                  </td>
                </tr>
                {statementWithBalance.map((entry, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td className="py-3 px-4 text-sm">{entry.description}</td>
                    <td className="py-3 px-4 text-sm text-right text-red-500 font-mono">{formatCurrency(entry.debit)}</td>
                    <td className="py-3 px-4 text-sm text-right text-green-500 font-mono">{formatCurrency(entry.credit)}</td>
                    <td className={`py-3 px-4 text-sm text-right font-mono ${entry.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={4} className="text-right py-3 px-4 text-sm">SALDO FINAL</td>
              <td className={`py-3 px-4 text-right text-sm font-mono ${finalBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {formatCurrency(finalBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
