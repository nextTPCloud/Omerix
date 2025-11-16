import { Model } from 'mongoose';
import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../models/Empresa';
import { Cliente, ICliente } from '../modules/clientes/Cliente';
import VistaGuardada, { IVistaGuardada } from '../modules/vistasGuardadas/VistaGuardada';

/**
 * Helper para obtener modelos dinámicos por empresa
 * Cada empresa tiene su propia base de datos
 */

/**
 * Obtener modelo de Cliente para una empresa específica
 */
export const getClienteModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ICliente>> => {
  const ClienteSchema = Cliente.schema;
  return databaseManager.getModel<ICliente>(
    empresaId,
    dbConfig,
    'Cliente',
    ClienteSchema
  );
};

/**
 * Obtener modelo de VistaGuardada para una empresa específica
 */
export const getVistaGuardadaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IVistaGuardada>> => {
  const VistaGuardadaSchema = VistaGuardada.schema;
  return databaseManager.getModel<IVistaGuardada>(
    empresaId,
    dbConfig,
    'VistaGuardada',
    VistaGuardadaSchema
  );
};

/**
 * Objeto con todos los modelos por empresa
 * Se puede extender con más modelos según sea necesario
 */
export const EmpresaModels = {
  Cliente: getClienteModel,
  VistaGuardada: getVistaGuardadaModel,
  // Aquí se añadirán más modelos:
  // Producto: getProductoModel,
  // Proveedor: getProveedorModel,
  // Presupuesto: getPresupuestoModel,
  // etc.
};

/**
 * Tipos de modelos disponibles por empresa
 */
export type EmpresaModelType = keyof typeof EmpresaModels;