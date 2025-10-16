import jsPDF from 'jspdf';
import autoTable, { HookData } from 'jspdf-autotable';

interface Column {
  header: string;
  accessor: string | ((row: any) => string | number);
}

export const exportToPdf = (data: any[], columns: Column[]) => {
  const doc = new jsPDF();

  const themeColor = "#00A86B";

  // Header
  doc.setFontSize(18);
  doc.setTextColor(themeColor);
  doc.text("Bonito Ecoexpedições", 14, 22);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Relatório Financeiro de Pacotes", 14, 30);

  // Table
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row =>
      columns.map(col => {
        if (typeof col.accessor === 'function') {
          return col.accessor(row);
        }
        return row[col.accessor];
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