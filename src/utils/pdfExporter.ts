import jsPDF from 'jspdf';
import autoTable, { HookData } from 'jspdf-autotable';
import { AgencySettlement } from '../services/financeApi';
import { User } from '@supabase/supabase-js';

// Define an interface for the jsPDF instance with the autoTable plugin property
interface jsPDFWithLastTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

type DataRow = Record<string, unknown>;

export interface Column<T extends DataRow> {
  header: string;
  accessor: keyof T | ((row: T) => string | number);
}

export const exportToPdf = <T extends DataRow>(data: T[], columns: Column<T>[], title: string) => {
    const doc = new jsPDF();

    const themeColor = "#00A86B";

    // Header
    doc.setFontSize(18);
    doc.setTextColor(themeColor);
    doc.text("Bonito Ecoexpedições", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 30);

    // Table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: data.map(row =>
        columns.map(col => {
          if (typeof col.accessor === 'function') {
            return col.accessor(row);
          }
          return String(row[col.accessor] ?? '');
        })
      ),
      startY: 40,
      theme: 'grid',
      headStyles: {
        fillColor: themeColor,
        textColor: 255,
        fontStyle: 'bold',
      },
      didDrawPage: (hookData: HookData) => {
        // Footer
        const pageCount = doc.internal.pages.length -1;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${hookData.pageNumber} de ${pageCount}`,
          hookData.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save('relatorio_financeiro.pdf');
  };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const generateSettlementStatementPdf = (
  settlement: AgencySettlement,
  startDate: string,
  endDate: string,
  user: User | null
) => {
  const doc: jsPDFWithLastTable = new jsPDF('p', 'pt', 'a4');
  const themeColor = '#1E40AF';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  const addHeader = () => {
    doc.setFontSize(20);
    doc.setTextColor(themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TourManager', margin, 50);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Extrato de Fechamento com Agência', margin, 70);

    const issuedAt = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    doc.text(issuedAt, pageWidth - margin - doc.getTextWidth(issuedAt), 70);

    doc.setDrawColor(200);
    doc.line(margin, 80, pageWidth - margin, 80);
  };

  const addFooter = (pageNumber: number, pageCount: number) => {
    const userEmail = user?.email ?? 'N/A';
    const footerText = `Relatório gerado por: ${userEmail}`;
    const pageStr = `Página ${pageNumber} de ${pageCount}`;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(footerText, margin, doc.internal.pageSize.getHeight() - 20);
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), doc.internal.pageSize.getHeight() - 20);
  };

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40);
  doc.text('Informações do Fechamento', margin, 110);

  autoTable(doc, {
    body: [
      ['Agência:', settlement.agencyName],
      ['Período:', `${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`],
    ],
    startY: 120,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
  });

  const finalY = doc.lastAutoTable?.finalY ?? 0;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40);
  doc.text('Resumo Financeiro', margin, finalY + 30);

  const totalGeral = settlement.totalValuePaid + settlement.totalValueToPay;
  autoTable(doc, {
    body: [
      ['Valor Total Pago no Período:', formatCurrency(settlement.totalValuePaid)],
      ['Valor Total Pendente no Período:', formatCurrency(settlement.totalValueToPay)],
      ['Valor Geral do Extrato:', formatCurrency(totalGeral)],
    ],
    startY: finalY + 40,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 200 },
      1: { halign: 'right' }
    },
  });

  const tableFinalY = doc.lastAutoTable?.finalY ?? 0;
  const totalRevenue = settlement.dailyBreakdown.reduce((sum, day) => sum + day.revenue, 0);

  autoTable(doc, {
    head: [['Data', 'Descrição', 'Status', 'Valor (R$)']],
    body: settlement.dailyBreakdown.map(day => [
      new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      '', // Placeholder for custom rendering
      day.isPaid ? 'Pago' : 'Pendente',
      { content: formatCurrency(day.revenue), styles: { halign: 'right' } }
    ]),
    foot: [
      [{ content: 'Total Geral', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
       { content: formatCurrency(totalRevenue), styles: { halign: 'right', fontStyle: 'bold' } }]
    ],
    startY: tableFinalY + 30,
    theme: 'grid',
    headStyles: { fillColor: themeColor, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: '#F3F4F6', textColor: '#111827', fontStyle: 'bold' },
    columnStyles: {
        0: { cellWidth: 65, halign: 'center' }, // Data
        1: { cellWidth: 'auto' }, // Descrição
        2: { cellWidth: 55, halign: 'center' }, // Status
        3: { cellWidth: 80, halign: 'right' },  // Valor (R$)
    },
    willDrawCell: (data) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const rowIndex = data.row.index;
        const dayData = settlement.dailyBreakdown[rowIndex];

        if (dayData && dayData.clientName && dayData.description) {
          const cellWidth = data.cell.width - 10;
          const descriptionLines = doc.splitTextToSize(dayData.description, cellWidth) as string[];

          // Height = padding-top + client + spacing + description + padding-bottom
          const calculatedHeight = 10 + 12 + 12 + (descriptionLines.length * 12) + 8;
          data.cell.minCellHeight = calculatedHeight;
        }
      }
    },
    didDrawCell: (data) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const rowIndex = data.row.index;
        const dayData = settlement.dailyBreakdown[rowIndex];

        if (dayData && dayData.clientName && dayData.description) {
          const x = data.cell.x + 5;
          let y = data.cell.y + 12;
          const cellWidth = data.cell.width - 10;

          // Draw Client Name
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.setFont('helvetica', 'normal');
          doc.text(`Cliente: ${dayData.clientName}`, x, y);
          y += 12;

          // Draw Description with text wrapping
          doc.setFontSize(10);
          doc.setTextColor(40);
          doc.setFont('helvetica', 'normal');
          const descriptionLines = doc.splitTextToSize(dayData.description, cellWidth);
          doc.text(descriptionLines, x, y);
        }
      }
    },
    didDrawPage: (data) => {
      addHeader();
      // The type definitions for jspdf's internal properties are not complete.
      // Using a type assertion to safely access the page count.
      const pageCount = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
      addFooter(data.pageNumber, pageCount);
    },
    margin: { top: 90, bottom: 40 },
    rowPageBreak: 'avoid',
  });

  const fileName = `Fechamento_${settlement.agencyName.replace(/\s/g, '_')}_${startDate}_a_${endDate}.pdf`;
  doc.save(fileName);
};
