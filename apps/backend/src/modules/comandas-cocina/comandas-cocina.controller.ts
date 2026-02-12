import { Request, Response } from 'express';
import { comandasCocinaService } from './comandas-cocina.service';
import {
  CreateComandaDTO,
  UpdateComandaDTO,
  UpdateLineaComandaDTO,
  SearchComandasDTO,
  ComandasKDSDTO,
} from './comandas-cocina.dto';
import { sseManager } from '../../services/sse-manager.service';
import { comandaPdfService } from './comanda-pdf.service';

export const getAllComandas = async (req: Request, res: Response) => {
  try {
    const filters: SearchComandasDTO = {
      zonaPreparacionId: req.query.zonaPreparacionId as string,
      estado: req.query.estado as any,
      estados: req.query.estados ? (req.query.estados as string).split(',') as any : undefined,
      prioridad: req.query.prioridad as any,
      tipoServicio: req.query.tipoServicio as any,
      mesaId: req.query.mesaId as string,
      pedidoId: req.query.pedidoId as string,
      desde: req.query.desde as string,
      hasta: req.query.hasta as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      sortBy: (req.query.sortBy as string) || 'horaRecepcion',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await comandasCocinaService.findAll(
      req.empresaId!,
      filters,
      req.dbConfig!
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getComandasKDS = async (req: Request, res: Response) => {
  try {
    const params: ComandasKDSDTO = {
      zonaPreparacionId: req.query.zonaPreparacionId as string,
      estados: req.query.estados ? (req.query.estados as string).split(',') as any : undefined,
      limit: parseInt(req.query.limit as string) || 50,
    };

    if (!params.zonaPreparacionId) {
      return res.status(400).json({ success: false, error: 'zonaPreparacionId es requerido' });
    }

    const comandas = await comandasCocinaService.findForKDS(
      req.empresaId!,
      params,
      req.dbConfig!
    );

    res.json({ success: true, data: comandas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getComandaById = async (req: Request, res: Response) => {
  try {
    const comanda = await comandasCocinaService.findOne(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createComanda = async (req: Request, res: Response) => {
  try {
    const data: CreateComandaDTO = req.body;
    const comanda = await comandasCocinaService.create(
      req.empresaId!,
      req.userId!,
      data,
      req.dbConfig!
    );
    res.status(201).json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateComanda = async (req: Request, res: Response) => {
  try {
    const data: UpdateComandaDTO = req.body;
    const comanda = await comandasCocinaService.update(
      req.params.id,
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(error.message.includes('no encontrada') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateLineaComanda = async (req: Request, res: Response) => {
  try {
    const data: UpdateLineaComandaDTO = req.body;
    const comanda = await comandasCocinaService.updateLinea(
      req.params.id,
      req.params.lineaId,
      req.empresaId!,
      req.userId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const marcarComandaLista = async (req: Request, res: Response) => {
  try {
    const comanda = await comandasCocinaService.marcarLista(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const marcarComandaServida = async (req: Request, res: Response) => {
  try {
    const comanda = await comandasCocinaService.marcarServida(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const cancelarComanda = async (req: Request, res: Response) => {
  try {
    const comanda = await comandasCocinaService.cancelar(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: comanda });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const reimprimirComanda = async (req: Request, res: Response) => {
  try {
    const comanda = await comandasCocinaService.reimprimir(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );

    // Generar PDF para reimpresión
    let pdfBase64: string | undefined;
    try {
      const pdfBuffer = await comandaPdfService.generar(comanda);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfError) {
      console.error('[Comandas] Error generando PDF reimpr:', pdfError);
    }

    res.json({ success: true, data: comanda, pdfBase64 });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getEstadisticasKDS = async (req: Request, res: Response) => {
  try {
    const { zonaPreparacionId } = req.params;
    const stats = await comandasCocinaService.getEstadisticasKDS(
      zonaPreparacionId,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * SSE para KDS - eventos en tiempo real por zona de preparación
 * GET /api/comandas-cocina/events/:zonaPreparacionId
 */
export const sseKDS = async (req: Request, res: Response) => {
  try {
    const { zonaPreparacionId } = req.params;
    const empresaId = req.empresaId!;

    if (!zonaPreparacionId) {
      return res.status(400).json({ success: false, error: 'zonaPreparacionId es requerido' });
    }

    const channel = `kds:${empresaId}:${zonaPreparacionId}`;
    sseManager.addConnection(channel, res);

    console.log(`[SSE] KDS conectado al canal ${channel}`);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
