/**
 * Seed del Plan General Contable 2007 (PGC)
 * Cuentas principales para un ERP de facturación
 */

import { TipoCuenta, NaturalezaCuenta } from '../models/PlanCuentas';

export interface CuentaPGC {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  esMovimiento: boolean;
}

/**
 * Plan de Cuentas PGC 2007 - Cuentas principales para facturación
 */
export const PGC_2007: CuentaPGC[] = [
  // ============================================
  // GRUPO 1 - FINANCIACIÓN BÁSICA
  // ============================================
  { codigo: '1', nombre: 'Financiación básica', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '10', nombre: 'Capital', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '100', nombre: 'Capital social', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '101', nombre: 'Fondo social', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '102', nombre: 'Capital', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '11', nombre: 'Reservas y otros instrumentos de patrimonio', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '112', nombre: 'Reserva legal', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '113', nombre: 'Reservas voluntarias', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '118', nombre: 'Aportaciones de socios', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '12', nombre: 'Resultados pendientes de aplicación', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '120', nombre: 'Remanente', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '121', nombre: 'Resultados negativos de ejercicios anteriores', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '129', nombre: 'Resultado del ejercicio', tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '17', nombre: 'Deudas a largo plazo por préstamos', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '170', nombre: 'Deudas a l/p con entidades de crédito', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '171', nombre: 'Deudas a l/p', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '173', nombre: 'Proveedores de inmovilizado a l/p', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // ============================================
  // GRUPO 2 - ACTIVO NO CORRIENTE
  // ============================================
  { codigo: '2', nombre: 'Activo no corriente', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },

  { codigo: '20', nombre: 'Inmovilizaciones intangibles', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '200', nombre: 'Investigación', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '201', nombre: 'Desarrollo', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '203', nombre: 'Propiedad industrial', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '206', nombre: 'Aplicaciones informáticas', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '21', nombre: 'Inmovilizaciones materiales', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '210', nombre: 'Terrenos y bienes naturales', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '211', nombre: 'Construcciones', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '212', nombre: 'Instalaciones técnicas', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '213', nombre: 'Maquinaria', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '214', nombre: 'Utillaje', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '216', nombre: 'Mobiliario', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '217', nombre: 'Equipos para procesos de información', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '218', nombre: 'Elementos de transporte', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '28', nombre: 'Amortización acumulada del inmovilizado', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '280', nombre: 'Amortización acum. inmov. intangible', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '281', nombre: 'Amortización acum. inmov. material', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // ============================================
  // GRUPO 3 - EXISTENCIAS
  // ============================================
  { codigo: '3', nombre: 'Existencias', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },

  { codigo: '30', nombre: 'Comerciales', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '300', nombre: 'Mercaderías A', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '31', nombre: 'Materias primas', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '310', nombre: 'Materias primas A', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '35', nombre: 'Productos terminados', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '350', nombre: 'Productos terminados A', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '39', nombre: 'Deterioro de valor de las existencias', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '390', nombre: 'Deterioro de valor de las mercaderías', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // ============================================
  // GRUPO 4 - ACREEDORES Y DEUDORES
  // ============================================
  { codigo: '4', nombre: 'Acreedores y deudores por operaciones comerciales', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },

  // PROVEEDORES
  { codigo: '40', nombre: 'Proveedores', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '400', nombre: 'Proveedores', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '401', nombre: 'Proveedores, efectos comerciales a pagar', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '403', nombre: 'Proveedores, empresas del grupo', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '406', nombre: 'Envases y embalajes a devolver a proveedores', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '407', nombre: 'Anticipos a proveedores', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  // ACREEDORES
  { codigo: '41', nombre: 'Acreedores varios', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '410', nombre: 'Acreedores por prestaciones de servicios', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '411', nombre: 'Acreedores, efectos comerciales a pagar', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // CLIENTES
  { codigo: '43', nombre: 'Clientes', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '430', nombre: 'Clientes', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '431', nombre: 'Clientes, efectos comerciales a cobrar', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '432', nombre: 'Clientes, operaciones de factoring', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '433', nombre: 'Clientes, empresas del grupo', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '435', nombre: 'Clientes de dudoso cobro', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '436', nombre: 'Envases y embalajes a devolver por clientes', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '437', nombre: 'Anticipos de clientes', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // DEUDORES
  { codigo: '44', nombre: 'Deudores varios', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '440', nombre: 'Deudores', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '441', nombre: 'Deudores, efectos comerciales a cobrar', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  // PERSONAL
  { codigo: '46', nombre: 'Personal', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '460', nombre: 'Anticipos de remuneraciones', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '465', nombre: 'Remuneraciones pendientes de pago', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // ADMINISTRACIONES PÚBLICAS
  { codigo: '47', nombre: 'Administraciones públicas', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '470', nombre: 'Hacienda Pública, deudora por diversos conceptos', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '4700', nombre: 'Hacienda Pública, deudora por IVA', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '4708', nombre: 'Hacienda Pública, deudora devolución impuestos', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '471', nombre: 'Organismos de la Seg. Social, deudores', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '472', nombre: 'Hacienda Pública, IVA soportado', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '4720', nombre: 'IVA soportado', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '4720021', nombre: 'IVA soportado 21%', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '4720010', nombre: 'IVA soportado 10%', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '4720004', nombre: 'IVA soportado 4%', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '473', nombre: 'Hacienda Pública, retenciones y pagos a cuenta', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '4730', nombre: 'Retenciones IRPF practicadas', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '475', nombre: 'Hacienda Pública, acreedora por conceptos fiscales', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '4750', nombre: 'Hacienda Pública, acreedora por IVA', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '4751', nombre: 'Hacienda Pública, acreedora retenciones practicadas', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '4752', nombre: 'Hacienda Pública, acreedora por Impuesto Sociedades', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '476', nombre: 'Organismos de la Seg. Social, acreedores', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '477', nombre: 'Hacienda Pública, IVA repercutido', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '4770', nombre: 'IVA repercutido', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '4770021', nombre: 'IVA repercutido 21%', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '4770010', nombre: 'IVA repercutido 10%', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '4770004', nombre: 'IVA repercutido 4%', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '4770000', nombre: 'IVA repercutido 0%', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // DETERIORO
  { codigo: '49', nombre: 'Deterioro de valor de créditos comerciales', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '490', nombre: 'Deterioro de valor de créditos por operaciones comerciales', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  // ============================================
  // GRUPO 5 - CUENTAS FINANCIERAS
  // ============================================
  { codigo: '5', nombre: 'Cuentas financieras', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },

  { codigo: '52', nombre: 'Deudas a c/p por préstamos recibidos', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '520', nombre: 'Deudas a c/p con entidades de crédito', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '521', nombre: 'Deudas a c/p', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '5208', nombre: 'Deudas por efectos descontados', tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '55', nombre: 'Otras cuentas no bancarias', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '551', nombre: 'Cuenta corriente con socios y administradores', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '555', nombre: 'Partidas pendientes de aplicación', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '57', nombre: 'Tesorería', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '570', nombre: 'Caja, euros', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '5700', nombre: 'Caja TPV', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '571', nombre: 'Caja, moneda extranjera', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '572', nombre: 'Bancos e instituciones de crédito c/c vista, euros', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '573', nombre: 'Bancos e instituciones de crédito c/c vista, moneda extranjera', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '574', nombre: 'Bancos e instituciones de crédito, cuentas de ahorro, euros', tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  // ============================================
  // GRUPO 6 - COMPRAS Y GASTOS
  // ============================================
  { codigo: '6', nombre: 'Compras y gastos', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },

  { codigo: '60', nombre: 'Compras', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '600', nombre: 'Compras de mercaderías', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '601', nombre: 'Compras de materias primas', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '602', nombre: 'Compras de otros aprovisionamientos', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '606', nombre: 'Descuentos sobre compras por pronto pago', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '607', nombre: 'Trabajos realizados por otras empresas', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '608', nombre: 'Devoluciones de compras', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '609', nombre: 'Rappels por compras', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '61', nombre: 'Variación de existencias', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '610', nombre: 'Variación de existencias de mercaderías', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '611', nombre: 'Variación de existencias de materias primas', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '62', nombre: 'Servicios exteriores', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '620', nombre: 'Gastos en investigación y desarrollo', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '621', nombre: 'Arrendamientos y cánones', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '622', nombre: 'Reparaciones y conservación', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '623', nombre: 'Servicios de profesionales independientes', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '624', nombre: 'Transportes', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '625', nombre: 'Primas de seguros', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '626', nombre: 'Servicios bancarios y similares', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '627', nombre: 'Publicidad, propaganda y relaciones públicas', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '628', nombre: 'Suministros', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '629', nombre: 'Otros servicios', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '63', nombre: 'Tributos', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '630', nombre: 'Impuesto sobre beneficios', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '631', nombre: 'Otros tributos', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '64', nombre: 'Gastos de personal', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '640', nombre: 'Sueldos y salarios', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '641', nombre: 'Indemnizaciones', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '642', nombre: 'Seguridad Social a cargo de la empresa', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '649', nombre: 'Otros gastos sociales', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '65', nombre: 'Otros gastos de gestión', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '650', nombre: 'Pérdidas de créditos comerciales incobrables', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '659', nombre: 'Otras pérdidas en gestión corriente', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '66', nombre: 'Gastos financieros', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '662', nombre: 'Intereses de deudas', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '665', nombre: 'Descuentos sobre ventas por pronto pago', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '669', nombre: 'Otros gastos financieros', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '68', nombre: 'Dotaciones para amortizaciones', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '680', nombre: 'Amortización del inmov. intangible', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '681', nombre: 'Amortización del inmov. material', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '69', nombre: 'Pérdidas por deterioro', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: false },
  { codigo: '694', nombre: 'Pérdidas por deterioro de créditos por operaciones comerciales', tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  // ============================================
  // GRUPO 7 - VENTAS E INGRESOS
  // ============================================
  { codigo: '7', nombre: 'Ventas e ingresos', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },

  { codigo: '70', nombre: 'Ventas de mercaderías, de producción propia', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '700', nombre: 'Ventas de mercaderías', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '701', nombre: 'Ventas de productos terminados', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '702', nombre: 'Ventas de productos semiterminados', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '703', nombre: 'Ventas de subproductos y residuos', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '704', nombre: 'Ventas de envases y embalajes', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '705', nombre: 'Prestaciones de servicios', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '706', nombre: 'Descuentos sobre ventas por pronto pago', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '708', nombre: 'Devoluciones de ventas', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },
  { codigo: '709', nombre: 'Rappels sobre ventas', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.DEUDORA, esMovimiento: true },

  { codigo: '71', nombre: 'Variación de existencias', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '710', nombre: 'Variación de existencias de productos en curso', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '711', nombre: 'Variación de existencias de productos semiterminados', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '712', nombre: 'Variación de existencias de productos terminados', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '73', nombre: 'Trabajos realizados para la empresa', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '730', nombre: 'Trabajos realizados para el inmovilizado intangible', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '731', nombre: 'Trabajos realizados para el inmovilizado material', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '74', nombre: 'Subvenciones, donaciones y legados', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '740', nombre: 'Subvenciones, donaciones y legados a la explotación', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '75', nombre: 'Otros ingresos de gestión', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '752', nombre: 'Ingresos por arrendamientos', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '754', nombre: 'Ingresos por comisiones', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '759', nombre: 'Ingresos por servicios diversos', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '76', nombre: 'Ingresos financieros', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '762', nombre: 'Ingresos de créditos', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
  { codigo: '769', nombre: 'Otros ingresos financieros', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },

  { codigo: '79', nombre: 'Excesos y aplicaciones de provisiones', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: false },
  { codigo: '794', nombre: 'Reversión del deterioro de créditos por operaciones comerciales', tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA, esMovimiento: true },
];

/**
 * Función para inicializar el plan de cuentas en una empresa
 */
export async function inicializarPlanCuentas(
  CuentaContableModel: any,
  usuarioId?: string
): Promise<{ cuentasCreadas: number; errores: string[] }> {
  const errores: string[] = [];
  let cuentasCreadas = 0;

  for (const cuenta of PGC_2007) {
    try {
      // Verificar si ya existe
      const existe = await CuentaContableModel.findOne({ codigo: cuenta.codigo });
      if (existe) {
        continue;
      }

      // Determinar nivel
      let nivel = cuenta.codigo.length;
      if (nivel > 4) {
        nivel = 4 + Math.floor((cuenta.codigo.length - 4) / 2);
      }

      // Calcular código padre
      const codigoPadre = cuenta.codigo.length > 1 ? cuenta.codigo.slice(0, -1) : undefined;

      // Buscar ID del padre
      let cuentaPadreId;
      if (codigoPadre) {
        const padre = await CuentaContableModel.findOne({ codigo: codigoPadre });
        if (padre) {
          cuentaPadreId = padre._id;
        }
      }

      // Crear cuenta
      await CuentaContableModel.create({
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        nivel,
        esMovimiento: cuenta.esMovimiento,
        esSistema: true,
        activa: true,
        codigoPadre,
        cuentaPadreId,
        saldoDebe: 0,
        saldoHaber: 0,
        saldo: 0,
        numeroMovimientos: 0,
        creadoPor: usuarioId,
        fechaCreacion: new Date(),
      });

      cuentasCreadas++;
    } catch (error: any) {
      errores.push(`Error creando cuenta ${cuenta.codigo}: ${error.message}`);
    }
  }

  return { cuentasCreadas, errores };
}
