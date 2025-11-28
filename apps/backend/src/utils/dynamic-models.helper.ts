import { Model } from 'mongoose';
import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../models/Empresa';
import { Cliente, ICliente } from '../modules/clientes/Cliente';
import VistaGuardada, { IVistaGuardada } from '../modules/vistasGuardadas/VistaGuardada';
import { Producto, IProducto } from '../models/Producto';
import { Familia, IFamilia } from '../modules/familias/Familia';
import { Estado, IEstado } from '../modules/estados/Estado';
import { Situacion, ISituacion } from '../modules/situaciones/Situacion';
import { Clasificacion, IClasificacion } from '../modules/clasificaciones/Clasificacion';
import { TipoImpuesto, ITipoImpuesto } from '../models/TipoImpuesto';
import { Variante, IVariante } from '../models/Variante';
import { Almacen, IAlmacen } from '../models/Almacen';
import { Impresora, IImpresora } from '../models/Impresora';
import { ZonaPreparacion, IZonaPreparacion } from '../models/ZonaPreparacion';
import { ModificadorProducto, IModificadorProducto } from '../models/ModificadorProducto';
import { GrupoModificadores, IGrupoModificadores } from '../models/GrupoModificadores';
import { Alergeno, IAlergeno } from '../models/Alergeno';

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
 * Obtener modelo de Estado para una empresa específica
 */
export const getEstadoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IEstado>> => {
  const EstadoSchema = Estado.schema;
  return databaseManager.getModel<IEstado>(
    empresaId,
    dbConfig,
    'Estado',
    EstadoSchema
  );
};

/**
 * Obtener modelo de Situacion para una empresa específica
 */
export const getSituacionModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISituacion>> => {
  const SituacionSchema = Situacion.schema;
  return databaseManager.getModel<ISituacion>(
    empresaId,
    dbConfig,
    'Situacion',
    SituacionSchema
  );
};

/**
 * Obtener modelo de Clasificacion para una empresa específica
 */
export const getClasificacionModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IClasificacion>> => {
  const ClasificacionSchema = Clasificacion.schema;
  return databaseManager.getModel<IClasificacion>(
    empresaId,
    dbConfig,
    'Clasificacion',
    ClasificacionSchema
  );
};

/**
 * Obtener modelo de TipoImpuesto para una empresa específica
 */
export const getTiposImpuestoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITipoImpuesto>> => {
  const TipoImpuestoSchema = TipoImpuesto.schema;
  return databaseManager.getModel<ITipoImpuesto>(
    empresaId,
    dbConfig,
    'TipoImpuesto',
    TipoImpuestoSchema
  );
};

/**
 * Obtener modelo de Variante para una empresa específica
 */
export const getVarianteModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IVariante>> => {
  const VarianteSchema = Variante.schema;
  return databaseManager.getModel<IVariante>(
    empresaId,
    dbConfig,
    'Variante',
    VarianteSchema
  );
};

/**
 * Obtener modelo de Almacen para una empresa específica
 */
export const getAlmacenModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAlmacen>> => {
  const AlmacenSchema = Almacen.schema;
  return databaseManager.getModel<IAlmacen>(
    empresaId,
    dbConfig,
    'Almacen',
    AlmacenSchema
  );
};

/**
 * Obtener modelo de Impresora para una empresa específica
 */
export const getImpresoraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IImpresora>> => {
  const ImpresoraSchema = Impresora.schema;
  return databaseManager.getModel<IImpresora>(
    empresaId,
    dbConfig,
    'Impresora',
    ImpresoraSchema
  );
};

/**
 * Obtener modelo de ZonaPreparacion para una empresa específica
 */
export const getZonaPreparacionModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IZonaPreparacion>> => {
  const ZonaPreparacionSchema = ZonaPreparacion.schema;
  return databaseManager.getModel<IZonaPreparacion>(
    empresaId,
    dbConfig,
    'ZonaPreparacion',
    ZonaPreparacionSchema
  );
};

/**
 * Obtener modelo de ModificadorProducto para una empresa específica
 */
export const getModificadorProductoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IModificadorProducto>> => {
  const ModificadorProductoSchema = ModificadorProducto.schema;
  return databaseManager.getModel<IModificadorProducto>(
    empresaId,
    dbConfig,
    'ModificadorProducto',
    ModificadorProductoSchema
  );
};

/**
 * Obtener modelo de GrupoModificadores para una empresa específica
 */
export const getGrupoModificadoresModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IGrupoModificadores>> => {
  const GrupoModificadoresSchema = GrupoModificadores.schema;
  return databaseManager.getModel<IGrupoModificadores>(
    empresaId,
    dbConfig,
    'GrupoModificadores',
    GrupoModificadoresSchema
  );
};

/**
 * Obtener modelo de Alergeno para una empresa específica
 */
export const getAlergenoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAlergeno>> => {
  const AlergenoSchema = Alergeno.schema;
  return databaseManager.getModel<IAlergeno>(
    empresaId,
    dbConfig,
    'Alergeno',
    AlergenoSchema
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
  Estado: getEstadoModel,
  Situacion: getSituacionModel,
  Clasificacion: getClasificacionModel,
  TipoImpuesto: getTiposImpuestoModel,
  Variante: getVarianteModel,
  Almacen: getAlmacenModel,
  Impresora: getImpresoraModel,
  ZonaPreparacion: getZonaPreparacionModel,
  ModificadorProducto: getModificadorProductoModel,
  GrupoModificadores: getGrupoModificadoresModel,
  Alergeno: getAlergenoModel,
};

/**
 * Tipos de modelos disponibles por empresa
 */
export type EmpresaModelType = keyof typeof EmpresaModels;