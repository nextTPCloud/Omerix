import mongoose, { Model } from 'mongoose';
import { getCuentaBancariaModel } from '../../utils/dynamic-models.helper';
import { ICuentaBancaria } from './models/CuentaBancaria';
import { IDatabaseConfig } from '../../types/database.types';
import Empresa from '../empresa/Empresa';

// Interface para crear cuenta
export interface ICrearCuentaBancaria {
  iban: string;
  banco: string;
  bic?: string;
  titular: string;
  alias?: string;
  saldoInicial?: number;
  usarParaCobros?: boolean;
  usarParaPagos?: boolean;
  predeterminada?: boolean;
  usuarioId: string;
}

// Interface para actualizar cuenta
export interface IActualizarCuentaBancaria {
  iban?: string;
  banco?: string;
  bic?: string;
  titular?: string;
  alias?: string;
  usarParaCobros?: boolean;
  usarParaPagos?: boolean;
  activa?: boolean;
  usuarioId: string;
}

// Interface para filtros
export interface IFiltrosCuentas {
  activa?: boolean;
  usarParaCobros?: boolean;
  usarParaPagos?: boolean;
  busqueda?: string;
}

class CuentasBancariasService {
  /**
   * Obtiene la configuración de BD de una empresa
   */
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuracion de base de datos no encontrada para esta empresa');
    }
    return empresa.databaseConfig;
  }

  /**
   * Crear una nueva cuenta bancaria
   */
  async crear(empresaId: string, datos: ICrearCuentaBancaria): Promise<ICuentaBancaria> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    // Limpiar IBAN (quitar espacios)
    const ibanLimpio = datos.iban.replace(/\s/g, '').toUpperCase();

    // Si es predeterminada, quitar predeterminada de las demás
    if (datos.predeterminada) {
      await CuentaBancaria.updateMany(
        { predeterminada: true },
        { predeterminada: false }
      );
    }

    const cuenta = new CuentaBancaria({
      _id: new mongoose.Types.ObjectId(),
      iban: ibanLimpio,
      banco: datos.banco,
      bic: datos.bic,
      titular: datos.titular,
      alias: datos.alias,
      saldoInicial: datos.saldoInicial || 0,
      saldoActual: datos.saldoInicial || 0,
      usarParaCobros: datos.usarParaCobros !== false,
      usarParaPagos: datos.usarParaPagos !== false,
      predeterminada: datos.predeterminada || false,
      activa: true,
      creadoPor: new mongoose.Types.ObjectId(datos.usuarioId),
      fechaCreacion: new Date(),
    });

    await cuenta.save();
    return cuenta;
  }

  /**
   * Listar cuentas bancarias
   */
  async listar(
    empresaId: string,
    filtros: IFiltrosCuentas = {}
  ): Promise<ICuentaBancaria[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    const query: any = {};

    if (filtros.activa !== undefined) query.activa = filtros.activa;
    if (filtros.usarParaCobros !== undefined) query.usarParaCobros = filtros.usarParaCobros;
    if (filtros.usarParaPagos !== undefined) query.usarParaPagos = filtros.usarParaPagos;

    if (filtros.busqueda) {
      const busquedaRegex = new RegExp(filtros.busqueda, 'i');
      query.$or = [
        { iban: busquedaRegex },
        { banco: busquedaRegex },
        { titular: busquedaRegex },
        { alias: busquedaRegex },
      ];
    }

    return CuentaBancaria.find(query)
      .sort({ predeterminada: -1, banco: 1 })
      .lean() as Promise<ICuentaBancaria[]>;
  }

  /**
   * Obtener cuenta por ID
   */
  async obtenerPorId(empresaId: string, cuentaId: string): Promise<ICuentaBancaria | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    return CuentaBancaria.findById(cuentaId).lean() as Promise<ICuentaBancaria | null>;
  }

  /**
   * Obtener cuenta predeterminada
   */
  async obtenerPredeterminada(empresaId: string): Promise<ICuentaBancaria | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    return CuentaBancaria.findOne({
      activa: true,
      predeterminada: true,
    }).lean() as Promise<ICuentaBancaria | null>;
  }

  /**
   * Actualizar cuenta bancaria
   */
  async actualizar(
    empresaId: string,
    cuentaId: string,
    datos: IActualizarCuentaBancaria
  ): Promise<ICuentaBancaria | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    const updateData: any = {
      modificadoPor: new mongoose.Types.ObjectId(datos.usuarioId),
      fechaModificacion: new Date(),
    };

    if (datos.iban) updateData.iban = datos.iban.replace(/\s/g, '').toUpperCase();
    if (datos.banco) updateData.banco = datos.banco;
    if (datos.bic !== undefined) updateData.bic = datos.bic;
    if (datos.titular) updateData.titular = datos.titular;
    if (datos.alias !== undefined) updateData.alias = datos.alias;
    if (datos.usarParaCobros !== undefined) updateData.usarParaCobros = datos.usarParaCobros;
    if (datos.usarParaPagos !== undefined) updateData.usarParaPagos = datos.usarParaPagos;
    if (datos.activa !== undefined) updateData.activa = datos.activa;

    return CuentaBancaria.findByIdAndUpdate(
      cuentaId,
      updateData,
      { new: true }
    ).lean() as Promise<ICuentaBancaria | null>;
  }

  /**
   * Establecer como predeterminada
   */
  async setPredeterminada(empresaId: string, cuentaId: string): Promise<ICuentaBancaria | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    // Quitar predeterminada de todas
    await CuentaBancaria.updateMany(
      { predeterminada: true },
      { predeterminada: false }
    );

    // Establecer la seleccionada como predeterminada
    return CuentaBancaria.findByIdAndUpdate(
      cuentaId,
      { predeterminada: true },
      { new: true }
    ).lean() as Promise<ICuentaBancaria | null>;
  }

  /**
   * Eliminar cuenta (desactivar)
   */
  async eliminar(empresaId: string, cuentaId: string, usuarioId: string): Promise<boolean> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    const result = await CuentaBancaria.findByIdAndUpdate(
      cuentaId,
      {
        activa: false,
        predeterminada: false,
        modificadoPor: new mongoose.Types.ObjectId(usuarioId),
        fechaModificacion: new Date(),
      }
    );

    return !!result;
  }

  /**
   * Actualizar saldo de cuenta
   */
  async actualizarSaldo(
    empresaId: string,
    cuentaId: string,
    importe: number,
    esEntrada: boolean
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    const incremento = esEntrada ? importe : -importe;

    await CuentaBancaria.findByIdAndUpdate(cuentaId, {
      $inc: { saldoActual: incremento },
      fechaUltimoMovimiento: new Date(),
    });
  }

  /**
   * Obtener cuentas activas para selector
   */
  async listarParaSelector(empresaId: string): Promise<Array<{
    _id: string;
    nombre: string;
    iban: string;
    predeterminada: boolean;
  }>> {
    const cuentas = await this.listar(empresaId, { activa: true });

    return cuentas.map((c) => ({
      _id: c._id.toString(),
      nombre: c.alias || `${c.banco} - ...${c.iban.slice(-4)}`,
      iban: c.iban,
      predeterminada: c.predeterminada,
    }));
  }
}

export const cuentasBancariasService = new CuentasBancariasService();
