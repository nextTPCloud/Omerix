import mongoose, { Model } from 'mongoose';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { databaseManager } from '@/services/database-manager.service';
import {
  ConexionEcommerce,
  SyncLog,
  ConexionEcommerceSchema,
  SyncLogSchema,
  IConexionEcommerce,
  ISyncLog,
  TipoSync,
  DireccionSync,
  EstadoSync,
} from './Ecommerce';
import { getConnector, EcommerceProduct } from './connectors/base.connector';
import { getProductoModel } from '@/utils/dynamic-models.helper';
import { IProducto } from '@/modules/productos/Producto';

export class EcommerceService {
  /**
   * Obtener modelo de ConexionEcommerce para una empresa especifica
   */
  private async getConexionModel(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IConexionEcommerce>> {
    return databaseManager.getModel<IConexionEcommerce>(
      empresaId,
      dbConfig,
      'ConexionEcommerce',
      ConexionEcommerceSchema
    );
  }

  /**
   * Obtener modelo de SyncLog para una empresa especifica
   */
  private async getSyncLogModel(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<ISyncLog>> {
    return databaseManager.getModel<ISyncLog>(
      empresaId,
      dbConfig,
      'SyncLog',
      SyncLogSchema
    );
  }

  // ============================================
  // CRUD CONEXIONES
  // ============================================

  async crearConexion(data: any, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConexionModel = await this.getConexionModel(empresaId, dbConfig);
    const conexion = new ConexionModel({
      ...data,
      empresaId,
    });
    return conexion.save();
  }

  async obtenerConexiones(empresaId: string, dbConfig: IDatabaseConfig) {
    const ConexionModel = await this.getConexionModel(empresaId, dbConfig);
    return ConexionModel.find({ empresaId }).sort({ createdAt: -1 });
  }

  async obtenerConexion(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConexionModel = await this.getConexionModel(empresaId, dbConfig);
    return ConexionModel.findById(id);
  }

  async actualizarConexion(id: string, data: any, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConexionModel = await this.getConexionModel(empresaId, dbConfig);
    return ConexionModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async eliminarConexion(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConexionModel = await this.getConexionModel(empresaId, dbConfig);
    return ConexionModel.findByIdAndDelete(id);
  }

  // ============================================
  // TEST CONEXION
  // ============================================

  async testConexion(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const conexion = await this.obtenerConexion(id, empresaId, dbConfig);
    if (!conexion) throw new Error('Conexion no encontrada');

    const connector = getConnector(conexion.plataforma, conexion.url, conexion.apiKey, conexion.apiSecret);
    return connector.testConnection();
  }

  // ============================================
  // SINCRONIZACION
  // ============================================

  async sincronizar(
    conexionId: string,
    tipo: TipoSync,
    direccion: DireccionSync,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const ConexionModel = await this.getConexionModel(empresaId, dbConfig);
    const SyncLogModel = await this.getSyncLogModel(empresaId, dbConfig);
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    const conexion = await ConexionModel.findById(conexionId);
    if (!conexion) throw new Error('Conexion no encontrada');

    const connector = getConnector(conexion.plataforma, conexion.url, conexion.apiKey, conexion.apiSecret);

    // Crear log de sincronizacion
    const log = new SyncLogModel({
      conexionId,
      tipo,
      direccion,
      estado: EstadoSync.EXITO,
      fechaInicio: new Date(),
      resultados: { total: 0, exitosos: 0, fallidos: 0, omitidos: 0 },
      detalles: [],
      empresaId,
    });

    try {
      if (tipo === TipoSync.PRODUCTOS) {
        if (direccion === DireccionSync.SUBIR || direccion === DireccionSync.BIDIRECCIONAL) {
          // Obtener productos locales marcados para publicar en web
          const productosLocales = await ProductoModel.find({
            activo: true,
            publicarWeb: true,
          }).lean();

          const ecommerceProducts: EcommerceProduct[] = productosLocales.map((p: any) => ({
            sku: p.sku || p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precios?.pvp || p.precios?.venta || 0,
            stock: p.stockPorAlmacen?.reduce((acc: number, s: any) => acc + (s.cantidad || 0), 0) || p.stock?.cantidad || 0,
            activo: p.activo,
          }));

          const result = await connector.pushProducts(ecommerceProducts);
          log.resultados = result;
          log.detalles = result.detalles as any;
        }

        if (direccion === DireccionSync.DESCARGAR || direccion === DireccionSync.BIDIRECCIONAL) {
          // Obtener productos del ecommerce
          const productsFromShop = await connector.getProducts(1, 100);
          log.resultados.total += productsFromShop.length;

          for (const shopProduct of productsFromShop) {
            if (!shopProduct.sku) {
              log.resultados.omitidos++;
              log.detalles.push({
                sku: 'sin-sku',
                accion: 'importar',
                resultado: 'omitido',
                mensaje: 'Producto sin SKU',
              } as any);
              continue;
            }

            // Buscar producto local por SKU
            const productoLocal = await ProductoModel.findOne({
              $or: [{ sku: shopProduct.sku }, { codigoBarras: shopProduct.sku }],
            });

            if (productoLocal && conexion.configuracion.actualizarExistentes) {
              await ProductoModel.findByIdAndUpdate(productoLocal._id, {
                $set: {
                  nombre: shopProduct.nombre,
                  'precios.venta': shopProduct.precio,
                },
              });
              log.resultados.exitosos++;
              log.detalles.push({
                sku: shopProduct.sku,
                accion: 'actualizar-local',
                resultado: 'exito',
              } as any);
            } else if (!productoLocal && conexion.configuracion.crearProductosNuevos) {
              // Creacion automatica de productos pendiente de implementar
              log.resultados.omitidos++;
              log.detalles.push({
                sku: shopProduct.sku,
                accion: 'crear-local',
                resultado: 'omitido',
                mensaje: 'Creacion automatica de productos pendiente de implementar',
              } as any);
            } else {
              log.resultados.omitidos++;
            }
          }
        }
      } else if (tipo === TipoSync.STOCK) {
        if (direccion === DireccionSync.SUBIR || direccion === DireccionSync.BIDIRECCIONAL) {
          const productosLocales = await ProductoModel.find({ activo: true, publicarWeb: true }).lean();
          const stockData = productosLocales.map((p: any) => ({
            sku: p.sku || p.codigo,
            stock: p.stockPorAlmacen?.reduce((acc: number, s: any) => acc + (s.cantidad || 0), 0) || p.stock?.cantidad || 0,
          }));

          const result = await connector.pushStock(stockData);
          log.resultados = result;
          log.detalles = result.detalles as any;
        }
      }

      // Determinar estado final del log
      log.estado = log.resultados.fallidos > 0
        ? (log.resultados.exitosos > 0 ? EstadoSync.PARCIAL : EstadoSync.ERROR)
        : EstadoSync.EXITO;

    } catch (error: any) {
      log.estado = EstadoSync.ERROR;
      log.detalles.push({
        accion: 'sync-general',
        resultado: 'error',
        mensaje: error.message,
      } as any);
    }

    log.fechaFin = new Date();
    await log.save();

    // Actualizar estadisticas y ultima sync de la conexion
    const updateData: any = {
      ultimaSync: new Date(),
      'estadisticas.productosSync': log.resultados.exitosos,
    };

    if (log.estado === EstadoSync.ERROR) {
      updateData['estadisticas.ultimoError'] = log.detalles[0]?.mensaje || 'Error desconocido';
      updateData['estadisticas.ultimoErrorFecha'] = new Date();
    }

    await ConexionModel.findByIdAndUpdate(conexionId, { $set: updateData });

    return log;
  }

  // ============================================
  // LOGS
  // ============================================

  async obtenerLogs(conexionId: string, empresaId: string, dbConfig: IDatabaseConfig, limit = 20) {
    const SyncLogModel = await this.getSyncLogModel(empresaId, dbConfig);
    return SyncLogModel.find({ conexionId })
      .sort({ fechaInicio: -1 })
      .limit(limit);
  }
}

export const ecommerceService = new EcommerceService();
