import jsPDF from 'jspdf';
import autoTable, { HookData } from 'jspdf-autotable';
import { AgencySettlement, DailyBreakdown } from '../services/financeApi';
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

const STYLES = {
  themeColor: '#1E40AF',
  fonts: {
    helvetica: 'helvetica',
    times: 'times'
  },
  fontSizes: {
    header: 10,
    clientName: 8,
    description: 10
  },
  colors: {
    text: {
      main: [40, 40, 40] as [number, number, number],
      light: [100, 100, 100] as [number, number, number]
    },
    background: {
      header: '#1E40AF',
      footer: '#F3F4F6'
    }
  },
  padding: {
    cell: 5,
    section: 4
  }
};

export const generateSettlementStatementPdf = (
  settlement: AgencySettlement,
  startDate: string,
  endDate: string,
  user: User | null
) => {
  const doc: jsPDFWithLastTable = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  const addHeader = () => {
    doc.setFontSize(20);
    doc.setTextColor(STYLES.themeColor);
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

  const drawDescriptionContent = (data: HookData, dayData: DailyBreakdown) => {
    if (!dayData || (!dayData.clientName && !dayData.description)) {
      return;
    }

    const { x, y, width } = data.cell;
    let currentY = y + STYLES.padding.cell;

    if (dayData.clientName) {
      doc.setFont(STYLES.fonts.helvetica, 'normal');
      doc.setFontSize(STYLES.fontSizes.clientName);
      doc.setTextColor(...STYLES.colors.text.light);
      doc.text(`Cliente: ${dayData.clientName}`, x + STYLES.padding.cell, currentY);
      currentY += doc.getLineHeight() + STYLES.padding.section;
    }

    if (dayData.description) {
      doc.setFont(STYLES.fonts.helvetica, 'normal');
      doc.setFontSize(STYLES.fontSizes.description);
      doc.setTextColor(...STYLES.colors.text.main);

      const cellContentWidth = width - (STYLES.padding.cell * 2);
      const descriptionLines = doc.splitTextToSize(dayData.description, cellContentWidth);

      descriptionLines.forEach((line: string) => {
        doc.text(line, x + STYLES.padding.cell, currentY);
        currentY += doc.getLineHeight();
      });
    }
  };

  autoTable(doc, {
    head: [['Data', 'Descrição', 'Status', 'Valor (R$)']],
    body: settlement.dailyBreakdown.map(day => [
      new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      day,
      day.isPaid ? 'Pago' : 'Pendente',
      { content: formatCurrency(day.revenue), styles: { halign: 'right' } }
    ]),
    foot: [
      [
        { content: 'Total Geral', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(totalRevenue), styles: { halign: 'right', fontStyle: 'bold' } }
      ]
    ],
    startY: tableFinalY + 30,
    theme: 'grid',
    headStyles: {
      fillColor: STYLES.colors.background.header,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: STYLES.fontSizes.header
    },
    footStyles: {
      fillColor: STYLES.colors.background.footer,
      textColor: '#111827',
      fontStyle: 'bold',
      fontSize: STYLES.fontSizes.header
    },
    styles: {
      fontSize: STYLES.fontSizes.header,
      cellPadding: STYLES.padding.cell,
      overflow: 'linebreak',
      valign: 'top'
    },
    columnStyles: {
      0: { cellWidth: 65, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 55, halign: 'center' },
      3: { cellWidth: 80, halign: 'right' },
    },

    willDrawCell: (data: HookData) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const dayData = data.row.raw[1] as DailyBreakdown;

        if (dayData) {
          doc.setFontSize(STYLES.fontSizes.description);
          const cellContentWidth = data.cell.width - (STYLES.padding.cell * 2);

          let totalHeight = STYLES.padding.cell * 2;

          if (dayData.clientName) {
            doc.setFontSize(STYLES.fontSizes.clientName);
            totalHeight += doc.getLineHeight() + STYLES.padding.section;
          }

          if (dayData.description) {
            doc.setFontSize(STYLES.fontSizes.description);
            const descriptionLines = doc.splitTextToSize(dayData.description, cellContentWidth);
            totalHeight += (descriptionLines as string[]).length * doc.getLineHeight();
          }

          data.cell.minCellHeight = Math.max(totalHeight, 40);
        }
      }
    },

    didDrawCell: (data: HookData) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const dayData = data.row.raw[1] as DailyBreakdown;
        drawDescriptionContent(data, dayData);
      }
    },

    didDrawPage: (data) => {
      addHeader();
      const pageCount = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
      addFooter(data.pageNumber, pageCount);
    },

    margin: { top: 90, bottom: 40 },
    rowPageBreak: 'avoid',
  });

  const fileName = `Fechamento_${settlement.agencyName.replace(/\s/g, '_')}_${startDate}_a_${endDate}.pdf`;
  doc.save(fileName);
};
