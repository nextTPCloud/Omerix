import { Model } from 'mongoose';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import {
  getFacturaModel,
  getAlbaranModel,
  getPedidoModel,
  getPresupuestoModel,
  getClienteModel,
  getReciboModel,
} from '@/utils/dynamic-models.helper';

/**
 * ============================================
 * HELPER DE INTEGRIDAD REFERENCIAL
 * ============================================
 *
 * Verifica si una entidad puede ser eliminada
 * basándose en si tiene registros relacionados
 */

// Tipos de errores de integridad referencial
export class ReferentialIntegrityError extends Error {
  public readonly relatedRecords: RelatedRecord[];
  public readonly entityType: string;
  public readonly entityId: string;

  constructor(
    entityType: string,
    entityId: string,
    relatedRecords: RelatedRecord[]
  ) {
    const messages = relatedRecords.map(r =>
      `${r.count} ${r.documentType}${r.count > 1 ? 's' : ''}`
    );
    const message = `No se puede eliminar ${entityType}: tiene ${messages.join(', ')} asociados`;

    super(message);
    this.name = 'ReferentialIntegrityError';
    this.entityType = entityType;
    this.entityId = entityId;
    this.relatedRecords = relatedRecords;
  }
}

export interface RelatedRecord {
  documentType: string;
  count: number;
  examples?: string[];  // Códigos de ejemplo
}

export interface IntegrityCheckResult {
  canDelete: boolean;
  relatedRecords: RelatedRecord[];
  totalRelated: number;
}

/**
 * Verificar si un cliente puede ser eliminado
 * Un cliente no puede eliminarse si tiene:
 * - Facturas
 * - Albaranes
 * - Pedidos
 * - Presupuestos
 * - Recibos
 */
export async function checkClienteIntegrity(
  clienteId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  // Obtener modelos
  const [
    FacturaModel,
    AlbaranModel,
    PedidoModel,
    PresupuestoModel,
    ReciboModel,
  ] = await Promise.all([
    getFacturaModel(empresaId, dbConfig),
    getAlbaranModel(empresaId, dbConfig),
    getPedidoModel(empresaId, dbConfig),
    getPresupuestoModel(empresaId, dbConfig),
    getReciboModel(empresaId, dbConfig).catch(() => null), // Puede que no exista
  ]);

  // Verificar facturas
  const facturas = await FacturaModel.find({ clienteId, activo: true })
    .select('codigo')
    .limit(5)
    .lean();

  if (facturas.length > 0) {
    const totalFacturas = await FacturaModel.countDocuments({ clienteId, activo: true });
    relatedRecords.push({
      documentType: 'factura',
      count: totalFacturas,
      examples: facturas.map((f: any) => f.codigo).slice(0, 3),
    });
  }

  // Verificar albaranes
  const albaranes = await AlbaranModel.find({ clienteId, activo: true })
    .select('codigo')
    .limit(5)
    .lean();

  if (albaranes.length > 0) {
    const totalAlbaranes = await AlbaranModel.countDocuments({ clienteId, activo: true });
    relatedRecords.push({
      documentType: 'albarán',
      count: totalAlbaranes,
      examples: albaranes.map((a: any) => a.codigo).slice(0, 3),
    });
  }

  // Verificar pedidos
  const pedidos = await PedidoModel.find({ clienteId, activo: true })
    .select('codigo')
    .limit(5)
    .lean();

  if (pedidos.length > 0) {
    const totalPedidos = await PedidoModel.countDocuments({ clienteId, activo: true });
    relatedRecords.push({
      documentType: 'pedido',
      count: totalPedidos,
      examples: pedidos.map((p: any) => p.codigo).slice(0, 3),
    });
  }

  // Verificar presupuestos
  const presupuestos = await PresupuestoModel.find({ clienteId, activo: true })
    .select('codigo')
    .limit(5)
    .lean();

  if (presupuestos.length > 0) {
    const totalPresupuestos = await PresupuestoModel.countDocuments({ clienteId, activo: true });
    relatedRecords.push({
      documentType: 'presupuesto',
      count: totalPresupuestos,
      examples: presupuestos.map((p: any) => p.codigo).slice(0, 3),
    });
  }

  // Verificar recibos (si el modelo existe)
  if (ReciboModel) {
    const recibos = await ReciboModel.find({ clienteId, activo: true })
      .select('codigo')
      .limit(5)
      .lean();

    if (recibos.length > 0) {
      const totalRecibos = await ReciboModel.countDocuments({ clienteId, activo: true });
      relatedRecords.push({
        documentType: 'recibo',
        count: totalRecibos,
        examples: recibos.map((r: any) => r.codigo).slice(0, 3),
      });
    }
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);

  return {
    canDelete: relatedRecords.length === 0,
    relatedRecords,
    totalRelated,
  };
}

/**
 * Verificar si un producto puede ser eliminado
 * Un producto no puede eliminarse si tiene:
 * - Líneas en facturas
 * - Líneas en albaranes
 * - Líneas en pedidos
 * - Líneas en presupuestos
 * - Movimientos de inventario
 */
export async function checkProductoIntegrity(
  productoId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  // Obtener modelos
  const [
    FacturaModel,
    AlbaranModel,
    PedidoModel,
    PresupuestoModel,
  ] = await Promise.all([
    getFacturaModel(empresaId, dbConfig),
    getAlbaranModel(empresaId, dbConfig),
    getPedidoModel(empresaId, dbConfig),
    getPresupuestoModel(empresaId, dbConfig),
  ]);

  // Verificar facturas con este producto
  const facturas = await FacturaModel.find({
    'lineas.productoId': productoId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (facturas.length > 0) {
    const totalFacturas = await FacturaModel.countDocuments({
      'lineas.productoId': productoId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'factura',
      count: totalFacturas,
      examples: facturas.map((f: any) => f.codigo).slice(0, 3),
    });
  }

  // Verificar albaranes
  const albaranes = await AlbaranModel.find({
    'lineas.productoId': productoId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (albaranes.length > 0) {
    const totalAlbaranes = await AlbaranModel.countDocuments({
      'lineas.productoId': productoId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'albarán',
      count: totalAlbaranes,
      examples: albaranes.map((a: any) => a.codigo).slice(0, 3),
    });
  }

  // Verificar pedidos
  const pedidos = await PedidoModel.find({
    'lineas.productoId': productoId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (pedidos.length > 0) {
    const totalPedidos = await PedidoModel.countDocuments({
      'lineas.productoId': productoId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'pedido',
      count: totalPedidos,
      examples: pedidos.map((p: any) => p.codigo).slice(0, 3),
    });
  }

  // Verificar presupuestos
  const presupuestos = await PresupuestoModel.find({
    'lineas.productoId': productoId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (presupuestos.length > 0) {
    const totalPresupuestos = await PresupuestoModel.countDocuments({
      'lineas.productoId': productoId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'presupuesto',
      count: totalPresupuestos,
      examples: presupuestos.map((p: any) => p.codigo).slice(0, 3),
    });
  }

  // También verificar en componentes de kit
  const facturasKit = await FacturaModel.find({
    'lineas.componentesKit.productoId': productoId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (facturasKit.length > 0) {
    const totalFacturasKit = await FacturaModel.countDocuments({
      'lineas.componentesKit.productoId': productoId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'factura (como componente de kit)',
      count: totalFacturasKit,
      examples: facturasKit.map((f: any) => f.codigo).slice(0, 3),
    });
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);

  return {
    canDelete: relatedRecords.length === 0,
    relatedRecords,
    totalRelated,
  };
}

/**
 * Verificar si un agente comercial puede ser eliminado
 * Un agente no puede eliminarse si tiene:
 * - Facturas asignadas
 * - Albaranes asignados
 * - Pedidos asignados
 * - Presupuestos asignados
 * - Clientes asignados (como vendedor)
 */
export async function checkAgenteComercialIntegrity(
  agenteId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  // Obtener modelos
  const [
    FacturaModel,
    AlbaranModel,
    PedidoModel,
    PresupuestoModel,
    ClienteModel,
  ] = await Promise.all([
    getFacturaModel(empresaId, dbConfig),
    getAlbaranModel(empresaId, dbConfig),
    getPedidoModel(empresaId, dbConfig),
    getPresupuestoModel(empresaId, dbConfig),
    getClienteModel(empresaId, dbConfig),
  ]);

  // Verificar facturas asignadas
  const facturas = await FacturaModel.find({
    agenteComercialId: agenteId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (facturas.length > 0) {
    const totalFacturas = await FacturaModel.countDocuments({
      agenteComercialId: agenteId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'factura',
      count: totalFacturas,
      examples: facturas.map((f: any) => f.codigo).slice(0, 3),
    });
  }

  // Verificar albaranes asignados
  const albaranes = await AlbaranModel.find({
    agenteComercialId: agenteId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (albaranes.length > 0) {
    const totalAlbaranes = await AlbaranModel.countDocuments({
      agenteComercialId: agenteId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'albarán',
      count: totalAlbaranes,
      examples: albaranes.map((a: any) => a.codigo).slice(0, 3),
    });
  }

  // Verificar pedidos asignados
  const pedidos = await PedidoModel.find({
    agenteComercialId: agenteId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (pedidos.length > 0) {
    const totalPedidos = await PedidoModel.countDocuments({
      agenteComercialId: agenteId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'pedido',
      count: totalPedidos,
      examples: pedidos.map((p: any) => p.codigo).slice(0, 3),
    });
  }

  // Verificar presupuestos asignados
  const presupuestos = await PresupuestoModel.find({
    agenteComercialId: agenteId,
    activo: true
  })
    .select('codigo')
    .limit(5)
    .lean();

  if (presupuestos.length > 0) {
    const totalPresupuestos = await PresupuestoModel.countDocuments({
      agenteComercialId: agenteId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'presupuesto',
      count: totalPresupuestos,
      examples: presupuestos.map((p: any) => p.codigo).slice(0, 3),
    });
  }

  // Verificar clientes asignados (como vendedor)
  const clientes = await ClienteModel.find({
    vendedorId: agenteId,
    activo: true
  })
    .select('codigo nombre')
    .limit(5)
    .lean();

  if (clientes.length > 0) {
    const totalClientes = await ClienteModel.countDocuments({
      vendedorId: agenteId,
      activo: true
    });
    relatedRecords.push({
      documentType: 'cliente asignado',
      count: totalClientes,
      examples: clientes.map((c: any) => c.codigo || c.nombre).slice(0, 3),
    });
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);

  return {
    canDelete: relatedRecords.length === 0,
    relatedRecords,
    totalRelated,
  };
}

/**
 * Verificar si un proveedor puede ser eliminado
 * Un proveedor no puede eliminarse si tiene:
 * - Facturas de compra
 * - Albaranes de compra
 * - Pedidos de compra
 * - Presupuestos de compra
 * - Productos asociados
 */
export async function checkProveedorIntegrity(
  proveedorId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  // Importar modelos dinámicamente para compras
  const { getFacturaCompraModel, getAlbaranCompraModel, getPedidoCompraModel, getPresupuestoCompraModel, getProductoModel } = await import('@/utils/dynamic-models.helper');

  try {
    // Obtener modelos
    const [
      FacturaCompraModel,
      AlbaranCompraModel,
      PedidoCompraModel,
      PresupuestoCompraModel,
      ProductoModel,
    ] = await Promise.all([
      getFacturaCompraModel(empresaId, dbConfig).catch(() => null),
      getAlbaranCompraModel(empresaId, dbConfig).catch(() => null),
      getPedidoCompraModel(empresaId, dbConfig).catch(() => null),
      getPresupuestoCompraModel(empresaId, dbConfig).catch(() => null),
      getProductoModel(empresaId, dbConfig).catch(() => null),
    ]);

    // Verificar facturas de compra
    if (FacturaCompraModel) {
      const facturas = await FacturaCompraModel.find({
        proveedorId,
        activo: true
      })
        .select('codigo')
        .limit(5)
        .lean();

      if (facturas.length > 0) {
        const total = await FacturaCompraModel.countDocuments({ proveedorId, activo: true });
        relatedRecords.push({
          documentType: 'factura de compra',
          count: total,
          examples: facturas.map((f: any) => f.codigo).slice(0, 3),
        });
      }
    }

    // Verificar albaranes de compra
    if (AlbaranCompraModel) {
      const albaranes = await AlbaranCompraModel.find({
        proveedorId,
        activo: true
      })
        .select('codigo')
        .limit(5)
        .lean();

      if (albaranes.length > 0) {
        const total = await AlbaranCompraModel.countDocuments({ proveedorId, activo: true });
        relatedRecords.push({
          documentType: 'albarán de compra',
          count: total,
          examples: albaranes.map((a: any) => a.codigo).slice(0, 3),
        });
      }
    }

    // Verificar pedidos de compra
    if (PedidoCompraModel) {
      const pedidos = await PedidoCompraModel.find({
        proveedorId,
        activo: true
      })
        .select('codigo')
        .limit(5)
        .lean();

      if (pedidos.length > 0) {
        const total = await PedidoCompraModel.countDocuments({ proveedorId, activo: true });
        relatedRecords.push({
          documentType: 'pedido de compra',
          count: total,
          examples: pedidos.map((p: any) => p.codigo).slice(0, 3),
        });
      }
    }

    // Verificar productos asociados
    if (ProductoModel) {
      const productos = await ProductoModel.find({
        proveedorId,
        activo: true
      })
        .select('sku nombre')
        .limit(5)
        .lean();

      if (productos.length > 0) {
        const total = await ProductoModel.countDocuments({ proveedorId, activo: true });
        relatedRecords.push({
          documentType: 'producto asociado',
          count: total,
          examples: productos.map((p: any) => p.sku || p.nombre).slice(0, 3),
        });
      }
    }
  } catch (error) {
    console.error('Error verificando integridad de proveedor:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);

  return {
    canDelete: relatedRecords.length === 0,
    relatedRecords,
    totalRelated,
  };
}

/**
 * Verificar si un almacén puede ser eliminado
 * Un almacén no puede eliminarse si tiene:
 * - Productos con stock
 * - Albaranes de salida
 * - Traspasos
 * - Inventarios
 */
export async function checkAlmacenIntegrity(
  almacenId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  const { getProductoModel, getAlbaranModel, getTraspasoModel, getInventarioModel } = await import('@/utils/dynamic-models.helper');

  try {
    const [
      ProductoModel,
      AlbaranModel,
      TraspasoModel,
      InventarioModel,
    ] = await Promise.all([
      getProductoModel(empresaId, dbConfig).catch(() => null),
      getAlbaranModel(empresaId, dbConfig).catch(() => null),
      getTraspasoModel(empresaId, dbConfig).catch(() => null),
      getInventarioModel(empresaId, dbConfig).catch(() => null),
    ]);

    // Verificar productos con stock en este almacén
    if (ProductoModel) {
      const productos = await ProductoModel.find({
        'stockPorAlmacen.almacenId': almacenId,
        'stockPorAlmacen.cantidad': { $gt: 0 },
        activo: true
      })
        .select('sku nombre')
        .limit(5)
        .lean();

      if (productos.length > 0) {
        const total = await ProductoModel.countDocuments({
          'stockPorAlmacen.almacenId': almacenId,
          'stockPorAlmacen.cantidad': { $gt: 0 },
          activo: true
        });
        relatedRecords.push({
          documentType: 'producto con stock',
          count: total,
          examples: productos.map((p: any) => p.sku || p.nombre).slice(0, 3),
        });
      }
    }

    // Verificar albaranes
    if (AlbaranModel) {
      const albaranes = await AlbaranModel.find({
        almacenId,
        activo: true
      })
        .select('codigo')
        .limit(5)
        .lean();

      if (albaranes.length > 0) {
        const total = await AlbaranModel.countDocuments({ almacenId, activo: true });
        relatedRecords.push({
          documentType: 'albarán',
          count: total,
          examples: albaranes.map((a: any) => a.codigo).slice(0, 3),
        });
      }
    }

    // Verificar traspasos
    if (TraspasoModel) {
      const traspasos = await TraspasoModel.find({
        $or: [
          { almacenOrigenId: almacenId },
          { almacenDestinoId: almacenId },
        ],
        activo: true
      })
        .select('codigo')
        .limit(5)
        .lean();

      if (traspasos.length > 0) {
        const total = await TraspasoModel.countDocuments({
          $or: [
            { almacenOrigenId: almacenId },
            { almacenDestinoId: almacenId },
          ],
          activo: true
        });
        relatedRecords.push({
          documentType: 'traspaso',
          count: total,
          examples: traspasos.map((t: any) => t.codigo).slice(0, 3),
        });
      }
    }

    // Verificar inventarios
    if (InventarioModel) {
      const inventarios = await InventarioModel.find({
        almacenId,
        activo: true
      })
        .select('codigo')
        .limit(5)
        .lean();

      if (inventarios.length > 0) {
        const total = await InventarioModel.countDocuments({ almacenId, activo: true });
        relatedRecords.push({
          documentType: 'inventario',
          count: total,
          examples: inventarios.map((i: any) => i.codigo).slice(0, 3),
        });
      }
    }
  } catch (error) {
    console.error('Error verificando integridad de almacén:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);

  return {
    canDelete: relatedRecords.length === 0,
    relatedRecords,
    totalRelated,
  };
}

/**
 * Verificar si una familia de productos puede ser eliminada
 * Una familia no puede eliminarse si tiene:
 * - Productos asociados
 * - Subfamilias
 */
export async function checkFamiliaIntegrity(
  familiaId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  const { getProductoModel, getFamiliaModel } = await import('@/utils/dynamic-models.helper');

  try {
    const [ProductoModel, FamiliaModel] = await Promise.all([
      getProductoModel(empresaId, dbConfig).catch(() => null),
      getFamiliaModel(empresaId, dbConfig).catch(() => null),
    ]);

    // Verificar productos en esta familia
    if (ProductoModel) {
      const productos = await ProductoModel.find({
        familiaId,
        activo: true
      })
        .select('sku nombre')
        .limit(5)
        .lean();

      if (productos.length > 0) {
        const total = await ProductoModel.countDocuments({ familiaId, activo: true });
        relatedRecords.push({
          documentType: 'producto',
          count: total,
          examples: productos.map((p: any) => p.sku || p.nombre).slice(0, 3),
        });
      }
    }

    // Verificar subfamilias
    if (FamiliaModel) {
      const subfamilias = await FamiliaModel.find({
        familiaPadreId: familiaId,
        activo: true
      })
        .select('codigo nombre')
        .limit(5)
        .lean();

      if (subfamilias.length > 0) {
        const total = await FamiliaModel.countDocuments({ familiaPadreId: familiaId, activo: true });
        relatedRecords.push({
          documentType: 'subfamilia',
          count: total,
          examples: subfamilias.map((f: any) => f.codigo || f.nombre).slice(0, 3),
        });
      }
    }
  } catch (error) {
    console.error('Error verificando integridad de familia:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);

  return {
    canDelete: relatedRecords.length === 0,
    relatedRecords,
    totalRelated,
  };
}

/**
 * Verificar si una forma de pago puede ser eliminada
 * No puede eliminarse si está usada en:
 * - Clientes
 * - Proveedores
 * - Facturas
 * - Pedidos
 * - Presupuestos
 */
export async function checkFormaPagoIntegrity(
  formaPagoId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const [ClienteModel, ProveedorModel, FacturaModel, PedidoModel, PresupuestoModel] = await Promise.all([
      getClienteModel(empresaId, dbConfig),
      import('@/utils/dynamic-models.helper').then(m => m.getProveedorModel(empresaId, dbConfig)),
      getFacturaModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
      getPresupuestoModel(empresaId, dbConfig),
    ]);

    // Verificar clientes
    const clientesCount = await ClienteModel.countDocuments({ formaPagoId, activo: true });
    if (clientesCount > 0) {
      relatedRecords.push({ documentType: 'cliente', count: clientesCount });
    }

    // Verificar proveedores
    const proveedoresCount = await ProveedorModel.countDocuments({ formaPagoId, activo: true });
    if (proveedoresCount > 0) {
      relatedRecords.push({ documentType: 'proveedor', count: proveedoresCount });
    }

    // Verificar facturas
    const facturasCount = await FacturaModel.countDocuments({ formaPagoId, activo: true });
    if (facturasCount > 0) {
      relatedRecords.push({ documentType: 'factura', count: facturasCount });
    }

    // Verificar pedidos
    const pedidosCount = await PedidoModel.countDocuments({ 'condiciones.formaPagoId': formaPagoId, activo: true });
    if (pedidosCount > 0) {
      relatedRecords.push({ documentType: 'pedido', count: pedidosCount });
    }

    // Verificar presupuestos
    const presupuestosCount = await PresupuestoModel.countDocuments({ 'condiciones.formaPagoId': formaPagoId, activo: true });
    if (presupuestosCount > 0) {
      relatedRecords.push({ documentType: 'presupuesto', count: presupuestosCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de forma de pago:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si un término de pago puede ser eliminado
 */
export async function checkTerminoPagoIntegrity(
  terminoPagoId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const [ClienteModel, ProveedorModel, FacturaModel] = await Promise.all([
      getClienteModel(empresaId, dbConfig),
      import('@/utils/dynamic-models.helper').then(m => m.getProveedorModel(empresaId, dbConfig)),
      getFacturaModel(empresaId, dbConfig),
    ]);

    // Verificar clientes
    const clientesCount = await ClienteModel.countDocuments({ terminoPagoId, activo: true });
    if (clientesCount > 0) {
      relatedRecords.push({ documentType: 'cliente', count: clientesCount });
    }

    // Verificar proveedores
    const proveedoresCount = await ProveedorModel.countDocuments({ terminoPagoId, activo: true });
    if (proveedoresCount > 0) {
      relatedRecords.push({ documentType: 'proveedor', count: proveedoresCount });
    }

    // Verificar facturas
    const facturasCount = await FacturaModel.countDocuments({ terminoPagoId, activo: true });
    if (facturasCount > 0) {
      relatedRecords.push({ documentType: 'factura', count: facturasCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de término de pago:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si un personal puede ser eliminado
 * No puede eliminarse si tiene:
 * - Partes de trabajo asignados
 * - Proyectos asignados
 * - Nóminas
 */
export async function checkPersonalIntegrity(
  personalId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const { getParteTrabajoModel, getProyectoModel } = await import('@/utils/dynamic-models.helper');

    const [ParteTrabajoModel, ProyectoModel] = await Promise.all([
      getParteTrabajoModel(empresaId, dbConfig).catch(() => null),
      getProyectoModel(empresaId, dbConfig).catch(() => null),
    ]);

    // Verificar partes de trabajo
    if (ParteTrabajoModel) {
      const partesCount = await ParteTrabajoModel.countDocuments({
        $or: [
          { personalId },
          { 'lineas.personalId': personalId },
        ],
        activo: true
      });
      if (partesCount > 0) {
        relatedRecords.push({ documentType: 'parte de trabajo', count: partesCount });
      }
    }

    // Verificar proyectos (como responsable o miembro del equipo)
    if (ProyectoModel) {
      const proyectosCount = await ProyectoModel.countDocuments({
        $or: [
          { responsableId: personalId },
          { 'equipo.personalId': personalId },
        ],
        activo: true
      });
      if (proyectosCount > 0) {
        relatedRecords.push({ documentType: 'proyecto', count: proyectosCount });
      }
    }
  } catch (error) {
    console.error('Error verificando integridad de personal:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si un tipo de impuesto puede ser eliminado
 * No puede eliminarse si está usado en productos o líneas de documentos
 */
export async function checkTipoImpuestoIntegrity(
  tipoImpuestoId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const { getProductoModel } = await import('@/utils/dynamic-models.helper');
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    // Verificar productos
    const productosCount = await ProductoModel.countDocuments({
      tipoImpuestoId,
      activo: true
    });
    if (productosCount > 0) {
      relatedRecords.push({ documentType: 'producto', count: productosCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de tipo de impuesto:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si una serie de documento puede ser eliminada
 * No puede eliminarse si tiene documentos asociados
 */
export async function checkSerieDocumentoIntegrity(
  serieDocumentoId: string,
  serie: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const [FacturaModel, AlbaranModel, PedidoModel, PresupuestoModel] = await Promise.all([
      getFacturaModel(empresaId, dbConfig),
      getAlbaranModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
      getPresupuestoModel(empresaId, dbConfig),
    ]);

    // Verificar facturas con esta serie
    const facturasCount = await FacturaModel.countDocuments({ serie });
    if (facturasCount > 0) {
      relatedRecords.push({ documentType: 'factura', count: facturasCount });
    }

    // Verificar albaranes con esta serie
    const albaranesCount = await AlbaranModel.countDocuments({ serie });
    if (albaranesCount > 0) {
      relatedRecords.push({ documentType: 'albarán', count: albaranesCount });
    }

    // Verificar pedidos con esta serie
    const pedidosCount = await PedidoModel.countDocuments({ serie });
    if (pedidosCount > 0) {
      relatedRecords.push({ documentType: 'pedido', count: pedidosCount });
    }

    // Verificar presupuestos con esta serie
    const presupuestosCount = await PresupuestoModel.countDocuments({ serie });
    if (presupuestosCount > 0) {
      relatedRecords.push({ documentType: 'presupuesto', count: presupuestosCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de serie de documento:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si un proyecto puede ser eliminado
 * No puede eliminarse si tiene:
 * - Partes de trabajo
 * - Facturas
 * - Presupuestos
 * - Pedidos
 */
export async function checkProyectoIntegrity(
  proyectoId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const { getParteTrabajoModel } = await import('@/utils/dynamic-models.helper');

    const [FacturaModel, PedidoModel, PresupuestoModel, AlbaranModel, ParteTrabajoModel] = await Promise.all([
      getFacturaModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
      getPresupuestoModel(empresaId, dbConfig),
      getAlbaranModel(empresaId, dbConfig),
      getParteTrabajoModel(empresaId, dbConfig).catch(() => null),
    ]);

    // Verificar facturas
    const facturasCount = await FacturaModel.countDocuments({ proyectoId, activo: true });
    if (facturasCount > 0) {
      relatedRecords.push({ documentType: 'factura', count: facturasCount });
    }

    // Verificar pedidos
    const pedidosCount = await PedidoModel.countDocuments({ proyectoId, activo: true });
    if (pedidosCount > 0) {
      relatedRecords.push({ documentType: 'pedido', count: pedidosCount });
    }

    // Verificar presupuestos
    const presupuestosCount = await PresupuestoModel.countDocuments({ proyectoId, activo: true });
    if (presupuestosCount > 0) {
      relatedRecords.push({ documentType: 'presupuesto', count: presupuestosCount });
    }

    // Verificar albaranes
    const albaranesCount = await AlbaranModel.countDocuments({ proyectoId, activo: true });
    if (albaranesCount > 0) {
      relatedRecords.push({ documentType: 'albarán', count: albaranesCount });
    }

    // Verificar partes de trabajo
    if (ParteTrabajoModel) {
      const partesCount = await ParteTrabajoModel.countDocuments({ proyectoId, activo: true });
      if (partesCount > 0) {
        relatedRecords.push({ documentType: 'parte de trabajo', count: partesCount });
      }
    }
  } catch (error) {
    console.error('Error verificando integridad de proyecto:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si una tarifa puede ser eliminada
 * No puede eliminarse si está asignada a clientes
 */
export async function checkTarifaIntegrity(
  tarifaId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const ClienteModel = await getClienteModel(empresaId, dbConfig);

    // Verificar clientes con esta tarifa
    const clientesCount = await ClienteModel.countDocuments({ tarifaId, activo: true });
    if (clientesCount > 0) {
      relatedRecords.push({ documentType: 'cliente', count: clientesCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de tarifa:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si una clasificación puede ser eliminada
 * No puede eliminarse si tiene clientes asociados
 */
export async function checkClasificacionIntegrity(
  clasificacionId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const ClienteModel = await getClienteModel(empresaId, dbConfig);

    // Verificar clientes con esta clasificación
    const clientesCount = await ClienteModel.countDocuments({ clasificacionId, activo: true });
    if (clientesCount > 0) {
      relatedRecords.push({ documentType: 'cliente', count: clientesCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de clasificación:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si un estado puede ser eliminado
 * No puede eliminarse si está usado en clientes o productos
 */
export async function checkEstadoIntegrity(
  estadoId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const [ClienteModel, ProductoModel] = await Promise.all([
      getClienteModel(empresaId, dbConfig),
      import('@/utils/dynamic-models.helper').then(m => m.getProductoModel(empresaId, dbConfig)),
    ]);

    // Verificar clientes
    const clientesCount = await ClienteModel.countDocuments({ estadoId, activo: true });
    if (clientesCount > 0) {
      relatedRecords.push({ documentType: 'cliente', count: clientesCount });
    }

    // Verificar productos
    const productosCount = await ProductoModel.countDocuments({ estadoId, activo: true });
    if (productosCount > 0) {
      relatedRecords.push({ documentType: 'producto', count: productosCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de estado:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si una situación puede ser eliminada
 * No puede eliminarse si está usada en clientes o productos
 */
export async function checkSituacionIntegrity(
  situacionId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const [ClienteModel, ProductoModel] = await Promise.all([
      getClienteModel(empresaId, dbConfig),
      import('@/utils/dynamic-models.helper').then(m => m.getProductoModel(empresaId, dbConfig)),
    ]);

    // Verificar clientes
    const clientesCount = await ClienteModel.countDocuments({ situacionId, activo: true });
    if (clientesCount > 0) {
      relatedRecords.push({ documentType: 'cliente', count: clientesCount });
    }

    // Verificar productos
    const productosCount = await ProductoModel.countDocuments({ situacionId, activo: true });
    if (productosCount > 0) {
      relatedRecords.push({ documentType: 'producto', count: productosCount });
    }
  } catch (error) {
    console.error('Error verificando integridad de situación:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Verificar si una maquinaria puede ser eliminada
 * No puede eliminarse si tiene partes de trabajo asociados
 */
export async function checkMaquinariaIntegrity(
  maquinariaId: string,
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<IntegrityCheckResult> {
  const relatedRecords: RelatedRecord[] = [];

  try {
    const { getParteTrabajoModel } = await import('@/utils/dynamic-models.helper');
    const ParteTrabajoModel = await getParteTrabajoModel(empresaId, dbConfig).catch(() => null);

    if (ParteTrabajoModel) {
      const partesCount = await ParteTrabajoModel.countDocuments({
        $or: [
          { maquinariaId },
          { 'lineas.maquinariaId': maquinariaId },
        ],
        activo: true
      });
      if (partesCount > 0) {
        relatedRecords.push({ documentType: 'parte de trabajo', count: partesCount });
      }
    }
  } catch (error) {
    console.error('Error verificando integridad de maquinaria:', error);
  }

  const totalRelated = relatedRecords.reduce((sum, r) => sum + r.count, 0);
  return { canDelete: relatedRecords.length === 0, relatedRecords, totalRelated };
}

/**
 * Formatear resultado de verificación para respuesta API
 */
export function formatIntegrityCheckResponse(
  result: IntegrityCheckResult,
  entityType: string
): { success: boolean; message: string; details?: RelatedRecord[] } {
  if (result.canDelete) {
    return {
      success: true,
      message: `${entityType} puede ser eliminado`,
    };
  }

  const messages = result.relatedRecords.map(r =>
    `${r.count} ${r.documentType}${r.count > 1 ? 's' : ''}`
  );

  return {
    success: false,
    message: `No se puede eliminar: tiene ${messages.join(', ')} asociados`,
    details: result.relatedRecords,
  };
}
