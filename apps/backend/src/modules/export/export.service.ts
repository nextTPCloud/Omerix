import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

/**
 * ============================================
 * EXPORT SERVICE
 * ============================================
 * Servicio genérico para exportar datos en múltiples formatos
 */

interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  format?: (value: any) => string;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  stats?: { label: string; value: string | number }[];
  columns: ExportColumn[];
  data: any[];
  includeStats?: boolean;
}

class ExportService {
  /**
   * Exportar a CSV
   */
  async exportToCSV(options: ExportOptions): Promise<string> {
    const { columns, data } = options;

    // Headers
    const headers = columns.map((col) => col.label).join(',');

    // Rows
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          let value = item[col.key];
          
          // Aplicar formato si existe
          if (col.format && value !== null && value !== undefined) {
            value = col.format(value);
          }
          
          // Escape commas and quotes
          if (value === null || value === undefined) {
            return '';
          }
          
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Exportar a Excel con estilo profesional
   */
  async exportToExcel(options: ExportOptions, res: Response): Promise<void> {
    const {
      filename,
      sheetName = 'Datos',
      title,
      subtitle,
      stats,
      columns,
      data,
      includeStats = true,
    } = options;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    let currentRow = 1;

    // ===================================
    // TÍTULO Y SUBTÍTULO
    // ===================================
    if (title) {
      worksheet.mergeCells(`A${currentRow}:${this.getColumnLetter(columns.length)}${currentRow}`);
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = title;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 30;
      currentRow += 1;
    }

    if (subtitle) {
      worksheet.mergeCells(`A${currentRow}:${this.getColumnLetter(columns.length)}${currentRow}`);
      const subtitleCell = worksheet.getCell(`A${currentRow}`);
      subtitleCell.value = subtitle;
      subtitleCell.font = { size: 12, color: { argb: 'FF6B7280' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 20;
      currentRow += 2;
    }

    // ===================================
    // ESTADÍSTICAS (OPCIONAL)
    // ===================================
    if (includeStats && stats && stats.length > 0) {
      const statsPerRow = 4;
      const statsRows = Math.ceil(stats.length / statsPerRow);

      for (let i = 0; i < statsRows; i++) {
        const rowStats = stats.slice(i * statsPerRow, (i + 1) * statsPerRow);
        
        rowStats.forEach((stat, index) => {
          const colStart = index * 2 + 1;
          const colEnd = colStart + 1;
          
          // Merge cells para cada estadística
          worksheet.mergeCells(currentRow, colStart, currentRow, colEnd);
          const cell = worksheet.getCell(currentRow, colStart);
          cell.value = `${stat.label}: ${stat.value}`;
          cell.font = { size: 10, bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        
        worksheet.getRow(currentRow).height = 25;
        currentRow += 1;
      }
      
      currentRow += 1;
    }

    // ===================================
    // HEADERS DE TABLA
    // ===================================
    columns.forEach((col, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = col.label;
      cell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF2563EB' } },
        left: { style: 'thin', color: { argb: 'FF2563EB' } },
        bottom: { style: 'thin', color: { argb: 'FF2563EB' } },
        right: { style: 'thin', color: { argb: 'FF2563EB' } },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    worksheet.getRow(currentRow).height = 25;
    currentRow += 1;

    // ===================================
    // DATOS
    // ===================================
    data.forEach((item, rowIndex) => {
      columns.forEach((col, colIndex) => {
        let value = item[col.key];
        
        // Aplicar formato si existe
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }
        
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        
        // Alternar colores de fila
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
      });
      
      worksheet.getRow(currentRow).height = 20;
      currentRow += 1;
    });

    // ===================================
    // AJUSTAR ANCHOS DE COLUMNA
    // ===================================
    columns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = col.width || 20;
    });

    // ===================================
    // ENVIAR RESPUESTA
    // ===================================
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

    await workbook.xlsx.write(res);
  }

  /**
   * Exportar a PDF
   */
  async exportToPDF(options: ExportOptions, res: Response): Promise<void> {
    const {
      filename,
      title,
      subtitle,
      stats,
      columns,
      data,
      includeStats = true,
    } = options;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

    doc.pipe(res);

    // ===================================
    // TÍTULO
    // ===================================
    if (title) {
      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(0.5);
    }

    if (subtitle) {
      doc.fontSize(12).font('Helvetica').fillColor('#666').text(subtitle, { align: 'center' });
      doc.fillColor('#000');
      doc.moveDown(1);
    }

    // ===================================
    // ESTADÍSTICAS
    // ===================================
    if (includeStats && stats && stats.length > 0) {
      const startY = doc.y;
      const boxWidth = (doc.page.width - 100) / 4;
      
      stats.forEach((stat, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = 50 + col * boxWidth;
        const y = startY + row * 40;
        
        doc.rect(x, y, boxWidth - 10, 30).fillAndStroke('#F3F4F6', '#D1D5DB');
        doc.fillColor('#000').fontSize(8).text(stat.label, x + 5, y + 8, {
          width: boxWidth - 20,
          align: 'center',
        });
        doc.fontSize(10).font('Helvetica-Bold').text(String(stat.value), x + 5, y + 18, {
          width: boxWidth - 20,
          align: 'center',
        });
      });
      
      doc.moveDown(3);
    }

    // ===================================
    // TABLA (simplificada para PDF)
    // ===================================
    doc.fontSize(10).font('Helvetica');
    
    // Esta es una versión simplificada
    // Para tablas complejas en PDF, considera usar una librería como pdfkit-table
    
    doc.text('Ver archivo Excel para datos completos', { align: 'center' });
    doc.moveDown();
    doc.fontSize(8).text(`Total de registros: ${data.length}`, { align: 'center' });

    doc.end();
  }

  /**
   * Utilidad para convertir número de columna a letra (A, B, C, ...)
   */
  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }
}

export default new ExportService();