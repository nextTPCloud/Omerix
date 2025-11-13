import { Request, Response } from 'express';
import ExportService from '@//modules/export/export.service';
/**
 * ============================================
 * EXPORT CONTROLLER
 * ============================================
 */

class ExportController {
  /**
   * @route   POST /api/export/excel
   * @desc    Exportar datos a Excel con formato profesional
   * @access  Private
   */
  async exportExcel(req: Request, res: Response): Promise<void> {
    try {
      const options = req.body;

      // Validar que tenemos los datos mínimos
      if (!options.filename || !options.columns || !options.data) {
        res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos',
          errors: [
            { 
              field: 'general', 
              message: 'Se requieren: filename, columns y data' 
            }
          ],
        });
        return;
      }

      // Log para debugging
      console.log(`📊 Exportando Excel: ${options.filename}.xlsx (${options.data.length} registros)`);

      // Llamar al servicio de exportación
      await ExportService.exportToExcel(options, res);
      
      // El servicio ya envió la respuesta directamente a res
      // No hacemos res.json() aquí
    } catch (error: any) {
      console.error('❌ Error al exportar Excel:', error);
      
      // Solo enviar respuesta si no se ha enviado ya
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error al exportar a Excel',
          errors: [{ field: 'general', message: error.message }],
        });
      }
    }
  }

  /**
   * @route   POST /api/export/pdf
   * @desc    Exportar datos a PDF
   * @access  Private
   */
  async exportPDF(req: Request, res: Response): Promise<void> {
    try {
      const options = req.body;

      // Validar que tenemos los datos mínimos
      if (!options.filename || !options.columns || !options.data) {
        res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos',
          errors: [
            { 
              field: 'general', 
              message: 'Se requieren: filename, columns y data' 
            }
          ],
        });
        return;
      }

      // Log para debugging
      console.log(`📄 Exportando PDF: ${options.filename}.pdf (${options.data.length} registros)`);

      // Llamar al servicio de exportación
      await ExportService.exportToPDF(options, res);
      
      // El servicio ya envió la respuesta directamente a res
    } catch (error: any) {
      console.error('❌ Error al exportar PDF:', error);
      
      // Solo enviar respuesta si no se ha enviado ya
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error al exportar a PDF',
          errors: [{ field: 'general', message: error.message }],
        });
      }
    }
  }

  /**
   * @route   POST /api/export/csv
   * @desc    Exportar datos a CSV
   * @access  Private
   */
  async exportCSV(req: Request, res: Response): Promise<void> {
    try {
      const options = req.body;

      // Validar que tenemos los datos mínimos
      if (!options.filename || !options.columns || !options.data) {
        res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos',
          errors: [
            { 
              field: 'general', 
              message: 'Se requieren: filename, columns y data' 
            }
          ],
        });
        return;
      }

      // Log para debugging
      console.log(`📋 Exportando CSV: ${options.filename}.csv (${options.data.length} registros)`);

      // Generar CSV
      const csv = await ExportService.exportToCSV(options);

      // Enviar como respuesta
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${options.filename}.csv"`
      );
      res.send(csv);
    } catch (error: any) {
      console.error('❌ Error al exportar CSV:', error);
      
      // Solo enviar respuesta si no se ha enviado ya
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error al exportar a CSV',
          errors: [{ field: 'general', message: error.message }],
        });
      }
    }
  }
}

export default new ExportController();