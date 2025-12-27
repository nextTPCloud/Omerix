import { Request, Response } from 'express';
import { tpvService } from './tpv.service';
import { tpvSyncService } from './tpv-sync.service';

/**
 * Genera token de activacion para registrar un nuevo TPV
 * POST /api/tpv/generar-token
 */
export async function generarTokenActivacion(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).usuario._id;

    const resultado = await tpvService.generarTokenActivacion(empresaId, usuarioId);

    res.json({
      ok: true,
      token: resultado.token,
      expiraEn: resultado.expiraEn,
      mensaje: 'Introduce este token en el TPV para activarlo. Valido por 24 horas.',
    });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Activa un TPV usando el token
 * POST /api/tpv/activar (publica, no requiere auth normal)
 */
export async function activarTPV(req: Request, res: Response) {
  try {
    const { token, nombre, almacenId } = req.body;

    if (!token || !nombre || !almacenId) {
      return res.status(400).json({
        ok: false,
        error: 'Token, nombre y almacenId son requeridos',
      });
    }

    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      version: req.headers['x-tpv-version'] as string,
    };

    const resultado = await tpvService.activarTPV(token, nombre, almacenId, deviceInfo);

    res.json({
      ok: true,
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Login de usuario en TPV
 * POST /api/tpv/login
 */
export async function loginTPV(req: Request, res: Response) {
  try {
    const { tpvId, tpvSecret, pin } = req.body;

    if (!tpvId || !tpvSecret || !pin) {
      return res.status(400).json({
        ok: false,
        error: 'tpvId, tpvSecret y pin son requeridos',
      });
    }

    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
    };

    const resultado = await tpvService.loginTPV(tpvId, tpvSecret, pin, deviceInfo);

    res.json({
      ok: true,
      ...resultado,
    });
  } catch (error: any) {
    res.status(401).json({ ok: false, error: error.message });
  }
}

/**
 * Heartbeat del TPV
 * POST /api/tpv/heartbeat
 */
export async function heartbeat(req: Request, res: Response) {
  try {
    const { tpvId, sesionId, cajaId } = req.body;

    if (!tpvId || !sesionId) {
      return res.status(400).json({
        ok: false,
        error: 'tpvId y sesionId son requeridos',
      });
    }

    const resultado = await tpvService.heartbeat(tpvId, sesionId, cajaId);

    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Logout de usuario en TPV
 * POST /api/tpv/logout
 */
export async function logoutTPV(req: Request, res: Response) {
  try {
    const { sesionId } = req.body;

    if (!sesionId) {
      return res.status(400).json({
        ok: false,
        error: 'sesionId es requerido',
      });
    }

    await tpvService.logoutTPV(sesionId);

    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Lista TPVs de la empresa
 * GET /api/tpv/lista
 */
export async function listarTPVs(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;

    const tpvs = await tpvService.listarTPVs(empresaId);

    res.json({ ok: true, tpvs });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene un TPV
 * GET /api/tpv/:id
 */
export async function obtenerTPV(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    const tpv = await tpvService.obtenerTPV(id, empresaId);

    if (!tpv) {
      return res.status(404).json({ ok: false, error: 'TPV no encontrado' });
    }

    res.json({ ok: true, tpv });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Actualiza un TPV
 * PUT /api/tpv/:id
 */
export async function actualizarTPV(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;
    const datos = req.body;

    const tpv = await tpvService.actualizarTPV(id, empresaId, datos);

    if (!tpv) {
      return res.status(404).json({ ok: false, error: 'TPV no encontrado' });
    }

    res.json({ ok: true, tpv });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Desactiva un TPV
 * POST /api/tpv/:id/desactivar
 */
export async function desactivarTPV(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).usuario._id;
    const { id } = req.params;
    const { motivo } = req.body;

    await tpvService.desactivarTPV(id, empresaId, usuarioId, motivo || 'Desactivado manualmente');

    res.json({ ok: true, mensaje: 'TPV desactivado correctamente' });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene sesiones activas
 * GET /api/tpv/sesiones
 */
export async function obtenerSesiones(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;

    const sesiones = await tpvService.obtenerSesionesActivas(empresaId);

    res.json({ ok: true, sesiones });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Fuerza cierre de una sesion
 * POST /api/tpv/sesiones/:id/cerrar
 */
export async function forzarCierreSesion(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    await tpvService.forzarCierreSesion(id, empresaId);

    res.json({ ok: true, mensaje: 'Sesion cerrada' });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Revoca token de un TPV
 * POST /api/tpv/:id/revocar-token
 */
export async function revocarTokenTPV(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    await tpvService.revocarTokenTPV(id, empresaId);

    res.json({ ok: true, mensaje: 'Token revocado. El TPV debera volver a autenticarse.' });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

// ===== ENDPOINTS DE SINCRONIZACION =====

/**
 * Descarga datos para el TPV (productos, clientes, tarifas, etc.)
 * POST /api/tpv/sync/descargar
 */
export async function descargarDatos(req: Request, res: Response) {
  try {
    const { tpvId, tpvSecret, ultimaSync } = req.body;

    if (!tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'tpvId y tpvSecret son requeridos',
      });
    }

    // Verificar credenciales del TPV
    const tpv = await tpvService.verificarCredencialesTPV(tpvId, tpvSecret);

    // Descargar datos
    const datos = await tpvSyncService.descargarDatos(
      tpvId,
      tpv.empresaId.toString(),
      ultimaSync ? new Date(ultimaSync) : undefined
    );

    res.json({ ok: true, datos });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Sube ventas realizadas en modo offline
 * POST /api/tpv/sync/subir
 */
export async function subirVentas(req: Request, res: Response) {
  try {
    const { tpvId, tpvSecret, ventas } = req.body;

    if (!tpvId || !tpvSecret || !ventas) {
      return res.status(400).json({
        ok: false,
        error: 'tpvId, tpvSecret y ventas son requeridos',
      });
    }

    // Verificar credenciales del TPV
    const tpv = await tpvService.verificarCredencialesTPV(tpvId, tpvSecret);

    // Subir ventas
    const resultado = await tpvSyncService.subirVentas(
      tpvId,
      tpv.empresaId.toString(),
      ventas
    );

    res.json({ ok: true, ...resultado });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene stock actual de productos
 * POST /api/tpv/sync/stock
 */
export async function obtenerStock(req: Request, res: Response) {
  try {
    const { tpvId, tpvSecret, productosIds } = req.body;

    if (!tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'tpvId y tpvSecret son requeridos',
      });
    }

    // Verificar credenciales del TPV
    const tpv = await tpvService.verificarCredencialesTPV(tpvId, tpvSecret);

    // Obtener stock
    const stock = await tpvSyncService.obtenerStock(
      tpvId,
      tpv.empresaId.toString(),
      productosIds
    );

    res.json({ ok: true, stock });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}
