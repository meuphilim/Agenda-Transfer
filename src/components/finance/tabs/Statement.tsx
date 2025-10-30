import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { financeApi } from '../../../services/financeApi';
import { getCompanyProfile, CompanyProfile } from '@/services/companyProfileApi';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
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
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const profileData = await getCompanyProfile(supabase);
      setCompanyProfile(profileData);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      toast.error('Erro ao buscar dados da empresa ou do usuário.');
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

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

    const handleExportPDF = async () => {
    if (!companyProfile) {
      toast.error("Dados da empresa não carregados para gerar o PDF.");
      return;
    }

    toast.info("Gerando PDF...");

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;

      let logoBase64: string | null = null;

      // Carregar logo uma única vez
      if (companyProfile.logo_url) {
        try {
          const response = await fetch(companyProfile.logo_url);
          const blob = await response.blob();
          const reader = new FileReader();
          logoBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Erro ao carregar logo:", e);
        }
      }

      const userEmail = user?.email || 'Usuário não identificado';
      const emissionDateTime = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
      const periodText = `${format(new Date(filters.startDate), 'dd/MM/yyyy')} a ${format(new Date(filters.endDate), 'dd/MM/yyyy')}`;

      // Função para desenhar cabeçalho padronizado
      const drawHeader = (pageNum: number, totalPages: number) => {
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', margin, 10, 25, 12.5);
        }

        doc.setFontSize(14).setFont(undefined, 'bold');
        doc.text(companyProfile.name || 'Nome da Empresa', margin + 30, 15);

        doc.setFontSize(8).setFont(undefined, 'normal');
        doc.text(`CNPJ: ${companyProfile.cnpj || 'N/A'}`, margin + 30, 19);

        doc.setFontSize(7);
        doc.text(companyProfile.address || '', margin + 30, 22);

        // Linha divisória
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, 26, pageWidth - margin, 26);

        // Título do documento
        doc.setFontSize(11).setFont(undefined, 'bold');
        doc.text('EXTRATO FINANCEIRO', pageWidth / 2, 32, { align: 'center' });

        doc.setFontSize(9).setFont(undefined, 'normal');
        doc.text(`Período: ${periodText}`, pageWidth / 2, 37, { align: 'center' });

        // Info da página no cabeçalho
        doc.setFontSize(7);
        doc.text(`Pág. ${pageNum}/${totalPages}`, pageWidth - margin, 15, { align: 'right' });
        doc.text(emissionDateTime, pageWidth - margin, 19, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, 40, pageWidth - margin, 40);
      };

      // Função para desenhar rodapé padronizado
      const drawFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(7).setFont(undefined, 'italic');
        doc.text(`Emitido por: ${userEmail}`, margin, pageHeight - 10);
        doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

        doc.setFontSize(6);
        doc.text('Este documento é uma representação fiel dos registros contábeis', pageWidth / 2, pageHeight - 6, { align: 'center' });
      };

      // Buscar lançamentos futuros antes de gerar o PDF
      const { data: pendingData } = await financeApi.getPendingSettlements({
        endDate: format(new Date(), 'yyyy-MM-dd')
      });

      // Calcular total de páginas estimado
      const estimatedPages = Math.ceil(statementWithBalance.length / 25) + (pendingData && pendingData.length > 0 ? 1 : 0);

      // Primeira página - Extrato principal
      drawHeader(1, estimatedPages);

      const head = [['Data', 'Descrição', 'Débito', 'Crédito', 'Saldo']];
      const body = statementWithBalance.map(e => [
        new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        e.description,
        formatCurrency(e.debit),
        formatCurrency(e.credit),
        formatCurrency(e.balance)
      ]);

      let finalYPosition = 44;

      autoTable(doc, {
        startY: 44,
        head: head,
        body: body,
        foot: [
          [{ content: 'Saldo Anterior', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } },
           { content: formatCurrency(openingBalance), styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } }],
          [{ content: 'Saldo Final', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
           { content: formatCurrency(finalBalance), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } }]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        footStyles: {
          fontSize: 9,
          textColor: 0
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: margin, right: margin, bottom: 20 },
        didDrawPage: (data: any) => {
          const currentPage = doc.internal.pages.length -1;
          if (currentPage > 1) {
            drawHeader(currentPage, estimatedPages);
          }
          drawFooter(currentPage, estimatedPages);
          finalYPosition = data.cursor.y;
        }
      });

      // Lançamentos Futuros - verifica espaço disponível
      if (pendingData && pendingData.length > 0) {
        const pendingHead = [['Agência/Origem', 'Valor Pendente']];
        const pendingBody = pendingData.map(item => [
          item.agencyName,
          formatCurrency(item.totalValueToPay)
        ]);
        const totalPending = pendingData.reduce((sum, item) => sum + item.totalValueToPay, 0);

        // Calcula espaço necessário (cabeçalho + linhas + rodapé + margem)
        const rowHeight = 8;
        const headerHeight = 12;
        const footerHeight = 10;
        const sectionTitleHeight = 15;
        const spaceNeeded = sectionTitleHeight + headerHeight + (pendingBody.length * rowHeight) + footerHeight + 30;
        const availableSpace = pageHeight - finalYPosition - 20;

        let startYPending = finalYPosition + 12;

        // Se não houver espaço, adiciona nova página
        if (spaceNeeded > availableSpace) {
          doc.addPage();
          const currentPage = doc.internal.pages.length -1;
          drawHeader(currentPage, estimatedPages);
          startYPending = 48;
        }

        doc.setFontSize(10).setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text('LANÇAMENTOS FUTUROS - VALORES A RECEBER', pageWidth / 2, startYPending, { align: 'center' });

        autoTable(doc, {
          startY: startYPending + 6,
          head: pendingHead,
          body: pendingBody,
          foot: [
            [{ content: 'Total Pendente', styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } },
             { content: formatCurrency(totalPending), styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } }]
          ],
          theme: 'grid',
          headStyles: {
            fillColor: [192, 57, 43],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2
          },
          footStyles: {
            fontSize: 9,
            textColor: 0
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: margin, right: margin, bottom: 20 },
          didDrawPage: (data) => {
            const currentPage = doc.internal.pages.length -1;
            if (currentPage > 1 && data.pageNumber > 1) {
              drawHeader(currentPage, estimatedPages);
            }
            drawFooter(currentPage, estimatedPages);
          }
        });
      }

      // Corrigir numeração final de páginas
      const totalPages = doc.internal.pages.length -1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Limpar área do cabeçalho/rodapé anterior
        doc.setFillColor(255, 255, 255);
        doc.rect(pageWidth - margin - 30, 13, 30, 8, 'F');
        doc.rect(margin, pageHeight - 12, pageWidth - 2 * margin, 12, 'F');

        // Redesenhar com numeração correta
        doc.setFontSize(7);
        doc.setTextColor(0);
        doc.text(`Pág. ${i}/${totalPages}`, pageWidth - margin, 15, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(7).setFont(undefined, 'italic');
        doc.text(`Emitido por: ${userEmail}`, margin, pageHeight - 10);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

        doc.setFontSize(6);
        doc.text('Este documento é uma representação fiel dos registros contábeis', pageWidth / 2, pageHeight - 6, { align: 'center' });
      }

      doc.save(`extrato_${filters.startDate}_a_${filters.endDate}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  return (
    <div>
      <FinanceFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExportPDF}
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
