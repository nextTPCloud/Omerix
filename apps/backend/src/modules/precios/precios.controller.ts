import { Request, Response } from 'express';
import { preciosService, IPrecioCalculado } from './precios.service';

// ============================================
// CONTROLADOR DE PRECIOS
// ============================================

/**
 * Obtener precio calculado de un producto
 * POST /api/precios/calcular
 */
export const calcularPrecio = async (req: Request, res: Response) => {
  try {
    const { productoId, varianteId, clienteId, cantidad = 1 } = req.body;

    if (!productoId) {
      return res.status(400).json({
        success: false,
        error: 'productoId es requerido',
      });
    }

    const precio = await preciosService.obtenerPrecioProducto({
      productoId,
      varianteId,
      clienteId,
      cantidad: Number(cantidad) || 1,
      empresaId: req.empresaId!,
      dbConfig: req.dbConfig!,
    });

    return res.json({
      success: true,
      data: precio,
    });
  } catch (error: any) {
    console.error('Error al calcular precio:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al calcular precio',
    });
  }
};

/**
 * Obtener precios calculados de multiples productos
 * POST /api/precios/calcular-multiples
 */
export const calcularPreciosMultiples = async (req: Request, res: Response) => {
  try {
    const { productos, clienteId } = req.body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'productos es requerido y debe ser un array',
      });
    }

    const resultadosMap = await preciosService.obtenerPreciosMultiples(
      productos.map((p: any) => ({
        productoId: p.productoId,
        varianteId: p.varianteId,
        cantidad: Number(p.cantidad) || 1,
      })),
      clienteId,
      req.empresaId!,
      req.dbConfig!
    );

    // Convertir Map a objeto para JSON
    const resultados: Record<string, IPrecioCalculado> = {};
    resultadosMap.forEach((value, key) => {
      resultados[key] = value;
    });

    return res.json({
      success: true,
      data: resultados,
    });
  } catch (error: any) {
    console.error('Error al calcular precios multiples:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al calcular precios',
    });
  }
};
