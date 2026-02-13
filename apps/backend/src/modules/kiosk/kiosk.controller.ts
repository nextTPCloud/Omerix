import { Request, Response } from 'express';
import { kioskService } from './kiosk.service';
import { kioskSyncService } from './kiosk-sync.service';
import Empresa from '../empresa/Empresa';

// ============================================
// RUTAS PUBLICAS (para el kiosk/cliente)
// ============================================

/**
 * Verifica credenciales y obtiene configuracion del kiosk
 */
export const activarKiosk = async (req: Request, res: Response) => {
  try {
    const { empresaId, kioskId, kioskSecret } = req.body;

    if (!empresaId || !kioskId || !kioskSecret) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const kiosk = await kioskService.verificarCredencialesKiosk(empresaId, kioskId, kioskSecret);

    // Obtener logo de la empresa
    const empresa = await Empresa.findById(empresaId).select('logo nombre').lean();

    res.json({
      success: true,
      kiosk: {
        id: kiosk._id,
        codigo: kiosk.codigo,
        nombre: kiosk.nombre,
        tipo: kiosk.tipo,
        salonId: kiosk.salonId,
        mesaId: kiosk.mesaId,
        pagos: kiosk.pagos,
        tema: kiosk.tema,
        config: kiosk.config,
      },
      empresaLogo: empresa?.logo || null,
      empresaNombre: empresa?.nombre || null,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error activando:', error.message);
    res.status(401).json({ error: error.message });
  }
};

/**
 * Descarga datos para el kiosk (productos, familias, modificadores)
 */
export const descargarDatos = async (req: Request, res: Response) => {
  try {
    const { empresaId, kioskId, kioskSecret, ultimaSync } = req.body;

    console.log('[Kiosk Sync] Descargando datos para:', { empresaId, kioskId, ultimaSync });

    if (!empresaId || !kioskId || !kioskSecret) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    // Verificar credenciales
    const kiosk = await kioskService.verificarCredencialesKiosk(empresaId, kioskId, kioskSecret);

    console.log('[Kiosk Sync] Kiosk verificado:', { nombre: kiosk.nombre, familiasVisibles: kiosk.config.familiasVisibles });

    // Obtener datos
    const datos = await kioskSyncService.descargarDatos(
      empresaId,
      kiosk,
      ultimaSync ? new Date(ultimaSync) : undefined
    );

    console.log('[Kiosk Sync] Datos descargados:', {
      familias: datos.familias.length,
      productos: datos.productos.length,
      modificadores: datos.modificadores.length,
    });

    res.json({
      success: true,
      ...datos,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error descargando datos:', error.message);
    res.status(401).json({ error: error.message });
  }
};

// ============================================
// SESIONES QR
// ============================================

/**
 * Crea una nueva sesion QR
 */
export const crearSesion = async (req: Request, res: Response) => {
  try {
    const { empresaId, kioskId, kioskSecret, mesaId } = req.body;

    if (!empresaId || !kioskId || !kioskSecret) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const resultado = await kioskService.crearSesion(
      empresaId,
      kioskId,
      kioskSecret,
      {
        mesaId,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
        idioma: req.headers['accept-language']?.split(',')[0],
      }
    );

    res.json({
      success: true,
      ...resultado,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error creando sesion:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Obtiene datos de una sesion por token
 */
export const obtenerSesion = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.body;
    const { token } = req.params;

    if (!empresaId || !token) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const sesion = await kioskService.obtenerSesion(empresaId, token);

    if (!sesion) {
      return res.status(404).json({ error: 'Sesion no encontrada o expirada' });
    }

    // Obtener config del kiosk asociado
    const kiosk = await kioskService.obtenerKiosk(sesion.kioskId.toString(), empresaId);

    res.json({
      success: true,
      sesion: {
        sessionToken: sesion.sessionToken,
        mesaId: sesion.mesaId,
        numeroMesa: sesion.numeroMesa,
        tipoServicio: sesion.tipoServicio,
        carrito: sesion.carrito,
        cliente: sesion.cliente,
        expiracion: sesion.expiracion,
        idioma: sesion.idioma,
      },
      kiosk: kiosk ? {
        id: kiosk._id,
        tipo: kiosk.tipo,
        pagos: kiosk.pagos,
        tema: kiosk.tema,
        config: kiosk.config,
      } : null,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error obteniendo sesion:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Actualiza el carrito de una sesion
 */
export const actualizarCarrito = async (req: Request, res: Response) => {
  try {
    const { empresaId, carrito } = req.body;
    const { token } = req.params;

    if (!empresaId || !token || !carrito) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const sesion = await kioskService.actualizarCarrito(empresaId, token, carrito);

    if (!sesion) {
      return res.status(404).json({ error: 'Sesion no encontrada o expirada' });
    }

    res.json({
      success: true,
      carrito: sesion.carrito,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error actualizando carrito:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Actualiza datos del cliente en sesion
 */
export const actualizarClienteSesion = async (req: Request, res: Response) => {
  try {
    const { empresaId, cliente, tipoServicio } = req.body;
    const { token } = req.params;

    if (!empresaId || !token) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const sesion = await kioskService.actualizarClienteSesion(
      empresaId,
      token,
      cliente || {},
      tipoServicio
    );

    if (!sesion) {
      return res.status(404).json({ error: 'Sesion no encontrada o expirada' });
    }

    res.json({
      success: true,
      cliente: sesion.cliente,
      tipoServicio: sesion.tipoServicio,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error actualizando cliente:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// PEDIDOS
// ============================================

/**
 * Crea un pedido desde kiosk
 */
export const crearPedido = async (req: Request, res: Response) => {
  try {
    const {
      empresaId,
      kioskId,
      kioskSecret,
      sessionToken,
      lineas,
      tipoServicio,
      cliente,
      notas,
      pagado,
      metodoPago,
      referenciaPago,
    } = req.body;

    if (!empresaId || !kioskId || !lineas || !tipoServicio) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const pedido = await kioskService.crearPedido(empresaId, {
      kioskId,
      kioskSecret,
      sessionToken,
      lineas,
      tipoServicio,
      cliente,
      notas,
      pagado,
      metodoPago,
      referenciaPago,
    });

    res.json({
      success: true,
      pedido: {
        id: pedido._id,
        numeroPedido: pedido.numeroPedido,
        codigoRecogida: pedido.codigoRecogida,
        estado: pedido.estado,
        total: pedido.total,
      },
    });
  } catch (error: any) {
    console.error('[Kiosk] Error creando pedido:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Obtiene el estado de un pedido
 */
export const obtenerEstadoPedido = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.body;
    const { id } = req.params;

    if (!empresaId || !id) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const estado = await kioskService.obtenerEstadoPedido(empresaId, id);

    if (!estado) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      success: true,
      ...estado,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error obteniendo estado:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Registra el pago de un pedido
 */
export const registrarPago = async (req: Request, res: Response) => {
  try {
    const { empresaId, metodoPago, referenciaPago } = req.body;
    const { id } = req.params;

    if (!empresaId || !id || !metodoPago) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    const pedido = await kioskService.registrarPago(empresaId, id, {
      metodoPago,
      referenciaPago,
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      success: true,
      pedido: {
        id: pedido._id,
        estado: pedido.estado,
        pagado: pedido.pagado,
      },
    });
  } catch (error: any) {
    console.error('[Kiosk] Error registrando pago:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// RUTAS PROTEGIDAS (admin)
// ============================================

/**
 * Genera un token de activacion para un kiosk especifico
 */
export const generarTokenActivacion = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).userId;
    const { kioskId } = req.body;

    if (!kioskId) {
      return res.status(400).json({ error: 'kioskId es requerido' });
    }

    const resultado = await kioskService.generarTokenActivacion(empresaId, kioskId, usuarioId);

    res.json({
      success: true,
      token: resultado.token,
      expiraEn: resultado.expiraEn,
      mensaje: 'Introduce este token en la aplicacion kiosk para activarlo',
    });
  } catch (error: any) {
    console.error('[Kiosk] Error generando token:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Activa un kiosk usando el token de activacion (endpoint publico)
 * Solo necesita el token de 8 caracteres
 */
export const activarConToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const resultado = await kioskService.activarConToken(
      token,
      {
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
      }
    );

    res.json({
      success: true,
      kioskId: resultado.kioskId,
      kioskSecret: resultado.kioskSecret,
      empresaId: resultado.empresaId,
      empresaNombre: resultado.empresaNombre,
      kioskNombre: resultado.kioskNombre,
      mensaje: 'Kiosk activado correctamente. Guarda el kioskSecret de forma segura.',
    });
  } catch (error: any) {
    console.error('[Kiosk] Error activando con token:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Lista kioskos de la empresa
 */
export const listarKiosks = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    const kiosks = await kioskService.listarKiosks(empresaId);

    res.json({ success: true, kiosks });
  } catch (error: any) {
    console.error('[Kiosk] Error listando:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene un kiosk por ID
 */
export const obtenerKiosk = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    const kiosk = await kioskService.obtenerKiosk(id, empresaId);

    if (!kiosk) {
      return res.status(404).json({ error: 'Kiosk no encontrado' });
    }

    res.json({ success: true, kiosk });
  } catch (error: any) {
    console.error('[Kiosk] Error obteniendo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crea un nuevo kiosk
 */
export const crearKiosk = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, tipo, salonId, mesaId, pagos, tema, config } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }

    const resultado = await kioskService.crearKiosk(empresaId, {
      nombre,
      tipo,
      salonId,
      mesaId,
      pagos,
      tema,
      config,
    });

    res.json({
      success: true,
      kiosk: resultado.kiosk,
      kioskSecret: resultado.kioskSecret, // Solo se muestra una vez
    });
  } catch (error: any) {
    console.error('[Kiosk] Error creando:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualiza un kiosk
 */
export const actualizarKiosk = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;
    const datos = req.body;

    const kiosk = await kioskService.actualizarKiosk(id, empresaId, datos);

    if (!kiosk) {
      return res.status(404).json({ error: 'Kiosk no encontrado' });
    }

    res.json({ success: true, kiosk });
  } catch (error: any) {
    console.error('[Kiosk] Error actualizando:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Desactiva un kiosk
 */
export const desactivarKiosk = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).userId;
    const { id } = req.params;
    const { motivo } = req.body;

    await kioskService.desactivarKiosk(id, empresaId, usuarioId, motivo || 'Desactivado por admin');

    res.json({ success: true, message: 'Kiosk desactivado' });
  } catch (error: any) {
    console.error('[Kiosk] Error desactivando:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Activa un kiosk (reactivar uno desactivado)
 */
export const activarKioskAdmin = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    await kioskService.activarKiosk(id, empresaId);

    res.json({ success: true, message: 'Kiosk activado' });
  } catch (error: any) {
    console.error('[Kiosk] Error activando:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Elimina un kiosk
 */
export const eliminarKiosk = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    await kioskService.eliminarKiosk(id, empresaId);

    res.json({ success: true, message: 'Kiosk eliminado' });
  } catch (error: any) {
    console.error('[Kiosk] Error eliminando:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Regenera el secret de un kiosk
 */
export const regenerarSecret = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { id } = req.params;

    const resultado = await kioskService.regenerarSecretKiosk(id, empresaId);

    res.json({
      success: true,
      kioskSecret: resultado.kioskSecret, // Solo se muestra una vez
    });
  } catch (error: any) {
    console.error('[Kiosk] Error regenerando secret:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Genera URL de QR para una mesa
 */
export const generarQRMesa = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { id, mesaId } = req.params;

    // Construir baseUrl desde la request o usar la configurada
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.KIOSK_URL || `${protocol}://${host}/kiosk`;

    const resultado = await kioskService.generarQRMesa(empresaId, id, mesaId, baseUrl);

    res.json({
      success: true,
      ...resultado,
    });
  } catch (error: any) {
    console.error('[Kiosk] Error generando QR:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene pedidos pendientes para un TPV
 */
export const obtenerPedidosPendientesTPV = async (req: Request, res: Response) => {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;

    if (!empresaId || !tpvId || !tpvSecret) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    // TODO: Verificar credenciales del TPV

    const pedidos = await kioskService.obtenerPedidosPendientesTPV(empresaId, tpvId);

    res.json({ success: true, pedidos });
  } catch (error: any) {
    console.error('[Kiosk] Error obteniendo pedidos pendientes:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Valida un pedido desde TPV (cambia estado a confirmado)
 */
export const validarPedidoTPV = async (req: Request, res: Response) => {
  try {
    const { empresaId, tpvId, tpvSecret } = req.body;
    const { id } = req.params;

    if (!empresaId || !tpvId || !tpvSecret || !id) {
      return res.status(400).json({ error: 'Faltan parametros requeridos' });
    }

    // TODO: Verificar credenciales del TPV

    const pedido = await kioskService.cambiarEstadoPedido(empresaId, id, 'confirmado');

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      success: true,
      pedido: {
        id: pedido._id,
        estado: pedido.estado,
      },
    });
  } catch (error: any) {
    console.error('[Kiosk] Error validando pedido:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancela un pedido
 */
export const cancelarPedido = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId || req.body.empresaId;
    const { id } = req.params;
    const { motivo } = req.body;

    const pedido = await kioskService.cambiarEstadoPedido(empresaId, id, 'cancelado', motivo);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      success: true,
      pedido: {
        id: pedido._id,
        estado: pedido.estado,
      },
    });
  } catch (error: any) {
    console.error('[Kiosk] Error cancelando pedido:', error.message);
    res.status(500).json({ error: error.message });
  }
};
