import { Model, Types } from 'mongoose';
import Empresa, { IDatabaseConfig, IPreferenciasPrecios as IEmpresaPreferencias } from '../empresa/Empresa';
import { IProducto } from '../productos/Producto';
import { ICliente } from '../clientes/Cliente';
import { ITarifa } from '../tarifas/Tarifa';
import { IOferta, TipoOferta } from '../ofertas/Oferta';
import {
  getProductoModel,
  getClienteModel,
  getTarifaModel,
  getOfertaModel,
} from '../../utils/dynamic-models.helper';

// ============================================
// INTERFACES
// ============================================

export interface IObtenerPrecioParams {
  productoId: string;
  varianteId?: string;
  clienteId?: string;
  cantidad: number;
  empresaId: string;
  dbConfig: IDatabaseConfig;
  fecha?: Date;
}

export interface IPrecioCalculado {
  precioBase: number;
  precioFinal: number;
  descuentoAplicado: number;
  origen: 'producto' | 'tarifa' | 'oferta' | 'precio_cantidad' | 'manual';
  detalleOrigen?: {
    tarifaId?: string;
    tarifaNombre?: string;
    porcentajeDescuento?: number; // Porcentaje original de la tarifa (evita errores de redondeo)
    ofertaId?: string;
    ofertaNombre?: string;
    ofertaTipo?: string;
  };
  unidadesGratis?: number;
  etiquetaOferta?: string;
}

export interface IPreferenciasPrecios {
  ordenBusqueda: Array<'tarifa' | 'oferta' | 'producto'>;
  aplicarOfertasAutomaticamente: boolean;
  aplicarTarifasAutomaticamente: boolean;
  permitirAcumularOfertas: boolean;
  permitirAcumularTarifaYOferta: boolean;
  descuentoMaximoManual?: number;
}

// ============================================
// SERVICIO
// ============================================

class PreciosService {
  /**
   * Preferencias por defecto
   */
  private defaultPreferencias: IPreferenciasPrecios = {
    ordenBusqueda: ['tarifa', 'oferta', 'producto'],
    aplicarOfertasAutomaticamente: true,
    aplicarTarifasAutomaticamente: true,
    permitirAcumularOfertas: false,
    permitirAcumularTarifaYOferta: true,
    descuentoMaximoManual: 50,
  };

  /**
   * Obtiene las preferencias de precios de una empresa
   */
  private async getPreferenciasEmpresa(empresaId: string): Promise<IPreferenciasPrecios> {
    try {
      const empresa = await Empresa.findById(empresaId)
        .select('preferenciasPrecios')
        .lean();

      if (empresa?.preferenciasPrecios) {
        return {
          ordenBusqueda: empresa.preferenciasPrecios.ordenBusqueda || this.defaultPreferencias.ordenBusqueda,
          aplicarOfertasAutomaticamente: empresa.preferenciasPrecios.aplicarOfertasAutomaticamente ?? this.defaultPreferencias.aplicarOfertasAutomaticamente,
          aplicarTarifasAutomaticamente: empresa.preferenciasPrecios.aplicarTarifasAutomaticamente ?? this.defaultPreferencias.aplicarTarifasAutomaticamente,
          permitirAcumularOfertas: empresa.preferenciasPrecios.permitirAcumularOfertas ?? this.defaultPreferencias.permitirAcumularOfertas,
          permitirAcumularTarifaYOferta: empresa.preferenciasPrecios.permitirAcumularTarifaYOferta ?? this.defaultPreferencias.permitirAcumularTarifaYOferta,
          descuentoMaximoManual: empresa.preferenciasPrecios.descuentoMaximoManual ?? this.defaultPreferencias.descuentoMaximoManual,
        };
      }
    } catch (error) {
      console.error('Error obteniendo preferencias de precios:', error);
    }

    return this.defaultPreferencias;
  }

  /**
   * Obtiene el precio de un producto segun las preferencias de la empresa
   * Este es el metodo principal que usaran todos los servicios de ventas
   */
  async obtenerPrecioProducto(params: IObtenerPrecioParams): Promise<IPrecioCalculado> {
    const {
      productoId,
      varianteId,
      clienteId,
      cantidad,
      empresaId,
      dbConfig,
      fecha = new Date(),
    } = params;

    // Obtener modelos
    const ProductoModel = await getProductoModel(empresaId, dbConfig);
    const ClienteModel = await getClienteModel(empresaId, dbConfig);

    // Obtener producto
    const producto = await ProductoModel.findById(productoId);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Precio base (del producto o variante)
    const precioBase = this.getPrecioBase(producto, varianteId);

    // Obtener cliente si se proporciona
    let cliente: ICliente | null = null;
    if (clienteId) {
      cliente = await ClienteModel.findById(clienteId);
    }

    // Obtener preferencias de la empresa
    const preferencias = await this.getPreferenciasEmpresa(empresaId);

    // Inicializar resultado
    let precioFinal = precioBase;
    let origen: IPrecioCalculado['origen'] = 'producto';
    let detalleOrigen: IPrecioCalculado['detalleOrigen'] = {};
    let unidadesGratis = 0;
    let etiquetaOferta = '';
    let precioTarifa: number | null = null;
    let tarifaAplicada = false;

    // Buscar segun orden configurado
    for (const fuentePrecio of preferencias.ordenBusqueda) {
      switch (fuentePrecio) {
        case 'tarifa':
          if (cliente?.tarifaId && preferencias.aplicarTarifasAutomaticamente) {
            // Obtener precio PVP para tarifas que lo usan como base
            const precioPvp = this.getPrecioPvp(producto, varianteId);

            const resultadoTarifa = await this.buscarPrecioEnTarifa({
              tarifaId: cliente.tarifaId.toString(),
              productoId,
              varianteId,
              precioVenta: precioBase,
              precioPvp,
              empresaId,
              dbConfig,
              fecha,
            });

            if (resultadoTarifa) {
              precioFinal = resultadoTarifa.precio;
              precioTarifa = resultadoTarifa.precio;
              origen = 'tarifa';
              tarifaAplicada = true;
              detalleOrigen = {
                tarifaId: resultadoTarifa.tarifaId,
                tarifaNombre: resultadoTarifa.tarifaNombre,
                porcentajeDescuento: resultadoTarifa.porcentajeDescuento, // Guardar el % original
              };
            }
          }
          break;

        case 'oferta':
          if (preferencias.aplicarOfertasAutomaticamente) {
            // Si ya hay tarifa aplicada y no se permite acumular, saltar ofertas
            if (tarifaAplicada && !preferencias.permitirAcumularTarifaYOferta) {
              break;
            }

            // Usar precio de tarifa como base si hay tarifa y se permite acumular
            const precioParaOferta = tarifaAplicada && preferencias.permitirAcumularTarifaYOferta
              ? precioTarifa!
              : precioBase;

            const resultadoOferta = await this.buscarOfertaAplicable({
              productoId,
              productoFamiliaId: producto.familiaId?.toString(),
              clienteId,
              clienteTarifaId: cliente?.tarifaId?.toString(),
              cantidad,
              precioBase: precioParaOferta,
              empresaId,
              dbConfig,
              fecha,
            });

            if (resultadoOferta && resultadoOferta.precioResultante < precioFinal) {
              precioFinal = resultadoOferta.precioResultante;
              // Si habia tarifa, mantener el detalle de la tarifa tambien
              if (tarifaAplicada && preferencias.permitirAcumularTarifaYOferta) {
                origen = 'oferta';
                detalleOrigen = {
                  ...detalleOrigen,
                  ofertaId: resultadoOferta.ofertaId,
                  ofertaNombre: resultadoOferta.ofertaNombre,
                  ofertaTipo: resultadoOferta.ofertaTipo,
                };
              } else {
                origen = 'oferta';
                detalleOrigen = {
                  ofertaId: resultadoOferta.ofertaId,
                  ofertaNombre: resultadoOferta.ofertaNombre,
                  ofertaTipo: resultadoOferta.ofertaTipo,
                };
              }
              unidadesGratis = resultadoOferta.unidadesGratis;
              etiquetaOferta = resultadoOferta.etiqueta;
            }
          }
          break;

        case 'producto':
          // Verificar precios por cantidad del producto
          const precioPorCantidad = this.getPrecioPorCantidad(producto, cantidad);
          if (precioPorCantidad !== null && precioPorCantidad < precioFinal) {
            precioFinal = precioPorCantidad;
            origen = 'precio_cantidad';
          }
          break;
      }
    }

    // Calcular descuento aplicado - usar el porcentaje original si esta disponible
    let descuentoAplicado: number;
    if (detalleOrigen?.porcentajeDescuento !== undefined) {
      // Usar el porcentaje original de la tarifa (evita errores de redondeo)
      descuentoAplicado = detalleOrigen.porcentajeDescuento;
    } else if (precioBase > 0) {
      // Calcular inversamente solo si no hay porcentaje original
      descuentoAplicado = ((precioBase - precioFinal) / precioBase) * 100;
    } else {
      descuentoAplicado = 0;
    }

    return {
      precioBase,
      precioFinal: Math.round(precioFinal * 100) / 100,
      descuentoAplicado: Math.round(descuentoAplicado * 100) / 100,
      origen,
      detalleOrigen,
      unidadesGratis,
      etiquetaOferta,
    };
  }

  /**
   * Obtiene el precio base de un producto (o variante) - precio de venta
   */
  private getPrecioBase(producto: IProducto, varianteId?: string): number {
    if (varianteId && producto.variantes) {
      const variante = producto.variantes.find(
        (v: any) => v._id?.toString() === varianteId
      );
      if (variante && variante.precios && !variante.precios.usarPrecioBase) {
        return variante.precios.venta || producto.precios?.venta || 0;
      }
    }
    return producto.precios?.venta || 0;
  }

  /**
   * Obtiene el precio PVP de un producto (o variante)
   */
  private getPrecioPvp(producto: IProducto, varianteId?: string): number {
    if (varianteId && producto.variantes) {
      const variante = producto.variantes.find(
        (v: any) => v._id?.toString() === varianteId
      );
      if (variante && variante.precios && !variante.precios.usarPrecioBase) {
        // Si la variante tiene su propio PVP, usarlo; si no, usar el PVP del producto
        return variante.precios.pvp || producto.precios?.pvp || variante.precios.venta || producto.precios?.venta || 0;
      }
    }
    // Usar PVP del producto, o si no existe, el precio de venta
    return producto.precios?.pvp || producto.precios?.venta || 0;
  }

  /**
   * Obtiene precio por cantidad del producto
   */
  private getPrecioPorCantidad(producto: IProducto, cantidad: number): number | null {
    if (!producto.preciosPorCantidad || producto.preciosPorCantidad.length === 0) {
      return null;
    }

    // Buscar el precio por cantidad aplicable (de mayor a menor)
    const preciosOrdenados = [...producto.preciosPorCantidad]
      .filter((p: any) => p.cantidadMinima <= cantidad)
      .sort((a: any, b: any) => b.cantidadMinima - a.cantidadMinima);

    if (preciosOrdenados.length > 0) {
      const precioAplicable = preciosOrdenados[0] as any;
      if (precioAplicable.precio) {
        return precioAplicable.precio;
      }
      if (precioAplicable.descuentoPorcentaje && producto.precios?.venta) {
        return producto.precios.venta * (1 - precioAplicable.descuentoPorcentaje / 100);
      }
    }

    return null;
  }

  /**
   * Busca precio en la tarifa asignada
   */
  private async buscarPrecioEnTarifa(params: {
    tarifaId: string;
    productoId: string;
    varianteId?: string;
    precioVenta: number;
    precioPvp: number;
    empresaId: string;
    dbConfig: IDatabaseConfig;
    fecha: Date;
  }): Promise<{ precio: number; tarifaId: string; tarifaNombre: string; porcentajeDescuento?: number } | null> {
    const { tarifaId, productoId, varianteId, precioVenta, precioPvp, empresaId, dbConfig, fecha } = params;

    const TarifaModel = await getTarifaModel(empresaId, dbConfig);
    const tarifa = await TarifaModel.findById(tarifaId);

    if (!tarifa || !tarifa.activo) return null;

    // Verificar vigencia
    if (tarifa.fechaDesde && fecha < tarifa.fechaDesde) return null;
    if (tarifa.fechaHasta && fecha > tarifa.fechaHasta) return null;

    // Determinar precio base segun configuracion de tarifa
    // Si basePrecio === 'pvp': el descuento se aplica sobre el PVP
    // Si basePrecio === 'venta': el descuento se aplica sobre el precio de venta
    const precioBaseParaCalculo = tarifa.basePrecio === 'pvp' ? precioPvp : precioVenta;

    // Buscar precio especifico del producto
    const precioProducto = tarifa.precios.find(p => {
      if (!p.activo) return false;
      if (p.productoId.toString() !== productoId) return false;
      if (varianteId && p.varianteId && p.varianteId.toString() !== varianteId) return false;
      return true;
    });

    let precioFinal: number | null = null;
    let porcentajeDescuento: number | undefined = undefined;

    if (precioProducto) {
      // Precio fijo especifico para el producto
      if (precioProducto.precio !== undefined && precioProducto.precio !== null) {
        precioFinal = precioProducto.precio;
        // Calcular el porcentaje equivalente para precios fijos
        if (precioBaseParaCalculo > 0) {
          porcentajeDescuento = ((precioBaseParaCalculo - precioProducto.precio) / precioBaseParaCalculo) * 100;
        }
      } else if (precioProducto.descuentoPorcentaje !== undefined) {
        // Descuento especifico para el producto - guardar el porcentaje original
        porcentajeDescuento = precioProducto.descuentoPorcentaje;
        precioFinal = precioBaseParaCalculo * (1 - precioProducto.descuentoPorcentaje / 100);
      }
    } else if (tarifa.tipo === 'porcentaje' && tarifa.porcentajeGeneral !== undefined) {
      // Usar % general de la tarifa - guardar el porcentaje original
      porcentajeDescuento = tarifa.porcentajeGeneral;
      precioFinal = precioBaseParaCalculo * (1 - tarifa.porcentajeGeneral / 100);
    } else if (tarifa.tipo === 'fija') {
      // Tarifa fija sin precio especifico: usar precio de venta
      precioFinal = precioVenta;
      porcentajeDescuento = 0;
    }

    if (precioFinal !== null) {
      return {
        precio: Math.round(precioFinal * 100) / 100,
        tarifaId: tarifa._id.toString(),
        tarifaNombre: tarifa.nombre,
        porcentajeDescuento: porcentajeDescuento !== undefined ? Math.round(porcentajeDescuento * 100) / 100 : undefined,
      };
    }

    return null;
  }

  /**
   * Busca ofertas aplicables al producto
   */
  private async buscarOfertaAplicable(params: {
    productoId: string;
    productoFamiliaId?: string;
    clienteId?: string;
    clienteTarifaId?: string;
    cantidad: number;
    precioBase: number;
    empresaId: string;
    dbConfig: IDatabaseConfig;
    fecha: Date;
  }): Promise<{
    precioResultante: number;
    unidadesGratis: number;
    etiqueta: string;
    ofertaId: string;
    ofertaNombre: string;
    ofertaTipo: string;
  } | null> {
    const {
      productoId,
      productoFamiliaId,
      clienteId,
      clienteTarifaId,
      cantidad,
      precioBase,
      empresaId,
      dbConfig,
      fecha,
    } = params;

    const OfertaModel = await getOfertaModel(empresaId, dbConfig);

    // Buscar ofertas vigentes
    const ofertas = await OfertaModel.find({
      empresaId: new Types.ObjectId(empresaId),
      activo: true,
      fechaDesde: { $lte: fecha },
      $or: [
        { fechaHasta: { $exists: false } },
        { fechaHasta: null },
        { fechaHasta: { $gte: fecha } },
      ],
    }).sort({ prioridad: 1 }); // Menor prioridad = mayor importancia

    let mejorOferta: {
      precioResultante: number;
      unidadesGratis: number;
      etiqueta: string;
      ofertaId: string;
      ofertaNombre: string;
      ofertaTipo: string;
    } | null = null;

    for (const oferta of ofertas) {
      // Verificar limite de usos
      if (oferta.usosMaximos && oferta.usosActuales >= oferta.usosMaximos) {
        continue;
      }

      // Verificar si aplica al producto
      if (!this.ofertaAplicaAProducto(oferta, productoId, productoFamiliaId)) {
        continue;
      }

      // Verificar si aplica al cliente
      if (!this.ofertaAplicaACliente(oferta, clienteId, clienteTarifaId)) {
        continue;
      }

      // Calcular precio con esta oferta
      const resultado = this.calcularOferta(oferta, cantidad, precioBase);

      // Si es mejor que el actual, guardar
      if (!mejorOferta || resultado.precioResultante < mejorOferta.precioResultante) {
        mejorOferta = {
          precioResultante: resultado.precioResultante,
          unidadesGratis: resultado.unidadesGratis,
          etiqueta: resultado.etiqueta,
          ofertaId: oferta._id.toString(),
          ofertaNombre: oferta.nombre,
          ofertaTipo: oferta.tipo,
        };
      }
    }

    return mejorOferta;
  }

  /**
   * Verifica si una oferta aplica a un producto
   */
  private ofertaAplicaAProducto(
    oferta: IOferta,
    productoId: string,
    familiaId?: string
  ): boolean {
    // Si aplica a todos
    if (oferta.aplicaATodos) {
      // Verificar exclusiones
      if (oferta.productosExcluidos?.some(p => p.toString() === productoId)) {
        return false;
      }
      if (familiaId && oferta.familiasExcluidas?.some(f => f.toString() === familiaId)) {
        return false;
      }
      return true;
    }

    // Si esta en productos incluidos
    if (oferta.productosIncluidos?.some(p => p.toString() === productoId)) {
      return true;
    }

    // Si su familia esta incluida
    if (familiaId && oferta.familiasIncluidas?.some(f => f.toString() === familiaId)) {
      // Y no esta excluido individualmente
      if (!oferta.productosExcluidos?.some(p => p.toString() === productoId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si una oferta aplica a un cliente
   */
  private ofertaAplicaACliente(
    oferta: IOferta,
    clienteId?: string,
    tarifaId?: string
  ): boolean {
    if (!clienteId) return oferta.aplicaATodosClientes;

    // Si aplica a todos los clientes
    if (oferta.aplicaATodosClientes) {
      // Verificar exclusiones
      if (oferta.clientesExcluidos?.some(c => c.toString() === clienteId)) {
        return false;
      }
      return true;
    }

    // Si esta en clientes incluidos
    if (oferta.clientesIncluidos?.some(c => c.toString() === clienteId)) {
      return true;
    }

    // Si su tarifa esta incluida
    if (tarifaId && oferta.tarifasIncluidas?.some(t => t.toString() === tarifaId)) {
      return true;
    }

    return false;
  }

  /**
   * Calcula el resultado de aplicar una oferta
   */
  private calcularOferta(
    oferta: IOferta,
    cantidad: number,
    precioUnitario: number
  ): { precioResultante: number; unidadesGratis: number; etiqueta: string } {
    const config = oferta.configuracion;
    let precioResultante = precioUnitario;
    let unidadesGratis = 0;
    let etiqueta = oferta.etiqueta || '';

    // Verificar cantidad minima
    if (config.cantidadMinima && cantidad < config.cantidadMinima) {
      return { precioResultante, unidadesGratis, etiqueta: '' };
    }

    switch (oferta.tipo) {
      case TipoOferta.NXM:
        // Lleva N, paga M (solo grupos completos)
        if (config.cantidadLleva && config.cantidadCompra && config.cantidadLleva > config.cantidadCompra) {
          const gruposCompletos = Math.floor(cantidad / config.cantidadLleva);
          const resto = cantidad % config.cantidadLleva;
          const unidadesPagadas = gruposCompletos * config.cantidadCompra + resto;
          unidadesGratis = cantidad - unidadesPagadas;
          precioResultante = (unidadesPagadas * precioUnitario) / cantidad;
          etiqueta = etiqueta || `${config.cantidadLleva}x${config.cantidadCompra}`;
        }
        break;

      case TipoOferta.SEGUNDA_UNIDAD:
        if (config.descuentoSegundaUnidad && cantidad >= 2) {
          const precioSegunda = precioUnitario * (1 - config.descuentoSegundaUnidad / 100);
          const pares = Math.floor(cantidad / 2);
          const impar = cantidad % 2;
          const totalPares = pares * (precioUnitario + precioSegunda);
          const totalImpar = impar * precioUnitario;
          precioResultante = (totalPares + totalImpar) / cantidad;
          etiqueta = etiqueta || `2a ud. -${config.descuentoSegundaUnidad}%`;
        }
        break;

      case TipoOferta.UNIDAD_GRATIS:
        if (config.cantidadParaGratis && config.unidadesGratis) {
          const gruposCompletos = Math.floor(cantidad / (config.cantidadParaGratis + config.unidadesGratis));
          unidadesGratis = gruposCompletos * config.unidadesGratis;
          const unidadesPagadas = cantidad - unidadesGratis;
          precioResultante = (unidadesPagadas * precioUnitario) / cantidad;
          etiqueta = etiqueta || `${config.cantidadParaGratis}+${config.unidadesGratis}`;
        }
        break;

      case TipoOferta.DESCUENTO_PORCENTAJE:
        if (config.descuento) {
          precioResultante = precioUnitario * (1 - config.descuento / 100);
          etiqueta = etiqueta || `-${config.descuento}%`;
        }
        break;

      case TipoOferta.DESCUENTO_IMPORTE:
        if (config.descuento) {
          precioResultante = Math.max(0, precioUnitario - config.descuento);
          etiqueta = etiqueta || `-${config.descuento}€`;
        }
        break;

      case TipoOferta.PRECIO_ESPECIAL:
        if (config.precioEspecial !== undefined) {
          precioResultante = config.precioEspecial;
          etiqueta = etiqueta || 'Oferta';
        }
        break;

      case TipoOferta.ESCALADO:
        if (config.escalas && config.escalas.length > 0) {
          const escalasOrdenadas = [...config.escalas].sort((a, b) => b.cantidadDesde - a.cantidadDesde);
          const escalaAplicable = escalasOrdenadas.find(e => cantidad >= e.cantidadDesde);
          if (escalaAplicable) {
            precioResultante = precioUnitario * (1 - escalaAplicable.descuento / 100);
            etiqueta = etiqueta || `-${escalaAplicable.descuento}%`;
          }
        }
        break;
    }

    return {
      precioResultante: Math.round(precioResultante * 100) / 100,
      unidadesGratis,
      etiqueta,
    };
  }

  /**
   * Obtiene precios para multiples productos (batch)
   */
  async obtenerPreciosMultiples(
    productos: Array<{ productoId: string; varianteId?: string; cantidad: number }>,
    clienteId: string | undefined,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Map<string, IPrecioCalculado>> {
    const resultados = new Map<string, IPrecioCalculado>();

    for (const item of productos) {
      const key = item.varianteId ? `${item.productoId}:${item.varianteId}` : item.productoId;
      try {
        const precio = await this.obtenerPrecioProducto({
          productoId: item.productoId,
          varianteId: item.varianteId,
          clienteId,
          cantidad: item.cantidad,
          empresaId,
          dbConfig,
        });
        resultados.set(key, precio);
      } catch (error) {
        // Si hay error, usar precio 0
        resultados.set(key, {
          precioBase: 0,
          precioFinal: 0,
          descuentoAplicado: 0,
          origen: 'producto',
        });
      }
    }

    return resultados;
  }
}

// Exportar instancia singleton
export const preciosService = new PreciosService();

export default preciosService;
