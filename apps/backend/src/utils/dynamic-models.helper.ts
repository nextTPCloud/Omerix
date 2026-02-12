import mongoose, { Model, Schema } from 'mongoose';
import { databaseManager } from '../services/database-manager.service';
import Empresa, { IDatabaseConfig } from '../modules/empresa/Empresa';
import { Cliente, ICliente } from '../modules/clientes/Cliente';
import VistaGuardada, { IVistaGuardada } from '../modules/vistasGuardadas/VistaGuardada';
import { Producto, IProducto } from '../modules/productos/Producto';
import { Familia, IFamilia } from '../modules/familias/Familia';
import { Estado, IEstado } from '../modules/estados/Estado';
import { Situacion, ISituacion } from '../modules/situaciones/Situacion';
import { Clasificacion, IClasificacion } from '../modules/clasificaciones/Clasificacion';
import { TipoImpuesto, ITipoImpuesto } from '../modules/tipos-impuesto/TipoImpuesto';
import { Variante, IVariante } from '../modules/variantes/Variante';
import { Almacen, IAlmacen } from '../modules/almacenes/Almacen';
import { Impresora, IImpresora } from '../modules/impresoras/Impresora';
import { ZonaPreparacion, IZonaPreparacion } from '../modules/zonas-preparacion/ZonaPreparacion';
import { ModificadorProducto, IModificadorProducto } from '../modules/modificadores/ModificadorProducto';
import { GrupoModificadores, IGrupoModificadores } from '../modules/grupos-modificadores/GrupoModificadores';
import { Alergeno, IAlergeno } from '../modules/alergenos/Alergeno';
import { Salon, ISalon } from '../modules/salones/Salon';
import { Mesa, IMesa } from '../modules/salones/Mesa';
import { ComandaCocina, IComandaCocina } from '../modules/comandas-cocina/ComandaCocina';
import { Camarero, ICamarero } from '../modules/camareros/Camarero';
import { Sugerencia, ISugerencia } from '../modules/sugerencias/Sugerencia';
import { Reserva, IReserva } from '../modules/reservas/Reserva';
import { TerminoPago, ITerminoPago } from '../modules/terminos-pago/TerminoPago';
import { FormaPago, IFormaPago } from '../modules/formas-pago/FormaPago';
import { Vencimiento, IVencimiento } from '../models/Vencimiento';
import { Pagare, IPagare } from '../modules/tesoreria/Pagare';
import { Recibo, IRecibo } from '../modules/tesoreria/Recibo';
import MovimientoBancario, { IMovimientoBancario } from '../modules/tesoreria/models/MovimientoBancario';
import CuentaBancaria, { ICuentaBancaria } from '../modules/cuentas-bancarias/models/CuentaBancaria';
import { Personal, IPersonal } from '../modules/personal/Personal';
import { AgenteComercial, IAgenteComercial } from '../modules/agentes-comerciales/AgenteComercial';
import { Proyecto, IProyecto } from '../modules/proyectos/Proyecto';
import { Presupuesto, IPresupuesto } from '../modules/presupuestos/Presupuesto';
import { Pedido, IPedido } from '../modules/pedidos/Pedido';
import { Albaran, IAlbaran } from '../modules/albaranes/Albaran';
import { Factura, IFactura } from '../modules/facturas/Factura';
import { Proveedor, IProveedor } from '../modules/proveedores/Proveedor';
import Usuario, { IUsuario } from '../modules/usuarios/Usuario';
import { MovimientoStock, IMovimientoStock } from '../models/MovimientoStock';
import { PedidoCompra, IPedidoCompra } from '../modules/pedidos-compra/PedidoCompra';
import { AlbaranCompra, IAlbaranCompra } from '../modules/albaranes-compra/AlbaranCompra';
import { FacturaCompra, IFacturaCompra } from '../modules/facturas-compra/FacturaCompra';
import { TipoGasto, ITipoGasto } from '../modules/tipos-gasto/TipoGasto';
import { Maquinaria, IMaquinaria } from '../modules/maquinaria/Maquinaria';
import { ParteTrabajo, IParteTrabajo } from '../modules/partes-trabajo/ParteTrabajo';
import { Tarifa, ITarifa } from '../modules/tarifas/Tarifa';
import { Oferta, IOferta } from '../modules/ofertas/Oferta';
import { Dashboard, IDashboard } from '../modules/dashboard/Dashboard';
import { Inventario, IInventario } from '../modules/inventarios/Inventario';
import { Traspaso, ITraspaso } from '../modules/traspasos/Traspaso';
import { PresupuestoCompra, IPresupuestoCompra } from '../modules/presupuestos-compra/PresupuestoCompra';
import { TPVRegistradoSchema, ITPVRegistrado } from '../modules/tpv/TPVRegistrado';
import { SesionTPVSchema, ISesionTPV } from '../modules/tpv/SesionTPV';
import MovimientoExtracto, { IMovimientoExtracto } from '../modules/tesoreria/models/MovimientoExtracto';
import ImportacionExtracto, { IImportacionExtracto } from '../modules/tesoreria/models/ImportacionExtracto';
// Contabilidad
import CuentaContable, { ICuentaContable } from '../modules/contabilidad/models/PlanCuentas';
import AsientoContable, { IAsientoContable } from '../modules/contabilidad/models/AsientoContable';
import ConfigContable, { IConfigContable } from '../modules/contabilidad/models/ConfigContable';
// CRM
import Lead, { ILead } from '../modules/crm/Lead';
import EtapaPipeline, { IEtapaPipeline } from '../modules/crm/EtapaPipeline';
import Oportunidad, { IOportunidad } from '../modules/crm/Oportunidad';
import Actividad, { IActividad } from '../modules/crm/Actividad';
// Kiosk
import { KioskRegistradoSchema, IKioskRegistrado } from '../modules/kiosk/KioskRegistrado';
import { PedidoKioskSchema, IPedidoKiosk } from '../modules/kiosk/PedidoKiosk';
import { SesionKioskSchema, ISesionKiosk } from '../modules/kiosk/SesionKiosk';
// Plantillas Documento
import PlantillaDocumentoModel, { IPlantillaDocumento } from '../modules/plantillas-documento/PlantillaDocumento';
// Firmas
import { FirmaSchema, IFirma } from '../modules/firmas/Firma';
import { SolicitudFirmaSchema, ISolicitudFirma } from '../modules/firmas/SolicitudFirma';
// Turnos Servicio (restauración)
import { TurnoServicio, ITurnoServicio } from '../modules/turnos-servicio/TurnoServicio';
// Restoo (integración reservas)
import {
  RestooConnection, IRestooConnection,
  RestooSyncLog, IRestooSyncLog,
  RestooMapeoSalon, IRestooMapeoSalon,
} from '../modules/integraciones/restoo/RestooConnection';

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
 * Obtener modelo de Salon para una empresa específica
 */
export const getSalonModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISalon>> => {
  const SalonSchema = Salon.schema;
  return databaseManager.getModel<ISalon>(
    empresaId,
    dbConfig,
    'Salon',
    SalonSchema
  );
};

/**
 * Obtener modelo de Mesa para una empresa específica
 */
export const getMesaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IMesa>> => {
  const MesaSchema = Mesa.schema;
  return databaseManager.getModel<IMesa>(
    empresaId,
    dbConfig,
    'Mesa',
    MesaSchema
  );
};

/**
 * Obtener modelo de ComandaCocina para una empresa específica
 */
export const getComandaCocinaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IComandaCocina>> => {
  const ComandaCocinaSchema = ComandaCocina.schema;
  return databaseManager.getModel<IComandaCocina>(
    empresaId,
    dbConfig,
    'ComandaCocina',
    ComandaCocinaSchema
  );
};

/**
 * Obtener modelo de Camarero para una empresa específica
 */
export const getCamareroModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ICamarero>> => {
  const CamareroSchema = Camarero.schema;
  return databaseManager.getModel<ICamarero>(
    empresaId,
    dbConfig,
    'Camarero',
    CamareroSchema
  );
};

/**
 * Obtener modelo de Sugerencia para una empresa específica
 */
export const getSugerenciaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISugerencia>> => {
  const SugerenciaSchema = Sugerencia.schema;
  return databaseManager.getModel<ISugerencia>(
    empresaId,
    dbConfig,
    'Sugerencia',
    SugerenciaSchema
  );
};

/**
 * Obtener modelo de Reserva para una empresa específica
 */
export const getReservaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IReserva>> => {
  const ReservaSchema = Reserva.schema;
  return databaseManager.getModel<IReserva>(
    empresaId,
    dbConfig,
    'Reserva',
    ReservaSchema
  );
};

/**
 * Obtener modelo de TerminoPago para una empresa específica
 */
export const getTerminoPagoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITerminoPago>> => {
  const TerminoPagoSchema = TerminoPago.schema;
  return databaseManager.getModel<ITerminoPago>(
    empresaId,
    dbConfig,
    'TerminoPago',
    TerminoPagoSchema
  );
};

/**
 * Obtener modelo de FormaPago para una empresa específica
 */
export const getFormaPagoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IFormaPago>> => {
  const FormaPagoSchema = FormaPago.schema;
  return databaseManager.getModel<IFormaPago>(
    empresaId,
    dbConfig,
    'FormaPago',
    FormaPagoSchema
  );
};

/**
 * Obtener modelo de Vencimiento para una empresa específica
 */
export const getVencimientoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IVencimiento>> => {
  const VencimientoSchema = Vencimiento.schema;
  return databaseManager.getModel<IVencimiento>(
    empresaId,
    dbConfig,
    'Vencimiento',
    VencimientoSchema
  );
};

/**
 * Obtener modelo de Pagaré para una empresa específica
 */
export const getPagareModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPagare>> => {
  const PagareSchema = Pagare.schema;
  return databaseManager.getModel<IPagare>(
    empresaId,
    dbConfig,
    'Pagare',
    PagareSchema
  );
};

/**
 * Obtener modelo de Recibo para una empresa específica
 */
export const getReciboModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IRecibo>> => {
  const ReciboSchema = Recibo.schema;
  return databaseManager.getModel<IRecibo>(
    empresaId,
    dbConfig,
    'Recibo',
    ReciboSchema
  );
};

/**
 * Obtener modelo de MovimientoBancario para una empresa específica
 */
export const getMovimientoBancarioModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IMovimientoBancario>> => {
  const MovimientoBancarioSchema = MovimientoBancario.schema;
  return databaseManager.getModel<IMovimientoBancario>(
    empresaId,
    dbConfig,
    'MovimientoBancario',
    MovimientoBancarioSchema
  );
};

/**
 * Obtener modelo de CuentaBancaria para una empresa específica
 */
export const getCuentaBancariaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ICuentaBancaria>> => {
  const CuentaBancariaSchema = CuentaBancaria.schema;
  return databaseManager.getModel<ICuentaBancaria>(
    empresaId,
    dbConfig,
    'CuentaBancaria',
    CuentaBancariaSchema
  );
};

/**
 * Obtener modelo de Personal para una empresa específica
 */
export const getPersonalModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPersonal>> => {
  const PersonalSchema = Personal.schema;
  return databaseManager.getModel<IPersonal>(
    empresaId,
    dbConfig,
    'Personal',
    PersonalSchema
  );
};

/**
 * Obtener modelo de AgenteComercial para una empresa específica
 */
export const getAgenteComercialModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAgenteComercial>> => {
  const AgenteComercialSchema = AgenteComercial.schema;
  return databaseManager.getModel<IAgenteComercial>(
    empresaId,
    dbConfig,
    'AgenteComercial',
    AgenteComercialSchema
  );
};

/**
 * Obtener modelo de Proyecto para una empresa específica
 */
export const getProyectoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IProyecto>> => {
  const ProyectoSchema = Proyecto.schema;
  return databaseManager.getModel<IProyecto>(
    empresaId,
    dbConfig,
    'Proyecto',
    ProyectoSchema
  );
};

/**
 * Obtener modelo de Presupuesto para una empresa específica
 */
export const getPresupuestoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPresupuesto>> => {
  const PresupuestoSchema = Presupuesto.schema;
  return databaseManager.getModel<IPresupuesto>(
    empresaId,
    dbConfig,
    'Presupuesto',
    PresupuestoSchema
  );
};

/**
 * Obtener modelo de Pedido para una empresa específica
 */
export const getPedidoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPedido>> => {
  const PedidoSchema = Pedido.schema;
  return databaseManager.getModel<IPedido>(
    empresaId,
    dbConfig,
    'Pedido',
    PedidoSchema
  );
};

/**
 * Obtener modelo de Albaran para una empresa específica
 */
export const getAlbaranModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAlbaran>> => {
  const AlbaranSchema = Albaran.schema;
  return databaseManager.getModel<IAlbaran>(
    empresaId,
    dbConfig,
    'Albaran',
    AlbaranSchema
  );
};

/**
 * Obtener modelo de Factura para una empresa específica
 */
export const getFacturaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IFactura>> => {
  const FacturaSchema = Factura.schema;
  return databaseManager.getModel<IFactura>(
    empresaId,
    dbConfig,
    'Factura',
    FacturaSchema
  );
};

/**
 * Obtener modelo de PlantillaPresupuesto para una empresa específica
 */
import PlantillaPresupuesto, { IPlantillaPresupuesto } from '@/modules/presupuestos/PlantillaPresupuesto';
import { SerieDocumento, ISerieDocumento } from '@/modules/series-documentos/SerieDocumento';

export const getPlantillaPresupuestoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPlantillaPresupuesto>> => {
  const PlantillaPresupuestoSchema = PlantillaPresupuesto.schema;
  return databaseManager.getModel<IPlantillaPresupuesto>(
    empresaId,
    dbConfig,
    'PlantillaPresupuesto',
    PlantillaPresupuestoSchema
  );
};

/**
 * Obtener modelo de SerieDocumento para una empresa específica
 */
export const getSerieDocumentoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISerieDocumento>> => {
  const SerieDocumentoSchema = SerieDocumento.schema;
  return databaseManager.getModel<ISerieDocumento>(
    empresaId,
    dbConfig,
    'SerieDocumento',
    SerieDocumentoSchema
  );
};

/**
 * Obtener modelo de Usuario para una empresa específica
 */
export const getUserModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IUsuario>> => {
  const UsuarioSchema = Usuario.schema;
  return databaseManager.getModel<IUsuario>(
    empresaId,
    dbConfig,
    'Usuario',
    UsuarioSchema
  );
};

/**
 * Obtener modelo de Proveedor para una empresa específica
 */
export const getProveedorModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IProveedor>> => {
  const ProveedorSchema = Proveedor.schema;
  return databaseManager.getModel<IProveedor>(
    empresaId,
    dbConfig,
    'Proveedor',
    ProveedorSchema
  );
};

/**
 * Obtener modelo de MovimientoStock para una empresa específica
 */
export const getMovimientoStockModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IMovimientoStock>> => {
  const MovimientoStockSchema = MovimientoStock.schema;
  return databaseManager.getModel<IMovimientoStock>(
    empresaId,
    dbConfig,
    'MovimientoStock',
    MovimientoStockSchema
  );
};

/**
 * Obtener modelo de PedidoCompra para una empresa específica
 */
export const getPedidoCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPedidoCompra>> => {
  const PedidoCompraSchema = PedidoCompra.schema;
  return databaseManager.getModel<IPedidoCompra>(
    empresaId,
    dbConfig,
    'PedidoCompra',
    PedidoCompraSchema
  );
};

/**
 * Obtener modelo de AlbaranCompra para una empresa específica
 */
export const getAlbaranCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAlbaranCompra>> => {
  const AlbaranCompraSchema = AlbaranCompra.schema;
  return databaseManager.getModel<IAlbaranCompra>(
    empresaId,
    dbConfig,
    'AlbaranCompra',
    AlbaranCompraSchema
  );
};

/**
 * Obtener modelo de FacturaCompra para una empresa específica
 */
export const getFacturaCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IFacturaCompra>> => {
  const FacturaCompraSchema = FacturaCompra.schema;
  return databaseManager.getModel<IFacturaCompra>(
    empresaId,
    dbConfig,
    'FacturaCompra',
    FacturaCompraSchema
  );
};

/**
 * Obtener modelo de TipoGasto para una empresa específica
 */
export const getTipoGastoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITipoGasto>> => {
  const TipoGastoSchema = TipoGasto.schema;
  return databaseManager.getModel<ITipoGasto>(
    empresaId,
    dbConfig,
    'TipoGasto',
    TipoGastoSchema
  );
};

/**
 * Obtener modelo de Maquinaria para una empresa específica
 */
export const getMaquinariaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IMaquinaria>> => {
  const MaquinariaSchema = Maquinaria.schema;
  return databaseManager.getModel<IMaquinaria>(
    empresaId,
    dbConfig,
    'Maquinaria',
    MaquinariaSchema
  );
};

/**
 * Obtener modelo de ParteTrabajo para una empresa específica
 */
export const getParteTrabajoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IParteTrabajo>> => {
  const ParteTrabajoSchema = ParteTrabajo.schema;
  return databaseManager.getModel<IParteTrabajo>(
    empresaId,
    dbConfig,
    'ParteTrabajo',
    ParteTrabajoSchema
  );
};

/**
 * Obtener modelo de Tarifa para una empresa específica
 */
export const getTarifaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITarifa>> => {
  const TarifaSchema = Tarifa.schema;
  return databaseManager.getModel<ITarifa>(
    empresaId,
    dbConfig,
    'Tarifa',
    TarifaSchema
  );
};

/**
 * Obtener modelo de Oferta para una empresa específica
 */
export const getOfertaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IOferta>> => {
  const OfertaSchema = Oferta.schema;
  return databaseManager.getModel<IOferta>(
    empresaId,
    dbConfig,
    'Oferta',
    OfertaSchema
  );
};

/**
 * Obtener modelo de Dashboard para una empresa específica
 */
export const getDashboardModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IDashboard>> => {
  const DashboardSchema = Dashboard.schema;
  return databaseManager.getModel<IDashboard>(
    empresaId,
    dbConfig,
    'Dashboard',
    DashboardSchema
  );
};

/**
 * Obtener modelo de Inventario para una empresa específica
 */
export const getInventarioModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IInventario>> => {
  const InventarioSchema = Inventario.schema;
  return databaseManager.getModel<IInventario>(
    empresaId,
    dbConfig,
    'Inventario',
    InventarioSchema
  );
};

/**
 * Obtener modelo de Traspaso para una empresa específica
 */
export const getTraspasoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITraspaso>> => {
  const TraspasoSchema = Traspaso.schema;
  return databaseManager.getModel<ITraspaso>(
    empresaId,
    dbConfig,
    'Traspaso',
    TraspasoSchema
  );
};

/**
 * Obtener modelo de PresupuestoCompra para una empresa específica
 */
export const getPresupuestoCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPresupuestoCompra>> => {
  const PresupuestoCompraSchema = PresupuestoCompra.schema;
  return databaseManager.getModel<IPresupuestoCompra>(
    empresaId,
    dbConfig,
    'PresupuestoCompra',
    PresupuestoCompraSchema
  );
};

/**
 * Obtener modelo de TPVRegistrado para una empresa específica
 */
export const getTPVRegistradoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITPVRegistrado>> => {
  return databaseManager.getModel<ITPVRegistrado>(
    empresaId,
    dbConfig,
    'TPVRegistrado',
    TPVRegistradoSchema
  );
};

/**
 * Obtener modelo de SesionTPV para una empresa específica
 */
export const getSesionTPVModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISesionTPV>> => {
  return databaseManager.getModel<ISesionTPV>(
    empresaId,
    dbConfig,
    'SesionTPV',
    SesionTPVSchema
  );
};

/**
 * Obtener modelo de MovimientoExtracto para una empresa específica
 */
export const getMovimientoExtractoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IMovimientoExtracto>> => {
  const MovimientoExtractoSchema = MovimientoExtracto.schema;
  return databaseManager.getModel<IMovimientoExtracto>(
    empresaId,
    dbConfig,
    'MovimientoExtracto',
    MovimientoExtractoSchema
  );
};

/**
 * Obtener modelo de ImportacionExtracto para una empresa específica
 */
export const getImportacionExtractoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IImportacionExtracto>> => {
  const ImportacionExtractoSchema = ImportacionExtracto.schema;
  return databaseManager.getModel<IImportacionExtracto>(
    empresaId,
    dbConfig,
    'ImportacionExtracto',
    ImportacionExtractoSchema
  );
};

// ============================================
// CONTABILIDAD
// ============================================

/**
 * Obtener modelo de CuentaContable para una empresa específica
 */
export const getCuentaContableModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ICuentaContable>> => {
  const CuentaContableSchema = CuentaContable.schema;
  return databaseManager.getModel<ICuentaContable>(
    empresaId,
    dbConfig,
    'CuentaContable',
    CuentaContableSchema
  );
};

/**
 * Obtener modelo de AsientoContable para una empresa específica
 */
export const getAsientoContableModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAsientoContable>> => {
  const AsientoContableSchema = AsientoContable.schema;
  return databaseManager.getModel<IAsientoContable>(
    empresaId,
    dbConfig,
    'AsientoContable',
    AsientoContableSchema
  );
};

/**
 * Obtener modelo de ConfigContable para una empresa específica
 */
export const getConfigContableModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IConfigContable>> => {
  const ConfigContableSchema = ConfigContable.schema;
  return databaseManager.getModel<IConfigContable>(
    empresaId,
    dbConfig,
    'ConfigContable',
    ConfigContableSchema
  );
};

// ============================================
// CRM
// ============================================

/**
 * Obtener modelo de Lead para una empresa específica
 */
export const getLeadModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ILead>> => {
  const LeadSchema = Lead.schema;
  return databaseManager.getModel<ILead>(
    empresaId,
    dbConfig,
    'Lead',
    LeadSchema
  );
};

/**
 * Obtener modelo de EtapaPipeline para una empresa específica
 */
export const getEtapaPipelineModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IEtapaPipeline>> => {
  const EtapaPipelineSchema = EtapaPipeline.schema;
  return databaseManager.getModel<IEtapaPipeline>(
    empresaId,
    dbConfig,
    'EtapaPipeline',
    EtapaPipelineSchema
  );
};

/**
 * Obtener modelo de Oportunidad para una empresa específica
 */
export const getOportunidadModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IOportunidad>> => {
  const OportunidadSchema = Oportunidad.schema;
  return databaseManager.getModel<IOportunidad>(
    empresaId,
    dbConfig,
    'Oportunidad',
    OportunidadSchema
  );
};

/**
 * Obtener modelo de Actividad CRM para una empresa específica
 */
export const getActividadCRMModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IActividad>> => {
  const ActividadSchema = Actividad.schema;
  return databaseManager.getModel<IActividad>(
    empresaId,
    dbConfig,
    'ActividadCRM',
    ActividadSchema
  );
};

// ============================================
// KIOSK
// ============================================

/**
 * Obtener modelo de KioskRegistrado para una empresa específica
 */
export const getKioskRegistradoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IKioskRegistrado>> => {
  return databaseManager.getModel<IKioskRegistrado>(
    empresaId,
    dbConfig,
    'KioskRegistrado',
    KioskRegistradoSchema
  );
};

/**
 * Obtener modelo de PedidoKiosk para una empresa específica
 */
export const getPedidoKioskModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPedidoKiosk>> => {
  return databaseManager.getModel<IPedidoKiosk>(
    empresaId,
    dbConfig,
    'PedidoKiosk',
    PedidoKioskSchema
  );
};

/**
 * Obtener modelo de SesionKiosk para una empresa específica
 */
export const getSesionKioskModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISesionKiosk>> => {
  return databaseManager.getModel<ISesionKiosk>(
    empresaId,
    dbConfig,
    'SesionKiosk',
    SesionKioskSchema
  );
};

// ============================================
// PLANTILLAS DOCUMENTO
// ============================================

/**
 * Obtener modelo de PlantillaDocumento para una empresa específica
 */
export const getPlantillaDocumentoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPlantillaDocumento>> => {
  const PlantillaDocumentoSchema = PlantillaDocumentoModel.schema;
  return databaseManager.getModel<IPlantillaDocumento>(
    empresaId,
    dbConfig,
    'PlantillaDocumento',
    PlantillaDocumentoSchema
  );
};

// ============================================
// FIRMAS
// ============================================

export const getFirmaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IFirma>> => {
  return databaseManager.getModel<IFirma>(
    empresaId,
    dbConfig,
    'Firma',
    FirmaSchema
  );
};

export const getSolicitudFirmaModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ISolicitudFirma>> => {
  return databaseManager.getModel<ISolicitudFirma>(
    empresaId,
    dbConfig,
    'SolicitudFirma',
    SolicitudFirmaSchema
  );
};

// ============================================
// TURNOS SERVICIO (restauración)
// ============================================

export const getTurnoServicioModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITurnoServicio>> => {
  const TurnoServicioSchema = TurnoServicio.schema;
  return databaseManager.getModel<ITurnoServicio>(
    empresaId,
    dbConfig,
    'TurnoServicio',
    TurnoServicioSchema
  );
};

// ============================================
// RESTOO (integración reservas)
// ============================================

export const getRestooConnectionModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IRestooConnection>> => {
  const schema = RestooConnection.schema;
  return databaseManager.getModel<IRestooConnection>(
    empresaId,
    dbConfig,
    'RestooConnection',
    schema
  );
};

export const getRestooSyncLogModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IRestooSyncLog>> => {
  const schema = RestooSyncLog.schema;
  return databaseManager.getModel<IRestooSyncLog>(
    empresaId,
    dbConfig,
    'RestooSyncLog',
    schema
  );
};

export const getRestooMapeoSalonModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IRestooMapeoSalon>> => {
  const schema = RestooMapeoSalon.schema;
  return databaseManager.getModel<IRestooMapeoSalon>(
    empresaId,
    dbConfig,
    'RestooMapeoSalon',
    schema
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
  Salon: getSalonModel,
  Mesa: getMesaModel,
  ComandaCocina: getComandaCocinaModel,
  Camarero: getCamareroModel,
  Sugerencia: getSugerenciaModel,
  Reserva: getReservaModel,
  TerminoPago: getTerminoPagoModel,
  FormaPago: getFormaPagoModel,
  Vencimiento: getVencimientoModel,
  Pagare: getPagareModel,
  Recibo: getReciboModel,
  MovimientoBancario: getMovimientoBancarioModel,
  CuentaBancaria: getCuentaBancariaModel,
  Personal: getPersonalModel,
  AgenteComercial: getAgenteComercialModel,
  Proyecto: getProyectoModel,
  Presupuesto: getPresupuestoModel,
  Pedido: getPedidoModel,
  Albaran: getAlbaranModel,
  Factura: getFacturaModel,
  SerieDocumento: getSerieDocumentoModel,
  Usuario: getUserModel,
  Proveedor: getProveedorModel,
  MovimientoStock: getMovimientoStockModel,
  PedidoCompra: getPedidoCompraModel,
  AlbaranCompra: getAlbaranCompraModel,
  FacturaCompra: getFacturaCompraModel,
  TipoGasto: getTipoGastoModel,
  Maquinaria: getMaquinariaModel,
  ParteTrabajo: getParteTrabajoModel,
  Tarifa: getTarifaModel,
  Oferta: getOfertaModel,
  Inventario: getInventarioModel,
  Traspaso: getTraspasoModel,
  PresupuestoCompra: getPresupuestoCompraModel,
  TPVRegistrado: getTPVRegistradoModel,
  SesionTPV: getSesionTPVModel,
  MovimientoExtracto: getMovimientoExtractoModel,
  ImportacionExtracto: getImportacionExtractoModel,
  // Contabilidad
  CuentaContable: getCuentaContableModel,
  AsientoContable: getAsientoContableModel,
  ConfigContable: getConfigContableModel,
  // CRM
  Lead: getLeadModel,
  EtapaPipeline: getEtapaPipelineModel,
  Oportunidad: getOportunidadModel,
  ActividadCRM: getActividadCRMModel,
  // Kiosk
  KioskRegistrado: getKioskRegistradoModel,
  PedidoKiosk: getPedidoKioskModel,
  SesionKiosk: getSesionKioskModel,
  // Plantillas Documento
  PlantillaDocumento: getPlantillaDocumentoModel,
  // Firmas
  Firma: getFirmaModel,
  SolicitudFirma: getSolicitudFirmaModel,
  // Turnos Servicio
  TurnoServicio: getTurnoServicioModel,
  // Restoo
  RestooConnection: getRestooConnectionModel,
  RestooSyncLog: getRestooSyncLogModel,
  RestooMapeoSalon: getRestooMapeoSalonModel,
};

/**
 * Tipos de modelos disponibles por empresa
 */
export type EmpresaModelType = keyof typeof EmpresaModels;

/**
 * Función genérica para obtener un modelo dinámico para una empresa
 * Obtiene automáticamente la configuración de BD de la empresa
 */
export const getDynamicModel = async <T>(
  modelName: string,
  schema: Schema<T>,
  empresaId: string
): Promise<Model<T>> => {
  // Obtener la empresa con su configuración de BD
  const empresa = await Empresa.findById(empresaId).select('+databaseConfig.password').lean();

  if (!empresa) {
    throw new Error(`Empresa no encontrada: ${empresaId}`);
  }

  if (!empresa.databaseConfig) {
    throw new Error(`Empresa sin configuración de base de datos: ${empresaId}`);
  }

  return databaseManager.getModel<T>(
    empresaId,
    empresa.databaseConfig,
    modelName,
    schema
  );
};