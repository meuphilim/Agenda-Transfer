import jsPDF from 'jspdf';
import autoTable, { HookData, UserOptions } from 'jspdf-autotable';
import { AgencySettlement } from '../services/financeApi';
import { User } from '@supabase/supabase-js';

// Define an interface for the jsPDF instance with the autoTable plugin property
interface jsPDFWithLastTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

// Centralized Style Constants for easy maintenance and consistency
const pdfStyles = {
  colors: {
    primary: '#1E40AF',
    primary_green: "#00A86B",
    text_primary: '#111827',
    text_secondary: '#6B7280',
    text_light: '#FFFFFF',
    text_subtle: '#9CA3AF',
    divider: '#E5E7EB',
    background_light: '#F3F4F6',
  },
  font: {
    family: 'helvetica',
    style_bold: 'bold',
    style_normal: 'normal',
    size_h1: 20,
    size_h2: 18,
    size_h3: 12,
    size_body: 10,
    size_small: 9,
    size_xsmall: 8,
  },
  margin: {
    default: 40,
  },
  spacing: {
    line_sm: 10,
    line_md: 20,
    line_lg: 30,
  },
  table: {
    theme_grid: 'grid',
    theme_plain: 'plain',
    valign_top: 'top',
    halign_right: 'right',
    halign_center: 'center',
  }
};

/**
 * PDFBuilder Class
 * Encapsulates jsPDF and jspdf-autotable logic to provide a clean, reusable
 * interface for building standardized PDF reports.
 */
class PDFBuilder {
    private doc: jsPDFWithLastTable;
    private user: User | null;
    private lastY: number;
    private pageWidth: number;

    constructor(user: User | null) {
      this.doc = new jsPDF('p', 'pt', 'a4');
      this.user = user;
      this.pageWidth = this.doc.internal.pageSize.getWidth();
      this.lastY = pdfStyles.margin.default;
    }

    /**
     * Adds the main header to every page. This is typically called
     * from within the didDrawPage hook of a table.
     */
    private addHeader() {
        this.doc.setFontSize(pdfStyles.font.size_h1);
        this.doc.setTextColor(pdfStyles.colors.primary);
        this.doc.setFont(pdfStyles.font.family, pdfStyles.font.style_bold);
        this.doc.text('TourManager', pdfStyles.margin.default, 50);

        this.doc.setFontSize(pdfStyles.font.size_body);
        this.doc.setTextColor(pdfStyles.colors.text_secondary);
        this.doc.setFont(pdfStyles.font.family, pdfStyles.font.style_normal);
        this.doc.text('Extrato de Fechamento com Agência', pdfStyles.margin.default, 70);

        const issuedAt = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
        this.doc.text(issuedAt, this.pageWidth - pdfStyles.margin.default - this.doc.getTextWidth(issuedAt), 70);

        this.doc.setDrawColor(pdfStyles.colors.divider);
        this.doc.line(pdfStyles.margin.default, 80, this.pageWidth - pdfStyles.margin.default, 80);
    }

    /**
     * Adds the main footer to every page, including pagination.
     */
    private addFooter(pageNumber: number, pageCount: number) {
        const userEmail = this.user?.email ?? 'N/A';
        const footerText = `Relatório gerado por: ${userEmail}`;
        const pageStr = `Página ${pageNumber} de ${pageCount}`;

        this.doc.setFontSize(pdfStyles.font.size_xsmall);
        this.doc.setTextColor(pdfStyles.colors.text_subtle);
        this.doc.text(footerText, pdfStyles.margin.default, this.doc.internal.pageSize.getHeight() - pdfStyles.spacing.line_md);
        this.doc.text(pageStr, this.pageWidth - pdfStyles.margin.default - this.doc.getTextWidth(pageStr), this.doc.internal.pageSize.getHeight() - pdfStyles.spacing.line_md);
    }

    /**
     * Adds a styled title section, updating the Y position.
     */
    addTitle(title: string, yPos?: number) {
        this.lastY = yPos ?? this.lastY + pdfStyles.spacing.line_lg;
        this.doc.setFontSize(pdfStyles.font.size_h3);
        this.doc.setFont(pdfStyles.font.family, pdfStyles.font.style_bold);
        this.doc.setTextColor(pdfStyles.colors.text_primary);
        this.doc.text(title, pdfStyles.margin.default, this.lastY);
        this.lastY += pdfStyles.spacing.line_sm;
        return this; // Enable method chaining
    }

    /**
     * Adds a table using jspdf-autotable. It automatically handles headers,
     * footers, and updates the Y position.
     */
    addTable(options: UserOptions) {
        autoTable(this.doc, {
            ...options,
            startY: this.lastY, // Use the managed Y position
            didDrawPage: (data) => {
                this.addHeader();
                const pageCount = (this.doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
                this.addFooter(data.pageNumber, pageCount);
            },
        });
        this.lastY = this.doc.lastAutoTable?.finalY ?? this.lastY;
        return this; // Enable method chaining
    }

    /**
     * Saves the generated PDF with the given filename.
     */
    save(fileName: string) {
        this.doc.save(fileName);
    }
  }

// --- DEPRECATED/UNUSED FUNCTION ---
// NOTE: This function seems to be a generic exporter but is not used by the main settlement PDF.
// It is maintained for now but could be refactored to use PDFBuilder or removed if confirmed as dead code.
type DataRow = Record<string, unknown>;
export interface Column<T extends DataRow> {
  header: string;
  accessor: keyof T | ((row: T) => string | number);
}
export const exportToPdf = <T extends DataRow>(data: T[], columns: Column<T>[], title: string) => {
    // This implementation remains untouched as its usage is unclear.
    const doc = new jsPDF();
    doc.setFontSize(pdfStyles.font.size_h2);
    doc.setTextColor(pdfStyles.colors.primary_green);
    doc.text("Bonito Ecoexpedições", 14, 22);
    doc.setFontSize(pdfStyles.font.size_h3);
    doc.setTextColor(100);
    doc.text(title, 14, 30);
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
      theme: pdfStyles.table.theme_grid,
      headStyles: {
        fillColor: pdfStyles.colors.primary_green,
        textColor: pdfStyles.colors.text_light,
        fontStyle: pdfStyles.font.style_bold,
      },
      didDrawPage: (hookData: HookData) => {
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(pdfStyles.font.size_xsmall);
        doc.setTextColor(pdfStyles.colors.text_subtle);
        doc.text(
          `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${hookData.pageNumber} de ${pageCount}`,
          hookData.settings.margin.left,
          doc.internal.pageSize.height - pdfStyles.spacing.line_sm
        );
      }
    });
    doc.save('relatorio_financeiro.pdf');
  };
// --- END DEPRECATED FUNCTION ---

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Generates the Agency Settlement Statement PDF.
 * This function now acts as an orchestrator, using the PDFBuilder to construct the document.
 */
export const generateSettlementStatementPdf = (
  settlement: AgencySettlement,
  startDate: string,
  endDate: string,
  user: User | null
) => {

  const pdf = new PDFBuilder(user);

  // Section 1: Settlement Information
  pdf.addTitle('Informações do Fechamento', 110)
     .addTable({
        body: [
            ['Agência:', settlement.agencyName],
            ['Período:', `${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`],
        ],
        theme: pdfStyles.table.theme_plain,
        styles: { fontSize: pdfStyles.font.size_body },
        columnStyles: { 0: { fontStyle: pdfStyles.font.style_bold, cellWidth: 80 } },
    });

  // Section 2: Financial Summary
  const totalGeral = settlement.totalValuePaid + settlement.totalValueToPay;
  pdf.addTitle('Resumo Financeiro')
     .addTable({
        body: [
            ['Valor Total Pago no Período:', formatCurrency(settlement.totalValuePaid)],
            ['Valor Total Pendente no Período:', formatCurrency(settlement.totalValueToPay)],
            ['Valor Geral do Extrato:', formatCurrency(totalGeral)],
        ],
        theme: pdfStyles.table.theme_plain,
        styles: { fontSize: pdfStyles.font.size_body },
        columnStyles: {
            0: { fontStyle: pdfStyles.font.style_bold, cellWidth: 200 },
            1: { halign: pdfStyles.table.halign_right }
        },
    });

  // Section 3: Detailed Breakdown Table
  const totalRevenue = settlement.dailyBreakdown.reduce((sum, day) => sum + day.revenue, 0);
  pdf.addTitle('Detalhamento')
     .addTable({
        head: [['Data', 'Descrição', 'Status', 'Valor (R$)']],
        body: [
            ...settlement.dailyBreakdown.map(day => [
                new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR'),
                '', // Custom content is rendered via didDrawCell hook
                day.isPaid ? 'Pago' : 'Pendente',
                { content: formatCurrency(day.revenue), styles: { halign: pdfStyles.table.halign_right } }
            ]),
            // The grand total row is the last row in the body
            [
                { content: 'Total Geral', colSpan: 3, styles: { halign: pdfStyles.table.halign_right, fontStyle: pdfStyles.font.style_bold, fillColor: pdfStyles.colors.background_light, textColor: pdfStyles.colors.text_primary } },
                { content: formatCurrency(totalRevenue), styles: { halign: pdfStyles.table.halign_right, fontStyle: pdfStyles.font.style_bold, fillColor: pdfStyles.colors.background_light, textColor: pdfStyles.colors.text_primary } }
            ]
        ],
        theme: pdfStyles.table.theme_grid,
        headStyles: { fillColor: pdfStyles.colors.primary, textColor: pdfStyles.colors.text_light, fontStyle: pdfStyles.font.style_bold, fontSize: pdfStyles.font.size_body },
        styles: { fontSize: pdfStyles.font.size_body, cellPadding: 5, overflow: 'linebreak', valign: pdfStyles.table.valign_top },
        columnStyles: {
            0: { cellWidth: 65, halign: pdfStyles.table.halign_center },
            1: { cellWidth: 'auto', minCellHeight: 45 },
            2: { cellWidth: 55, halign: pdfStyles.table.halign_center },
            3: { cellWidth: 80, halign: pdfStyles.table.halign_right },
        },
        margin: { top: 90, bottom: pdfStyles.margin.default },
        rowPageBreak: 'avoid',

        // Hooks for custom cell rendering
        willDrawCell: (data) => {
            const doc = data.doc as jsPDF;
            if (data.column.index === 1 && data.cell.section === 'body' && data.row.index < settlement.dailyBreakdown.length) {
                const dayData = settlement.dailyBreakdown[data.row.index];
                if (dayData?.description) {
                    const cellWidth = data.cell.width - 10;
                    const descriptionLines = doc.splitTextToSize(dayData.description, cellWidth);
                    const descriptionHeight = (descriptionLines as string[]).length * 14;
                    data.cell.minCellHeight = Math.max(8 + 10 + 4 + descriptionHeight + 8, 40);
                }
            }
        },
        didDrawCell: (data) => {
            const doc = data.doc as jsPDF;
            if (data.column.index === 1 && data.cell.section === 'body' && data.row.index < settlement.dailyBreakdown.length) {
                const dayData = settlement.dailyBreakdown[data.row.index];
                if (dayData?.clientName && dayData?.description) {
                    const x = data.cell.x + 5;
                    let y = data.cell.y + 10;
                    const cellWidth = data.cell.width - 10;

                    // Client Name
                    doc.setFontSize(pdfStyles.font.size_xsmall);
                    doc.setTextColor(pdfStyles.colors.text_secondary);
                    doc.setFont(pdfStyles.font.family, pdfStyles.font.style_normal);
                    doc.text(`Cliente: ${dayData.clientName}`, x, y);
                    y += 14;

                    // Description
                    doc.setFontSize(pdfStyles.font.size_small);
                    doc.setTextColor(pdfStyles.colors.text_primary);
                    doc.setFont(pdfStyles.font.family, pdfStyles.font.style_normal);
                    const descriptionLines = doc.splitTextToSize(dayData.description, cellWidth);
                    (descriptionLines as string[]).forEach((line: string) => {
                        doc.text(line, x, y);
                        y += 14;
                    });
                }
            }
        },
    });

  const fileName = `Fechamento_${settlement.agencyName.replace(/\s/g, '_')}_${startDate}_a_${endDate}.pdf`;
  pdf.save(fileName);
};
