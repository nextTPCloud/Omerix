import { Request, Response } from 'express';
import { tpvService } from './tpv.service';
import { tpvSyncService, ICrearTicketTPV } from './tpv-sync.service';
import { tpvRestauracionService } from './tpv-restauracion.service';
import ticketPDFService from './ticket-pdf.service';
import { sseManager } from '../../services/sse-manager.service';

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
 * Verificar PIN sin crear sesion (para PIN por ticket)
 * POST /api/tpv/verificar-pin
 */
export async function verificarPin(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, pin } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !pin) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y pin son requeridos',
      });
    }

    const resultado = await tpvService.verificarPinTPV(empresaId, tpvId, tpvSecret, pin);

    res.json({
      ok: true,
      usuario: resultado,
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

    const sesionesRaw = await tpvService.obtenerSesionesActivas(empresaId);

    // Mapear campos al formato esperado por el frontend
    const sesiones = sesionesRaw.map((s: any) => ({
      _id: s._id.toString(),
      tpvId: s.tpvId.toString(),
      usuarioId: s.usuarioId.toString(),
      usuario: {
        nombre: s.usuarioNombre?.split(' ')[0] || '',
        apellidos: s.usuarioNombre?.split(' ').slice(1).join(' ') || '',
      },
      cajaId: s.cajaId?.toString(),
      estado: s.activa ? 'activa' : 'cerrada',
      inicioSesion: s.inicioSesion,
      finSesion: s.finSesion,
      ultimoHeartbeat: s.heartbeatUltimo,
      ventasRealizadas: 0, // TODO: calcular desde ventas
      totalVentas: 0, // TODO: calcular desde ventas
    }));

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

/**
 * Crea un ticket (factura simplificada) desde el TPV
 * POST /api/tpv/sync/ticket
 */
export async function crearTicket(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, ticket } = req.body;

    console.log('[TPV Crear Ticket] Recibido:', {
      empresaId,
      tpvId,
      lineas: ticket?.lineas?.length,
      total: ticket?.total,
    });

    if (!empresaId || !tpvId || !tpvSecret || !ticket) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y ticket son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    console.log('[TPV Crear Ticket] Credenciales verificadas');

    // Crear ticket
    const resultado = await tpvSyncService.crearTicket(
      tpvId,
      empresaId,
      ticket as ICrearTicketTPV
    );

    console.log('[TPV Crear Ticket] Resultado:', resultado);
    res.json({ ok: true, ...resultado });
  } catch (error: any) {
    console.error('[TPV Crear Ticket] Error:', error.message);
    console.error('[TPV Crear Ticket] Stack:', error.stack);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene vencimientos pendientes de cobro/pago
 * POST /api/tpv/sync/vencimientos-pendientes
 */
export async function obtenerVencimientosPendientes(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, tipo, busqueda, limite } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Obtener vencimientos pendientes
    const vencimientos = await tpvSyncService.obtenerVencimientosPendientes(
      empresaId,
      tipo,
      busqueda,
      limite
    );

    res.json({ ok: true, vencimientos });
  } catch (error: any) {
    console.error('[TPV Vencimientos] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Busca vencimiento por numero de factura
 * POST /api/tpv/sync/buscar-factura
 */
export async function buscarVencimientoPorFactura(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, numeroFactura } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !numeroFactura) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y numeroFactura son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Buscar vencimientos de la factura
    const vencimientos = await tpvSyncService.buscarVencimientoPorFactura(
      empresaId,
      numeroFactura
    );

    res.json({ ok: true, vencimientos });
  } catch (error: any) {
    console.error('[TPV Buscar Factura] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Busca tickets (facturas simplificadas) en todos los TPVs
 * POST /api/tpv/sync/buscar-tickets
 */
export async function buscarTickets(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, busqueda, limite } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    const tickets = await tpvSyncService.buscarTickets(
      empresaId,
      busqueda,
      limite || 50
    );

    res.json({ ok: true, tickets });
  } catch (error: any) {
    console.error('[TPV Buscar Tickets] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Registra el cobro/pago de un vencimiento desde TPV
 * POST /api/tpv/sync/cobrar-vencimiento
 */
export async function cobrarVencimiento(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, vencimientoId, importe, metodo, formaPagoId, referencia, observaciones, usuarioId } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !vencimientoId || !importe || !metodo || !usuarioId) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret, vencimientoId, importe, metodo y usuarioId son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Cobrar vencimiento
    const resultado = await tpvSyncService.cobrarVencimiento(
      tpvId,
      empresaId,
      vencimientoId,
      {
        importe,
        metodo,
        formaPagoId,
        referencia,
        observaciones,
        usuarioId,
      }
    );

    res.json({ ok: true, ...resultado });
  } catch (error: any) {
    console.error('[TPV Cobrar Vencimiento] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Sincroniza un movimiento de caja desde el TPV (entrada/salida o cierre)
 * POST /api/tpv/sync/movimiento-caja
 */
export async function sincronizarMovimientoCaja(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, tipo, datos } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !tipo || !datos) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret, tipo y datos son requeridos',
      });
    }

    // Verificar credenciales del TPV
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Sincronizar movimiento
    const resultado = await tpvSyncService.sincronizarMovimientoCaja(
      tpvId,
      empresaId,
      tipo,
      datos
    );

    res.json({ ok: true, ...resultado });
  } catch (error: any) {
    console.error('[TPV Movimiento Caja] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

// ===== ENDPOINTS DE RESTAURACIÓN =====

/**
 * Obtiene salones para el TPV
 * POST /api/tpv/restauracion/salones
 */
export async function getSalonesTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const salones = await tpvRestauracionService.getSalones(empresaId);

    res.json({ ok: true, data: salones });
  } catch (error: any) {
    console.error('[TPV Salones] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene mesas para el TPV
 * POST /api/tpv/restauracion/mesas
 */
export async function getMesasTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, salonId } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const mesas = await tpvRestauracionService.getMesas(empresaId, salonId);

    res.json({ ok: true, data: mesas });
  } catch (error: any) {
    console.error('[TPV Mesas] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Actualiza estado de mesa
 * POST /api/tpv/restauracion/mesas/:mesaId/estado
 */
export async function actualizarEstadoMesaTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, estado, ventaActualId, camareroId } = req.body;
    const { mesaId } = req.params;

    if (!empresaId || !tpvId || !tpvSecret || !estado) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y estado son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const mesa = await tpvRestauracionService.actualizarEstadoMesa(
      empresaId,
      mesaId,
      estado,
      { ventaActualId, camareroId }
    );

    if (!mesa) {
      return res.status(404).json({ ok: false, error: 'Mesa no encontrada' });
    }

    res.json({ ok: true, data: mesa });
  } catch (error: any) {
    console.error('[TPV Mesa Estado] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene camareros para el TPV
 * POST /api/tpv/restauracion/camareros
 */
export async function getCamarerosTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const camareros = await tpvRestauracionService.getCamareros(empresaId);

    res.json({ ok: true, data: camareros });
  } catch (error: any) {
    console.error('[TPV Camareros] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Login de comandero (camarero)
 * POST /api/tpv/comandero/login
 */
export async function loginComandero(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, pin } = req.body;
    if (!empresaId || !tpvId || !tpvSecret || !pin) {
      return res.status(400).json({ ok: false, error: 'empresaId, tpvId, tpvSecret y pin son requeridos' });
    }
    const resultado = await tpvService.loginComandero(empresaId, tpvId, tpvSecret, pin);
    res.json({ ok: true, ...resultado });
  } catch (error: any) {
    res.status(401).json({ ok: false, error: error.message });
  }
}

/**
 * Logout de comandero
 * POST /api/tpv/comandero/logout
 */
export async function logoutComandero(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, sesionId } = req.body;
    if (!empresaId || !tpvId || !sesionId) {
      return res.status(400).json({ ok: false, error: 'empresaId, tpvId y sesionId son requeridos' });
    }
    await tpvService.logoutComandero(empresaId, tpvId, sesionId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Registra propina para un camarero
 * POST /api/tpv/restauracion/camareros/:camareroId/propina
 */
export async function registrarPropinaTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, importe, ventaId } = req.body;
    const { camareroId } = req.params;

    if (!empresaId || !tpvId || !tpvSecret || !importe || !ventaId) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret, importe y ventaId son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const ok = await tpvRestauracionService.registrarPropina(
      empresaId,
      camareroId,
      importe,
      ventaId
    );

    res.json({ ok });
  } catch (error: any) {
    console.error('[TPV Propina] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtiene sugerencias para un producto
 * POST /api/tpv/restauracion/sugerencias/:productoId
 */
export async function getSugerenciasTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;
    const { productoId } = req.params;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const sugerencias = await tpvRestauracionService.getSugerenciasProducto(empresaId, productoId);

    res.json({ ok: true, data: sugerencias });
  } catch (error: any) {
    console.error('[TPV Sugerencias] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Registra aceptación de sugerencia
 * POST /api/tpv/restauracion/sugerencias/:sugerenciaId/aceptar
 */
export async function aceptarSugerenciaTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;
    const { sugerenciaId } = req.params;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const ok = await tpvRestauracionService.aceptarSugerencia(empresaId, sugerenciaId);

    res.json({ ok });
  } catch (error: any) {
    console.error('[TPV Aceptar Sugerencia] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Crea una comanda de cocina
 * POST /api/tpv/restauracion/comandas
 */
export async function crearComandaTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, comanda } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !comanda) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y comanda son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const resultado = await tpvRestauracionService.crearComandaCocina(empresaId, comanda);

    if (!resultado.comandaId) {
      return res.status(500).json({ ok: false, error: 'Error creando comanda. No se encontró zona de preparación.' });
    }

    res.json({ ok: true, comandaId: resultado.comandaId, pdfBase64: resultado.pdfBase64 });
  } catch (error: any) {
    console.error('[TPV Comanda] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Genera PDF del ticket para una venta
 * POST /api/tpv/sync/ticket-pdf
 */
export async function generarTicketPDF(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret, venta, opciones } = req.body;

    if (!empresaId || !tpvId || !tpvSecret || !venta) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId, tpvSecret y venta son requeridos',
      });
    }

    // Verificar credenciales
    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);

    // Generar PDF del ticket
    const pdfBuffer = await ticketPDFService.generarTicket(
      empresaId,
      venta,
      opciones || {}
    );

    // Devolver PDF como base64 para que el TPV lo imprima
    res.json({
      ok: true,
      pdf: pdfBuffer.toString('base64'),
      contentType: 'application/pdf',
    });
  } catch (error: any) {
    console.error('[TPV Ticket PDF] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}

// ===== SSE (Server-Sent Events) =====

/**
 * Conexión SSE para recibir eventos en tiempo real
 * GET /api/tpv/events/:empresaId/:tpvId
 */
export async function sseTPV(req: Request, res: Response) {
  const { empresaId, tpvId } = req.params;

  if (!empresaId || !tpvId) {
    return res.status(400).json({ ok: false, error: 'empresaId y tpvId son requeridos' });
  }

  // Registrar la conexión SSE en el canal de la empresa
  const channel = `tpv:${empresaId}`;
  sseManager.addConnection(channel, res);

  console.log(`[SSE] TPV ${tpvId} conectado al canal ${channel}`);
}

/**
 * Obtiene las comandas activas de una mesa
 * POST /api/tpv/restauracion/mesas/:mesaId/comandas
 */
export async function getComandasMesaTPV(req: Request, res: Response) {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;
    const { mesaId } = req.params;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({
        ok: false,
        error: 'empresaId, tpvId y tpvSecret son requeridos',
      });
    }

    await tpvService.verificarCredencialesTPV(empresaId, tpvId, tpvSecret);
    const comandas = await tpvRestauracionService.getComandasMesa(empresaId, mesaId);

    res.json({ ok: true, data: comandas });
  } catch (error: any) {
    console.error('[TPV Comandas Mesa] Error:', error.message);
    res.status(400).json({ ok: false, error: error.message });
  }
}
