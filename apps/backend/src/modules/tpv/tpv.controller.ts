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
    const usuarioId = (req as any).userId || (req as any).usuarioId;

    if (!empresaId) {
      return res.status(400).json({ ok: false, error: 'empresaId no disponible' });
    }
    if (!usuarioId) {
      return res.status(400).json({ ok: false, error: 'usuarioId no disponible' });
    }

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
 * almacenId es opcional - se puede configurar despues
 */
export async function activarTPV(req: Request, res: Response) {
  try {
    const { token, nombre, almacenId } = req.body;

    console.log('[TPV Activar] Recibido:', { token, nombre, almacenId });

    if (!token || !nombre) {
      return res.status(400).json({
        ok: false,
        error: 'Token y nombre son requeridos',
      });
    }

    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      version: req.headers['x-tpv-version'] as string,
    };

    const resultado = await tpvService.activarTPV(token, nombre, almacenId, deviceInfo);

    console.log('[TPV Activar] Exito:', resultado.tpvId);

    res.json({
      ok: true,
      ...resultado,
    });
  } catch (error: any) {
    console.error('[TPV Activar] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Login de usuario en TPV
 * POST /api/tpv/login
 */
export async function loginTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, pin } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !pin) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y pin son requeridos',
      });
    }

    const deviceInfo = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
    };

    const resultado = await tpvService.loginTPV(empresaId, tpvId, tpvSecret, pin, deviceInfo);

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
    const { empresaId, tpvId, sesionId, cajaId } = req.body;

    if (!empresaId || !tpvId || !sesionId) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y sesionId son requeridos',
      });
    }

    const resultado = await tpvService.heartbeat(empresaId, tpvId, sesionId, cajaId);

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
    const { empresaId, sesionId } = req.body;

    if (!empresaId || !sesionId) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId y sesionId son requeridos',
      });
    }

    await tpvService.logoutTPV(empresaId, sesionId);

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
    const usuarioId = (req as any).userId || (req as any).usuarioId;
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

/**
 * Elimina un TPV permanentemente
 * DELETE /api/tpv/:id
 */
export async function eliminarTPV(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).userId || (req as any).usuarioId;
    const { id } = req.params;

    await tpvService.eliminarTPV(id, empresaId, usuarioId);

    res.json({ ok: true, mensaje: 'TPV eliminado correctamente' });
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
    const { empresaId, tpvId, tpvSecret, ultimaSync } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Descargar datos
    const datos = await tpvSyncService.descargarDatos(
      tpvId,
      empresaId,
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
    const { empresaId, tpvId, tpvSecret, ventas } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !ventas) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y ventas son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Subir ventas
    const resultado = await tpvSyncService.subirVentas(
      tpvId,
      empresaId,
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
    const { empresaId, tpvId, tpvSecret, productosIds } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Obtener stock
    const stock = await tpvSyncService.obtenerStock(
      tpvId,
      empresaId,
      productosIds
    );

    res.json({ ok: true, stock });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}
