import { Model } from 'mongoose';
import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../models/Empresa';
import { Cliente, ICliente } from '../modules/clientes/Cliente';
import VistaGuardada, { IVistaGuardada } from '../modules/vistasGuardadas/VistaGuardada';
import { Producto, IProducto } from '../models/Producto';
import { Familia, IFamilia } from '../modules/familias/Familia';

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
 * Obtener modelo de Producto para una empresa específica
 */
export const getProductoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IProducto>> => {
  const ProductoSchema = Producto.schema;
  return databaseManager.getModel<IProducto>(
    empresaId,
    dbConfig,
    'Producto',
    ProductoSchema
  );
};

/**
 * Obtener modelo de Familia para una empresa específica
 */
export const getFamiliaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IFamilia>> => {
  const FamiliaSchema = Familia.schema;
  return databaseManager.getModel<IFamilia>(
    empresaId,
    dbConfig,
    'Familia',
    FamiliaSchema
  );
};

/**
 * Objeto con todos los modelos por empresa
 * Se puede extender con más modelos según sea necesario
 */
export const EmpresaModels = {
  Cliente: getClienteModel,
  VistaGuardada: getVistaGuardadaModel,
  Producto: getProductoModel,
  Familia: getFamiliaModel,
  // Aquí se añadirán más modelos según sea necesario:
  // Proveedor: getProveedorModel,
  // Presupuesto: getPresupuestoModel,
  // etc.
};

/**
 * Tipos de modelos disponibles por empresa
 */
export type EmpresaModelType = keyof typeof EmpresaModels;