import mongoose, { Model } from 'mongoose';
import {
  IProyecto,
  FrecuenciaRecurrencia,
  EstadoGeneracion,
  IInstanciaGenerada,
} from './Proyecto';
import { IParteTrabajo, EstadoParteTrabajo, TipoParteTrabajo } from '../partes-trabajo/ParteTrabajo';
import { IAlbaran, EstadoAlbaran, TipoAlbaran } from '../albaranes/Albaran';
import { EstadoFactura, TipoFactura } from '../facturas/Factura';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import {
  getProyectoModel,
  getParteTrabajoModel,
  getAlbaranModel,
  getClienteModel,
  getFacturaModel,
} from '@/utils/dynamic-models.helper';

// ============================================
// TIPOS
// ============================================

interface ResultadoGeneracion {
  exito: boolean;
  proyectoId: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  clienteNombre?: string;
  parteTrabajoId?: string;
  parteTrabajoNumero?: string;
  albaranId?: string;
  albaranNumero?: string;
  facturaId?: string;
  facturaNumero?: string;
  error?: string;
}

interface ResumenGeneracion {
  fecha: Date;
  totalProyectosProcessados: number;
  totalExitos: number;
  totalErrores: number;
  resultados: ResultadoGeneracion[];
}

// ============================================
// SERVICIO DE RECURRENCIA
// ============================================

export class ProyectosRecurrenciaService {
  /**
   * Calcula la próxima fecha de generación según la frecuencia
   */
  calcularProximaFecha(
    frecuencia: FrecuenciaRecurrencia,
    diaGeneracion: number,
    fechaBase?: Date
  ): Date {
    const fecha = fechaBase ? new Date(fechaBase) : new Date();

    switch (frecuencia) {
      case FrecuenciaRecurrencia.SEMANAL:
        fecha.setDate(fecha.getDate() + 7);
        break;

      case FrecuenciaRecurrencia.QUINCENAL:
        fecha.setDate(fecha.getDate() + 15);
        break;

      case FrecuenciaRecurrencia.MENSUAL:
        fecha.setMonth(fecha.getMonth() + 1);
        fecha.setDate(Math.min(diaGeneracion, this.getDaysInMonth(fecha)));
        break;

      case FrecuenciaRecurrencia.BIMESTRAL:
        fecha.setMonth(fecha.getMonth() + 2);
        fecha.setDate(Math.min(diaGeneracion, this.getDaysInMonth(fecha)));
        break;

      case FrecuenciaRecurrencia.TRIMESTRAL:
        fecha.setMonth(fecha.getMonth() + 3);
        fecha.setDate(Math.min(diaGeneracion, this.getDaysInMonth(fecha)));
        break;

      case FrecuenciaRecurrencia.SEMESTRAL:
        fecha.setMonth(fecha.getMonth() + 6);
        fecha.setDate(Math.min(diaGeneracion, this.getDaysInMonth(fecha)));
        break;

      case FrecuenciaRecurrencia.ANUAL:
        fecha.setFullYear(fecha.getFullYear() + 1);
        fecha.setDate(Math.min(diaGeneracion, this.getDaysInMonth(fecha)));
        break;
    }

    return fecha;
  }

  /**
   * Calcula el periodo (inicio y fin) según la frecuencia
   */
  calcularPeriodo(
    frecuencia: FrecuenciaRecurrencia,
    fechaBase: Date
  ): { inicio: Date; fin: Date } {
    const inicio = new Date(fechaBase);
    const fin = new Date(fechaBase);

    switch (frecuencia) {
      case FrecuenciaRecurrencia.SEMANAL:
        inicio.setDate(inicio.getDate() - 7);
        break;

      case FrecuenciaRecurrencia.QUINCENAL:
        inicio.setDate(inicio.getDate() - 15);
        break;

      case FrecuenciaRecurrencia.MENSUAL:
        inicio.setMonth(inicio.getMonth() - 1);
        break;

      case FrecuenciaRecurrencia.BIMESTRAL:
        inicio.setMonth(inicio.getMonth() - 2);
        break;

      case FrecuenciaRecurrencia.TRIMESTRAL:
        inicio.setMonth(inicio.getMonth() - 3);
        break;

      case FrecuenciaRecurrencia.SEMESTRAL:
        inicio.setMonth(inicio.getMonth() - 6);
        break;

      case FrecuenciaRecurrencia.ANUAL:
        inicio.setFullYear(inicio.getFullYear() - 1);
        break;
    }

    return { inicio, fin };
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Obtiene proyectos pendientes de generación
   */
  async obtenerProyectosPendientes(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto[]> {
    const ProyectoModel = await getProyectoModel(empresaId, dbConfig);
    await getClienteModel(empresaId, dbConfig);

    const ahora = new Date();

    return ProyectoModel.find({
      esRecurrente: true,
      'recurrencia.activo': true,
      'recurrencia.proximaGeneracion': { $lte: ahora },
      $or: [
        { 'recurrencia.fechaFin': { $exists: false } },
        { 'recurrencia.fechaFin': null },
        { 'recurrencia.fechaFin': { $gte: ahora } },
      ],
    })
      .populate('clienteId', 'codigo nombre nombreComercial nif email telefono')
      .lean();
  }

  /**
   * Genera parte de trabajo desde plantilla del proyecto
   */
  private async generarParteTrabajo(
    proyecto: IProyecto,
    periodo: { inicio: Date; fin: Date },
    empresaId: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ id: string; numero: string } | null> {
    if (!proyecto.recurrencia?.generarParteTrabajo) {
      return null;
    }

    const ParteTrabajoModel = await getParteTrabajoModel(empresaId, dbConfig);

    // Convertir líneas de plantilla a líneas de parte de trabajo
    const lineasPersonal: any[] = [];
    const lineasMateriales: any[] = [];
    const lineasGastos: any[] = [];
    const lineasMaquinaria: any[] = [];
    const lineasTransporte: any[] = [];

    for (const linea of proyecto.recurrencia.lineasPlantilla || []) {
      const lineaBase = {
        _id: new mongoose.Types.ObjectId(),
        facturable: true,
        incluidoEnAlbaran: linea.incluirEnAlbaran,
      };

      switch (linea.tipo) {
        case 'mano_obra':
          lineasPersonal.push({
            ...lineaBase,
            personalId: linea.personalId,
            personalNombre: linea.descripcion,
            fecha: periodo.fin,
            horasTrabajadas: linea.cantidad,
            tarifaHoraCoste: linea.precioUnitario * 0.6, // Estimación coste
            tarifaHoraVenta: linea.precioUnitario,
            costeTotal: linea.cantidad * linea.precioUnitario * 0.6,
            ventaTotal: linea.cantidad * linea.precioUnitario,
          });
          break;

        case 'material':
          lineasMateriales.push({
            ...lineaBase,
            productoId: linea.productoId,
            productoNombre: linea.descripcion,
            cantidad: linea.cantidad,
            unidad: linea.unidad,
            precioCoste: linea.precioUnitario * 0.6,
            precioVenta: linea.precioUnitario,
            descuento: 0,
            iva: 21,
            costeTotal: linea.cantidad * linea.precioUnitario * 0.6,
            ventaTotal: linea.cantidad * linea.precioUnitario,
          });
          break;

        case 'gasto':
          lineasGastos.push({
            ...lineaBase,
            tipoGastoNombre: linea.descripcion,
            fecha: periodo.fin,
            importe: linea.cantidad * linea.precioUnitario,
            margen: 20,
            importeFacturable: linea.cantidad * linea.precioUnitario * 1.2,
            iva: 21,
          });
          break;

        case 'maquinaria':
          lineasMaquinaria.push({
            ...lineaBase,
            nombre: linea.descripcion,
            tipoUnidad: 'horas',
            cantidad: linea.cantidad,
            tarifaCoste: linea.precioUnitario * 0.6,
            tarifaVenta: linea.precioUnitario,
            costeTotal: linea.cantidad * linea.precioUnitario * 0.6,
            ventaTotal: linea.cantidad * linea.precioUnitario,
            fechaUso: periodo.fin,
          });
          break;

        case 'transporte':
          lineasTransporte.push({
            ...lineaBase,
            vehiculoNombre: linea.descripcion,
            fecha: periodo.fin,
            kmRecorridos: linea.cantidad,
            tarifaPorKm: linea.precioUnitario,
            importeFijoViaje: 0,
            peajes: 0,
            combustible: 0,
            costeTotal: linea.cantidad * linea.precioUnitario * 0.6,
            precioVenta: linea.cantidad * linea.precioUnitario,
          });
          break;
      }
    }

    // Calcular totales
    const totalCoste =
      lineasPersonal.reduce((sum, l) => sum + l.costeTotal, 0) +
      lineasMateriales.reduce((sum, l) => sum + l.costeTotal, 0) +
      lineasGastos.reduce((sum, l) => sum + l.importe, 0) +
      lineasMaquinaria.reduce((sum, l) => sum + l.costeTotal, 0) +
      lineasTransporte.reduce((sum, l) => sum + l.costeTotal, 0);

    const totalVenta =
      lineasPersonal.reduce((sum, l) => sum + l.ventaTotal, 0) +
      lineasMateriales.reduce((sum, l) => sum + l.ventaTotal, 0) +
      lineasGastos.reduce((sum, l) => sum + l.importeFacturable, 0) +
      lineasMaquinaria.reduce((sum, l) => sum + l.ventaTotal, 0) +
      lineasTransporte.reduce((sum, l) => sum + l.precioVenta, 0);

    // Generar número de parte usando el método del modelo
    const serie = 'PT';
    const año = new Date().getFullYear();

    const ultimoParte = await ParteTrabajoModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoParte && typeof ultimoParte.numero === 'number') {
      numero = ultimoParte.numero + 1;
    }
    const codigoParte = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    const frecuenciaLabels: Record<string, string> = {
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
      bimestral: 'Bimestral',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual',
    };

    // Extraer datos del cliente (populado)
    const cliente = proyecto.clienteId as any;
    const clienteNombre = cliente?.nombreComercial || cliente?.nombre || 'Cliente desconocido';
    const clienteNif = cliente?.nif || 'N/A';
    const clienteEmail = cliente?.email;
    const clienteTelefono = cliente?.telefono;

    const parteTrabajo = new ParteTrabajoModel({
      serie,
      numero,
      codigo: codigoParte,
      titulo: `${proyecto.nombre} - ${frecuenciaLabels[proyecto.recurrencia.frecuencia]} ${periodo.fin.toLocaleDateString('es-ES')}`,
      descripcion: `Parte generado automáticamente del proyecto recurrente ${proyecto.codigo}`,
      clienteId: cliente?._id || proyecto.clienteId,
      clienteNombre,
      clienteNif,
      clienteEmail,
      clienteTelefono,
      proyectoId: proyecto._id,
      proyectoCodigo: proyecto.codigo,
      proyectoNombre: proyecto.nombre,
      tipo: TipoParteTrabajo.MANTENIMIENTO,
      estado: EstadoParteTrabajo.COMPLETADO,
      prioridad: 'media',
      fechaInicio: periodo.inicio,
      fechaFin: periodo.fin,
      fechaPrevista: periodo.fin,
      direccion: proyecto.direccion,
      lineasPersonal,
      lineasMateriales,
      lineasGastos,
      lineasMaquinaria,
      lineasTransporte,
      totales: {
        costePersonal: lineasPersonal.reduce((sum, l) => sum + l.costeTotal, 0),
        ventaPersonal: lineasPersonal.reduce((sum, l) => sum + l.ventaTotal, 0),
        costeMateriales: lineasMateriales.reduce((sum, l) => sum + l.costeTotal, 0),
        ventaMateriales: lineasMateriales.reduce((sum, l) => sum + l.ventaTotal, 0),
        costeGastos: lineasGastos.reduce((sum, l) => sum + l.importe, 0),
        ventaGastos: lineasGastos.reduce((sum, l) => sum + l.importeFacturable, 0),
        costeMaquinaria: lineasMaquinaria.reduce((sum, l) => sum + l.costeTotal, 0),
        ventaMaquinaria: lineasMaquinaria.reduce((sum, l) => sum + l.ventaTotal, 0),
        costeTransporte: lineasTransporte.reduce((sum, l) => sum + l.costeTotal, 0),
        ventaTransporte: lineasTransporte.reduce((sum, l) => sum + l.precioVenta, 0),
        costeTotal: totalCoste,
        ventaTotal: totalVenta,
        margen: totalVenta > 0 ? ((totalVenta - totalCoste) / totalVenta) * 100 : 0,
      },
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      generadoAutomaticamente: true,
    });

    await parteTrabajo.save();

    return { id: parteTrabajo._id.toString(), numero: codigoParte };
  }

  /**
   * Genera albarán desde parte de trabajo
   */
  private async generarAlbaran(
    proyecto: IProyecto,
    parteTrabajoId: string,
    periodo: { inicio: Date; fin: Date },
    empresaId: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ id: string; numero: string } | null> {
    if (!proyecto.recurrencia?.generarAlbaran) {
      return null;
    }

    const AlbaranModel = await getAlbaranModel(empresaId, dbConfig);
    const ParteTrabajoModel = await getParteTrabajoModel(empresaId, dbConfig);

    // Obtener parte de trabajo
    const parteTrabajo = await ParteTrabajoModel.findById(parteTrabajoId).lean();
    if (!parteTrabajo) return null;

    // Generar número de albarán usando la misma estructura del modelo
    const serieAlb = 'ALB';
    const añoAlb = new Date().getFullYear();

    const ultimoAlbaran = await AlbaranModel.findOne({
      serie: serieAlb,
      codigo: new RegExp(`^${serieAlb}${añoAlb}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numeroAlb = 1;
    if (ultimoAlbaran && typeof ultimoAlbaran.numero === 'number') {
      numeroAlb = ultimoAlbaran.numero + 1;
    }
    const codigoAlbaran = `${serieAlb}${añoAlb}-${numeroAlb.toString().padStart(5, '0')}`;

    // Función auxiliar para calcular una línea de albarán
    const calcularLineaAlbaran = (lineaBase: any) => {
      const cantidadEntregada = lineaBase.cantidadEntregada || 0;
      const precioUnitario = lineaBase.precioUnitario || 0;
      const costeUnitario = lineaBase.costeUnitario || 0;
      const descuento = lineaBase.descuento || 0;
      const iva = lineaBase.iva || 21;

      const subtotalBruto = cantidadEntregada * precioUnitario;
      const descuentoImporte = subtotalBruto * (descuento / 100);
      const subtotal = subtotalBruto - descuentoImporte;
      const ivaImporte = subtotal * (iva / 100);
      const total = subtotal + ivaImporte;
      const costeTotalLinea = cantidadEntregada * costeUnitario;
      const margenUnitario = precioUnitario - costeUnitario;
      const margenPorcentaje = costeUnitario > 0 ? ((precioUnitario - costeUnitario) / costeUnitario) * 100 : 0;
      const margenTotalLinea = subtotal - costeTotalLinea;

      return {
        ...lineaBase,
        descuentoImporte: Math.round(descuentoImporte * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        ivaImporte: Math.round(ivaImporte * 100) / 100,
        total: Math.round(total * 100) / 100,
        costeTotalLinea: Math.round(costeTotalLinea * 100) / 100,
        margenUnitario: Math.round(margenUnitario * 100) / 100,
        margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
        margenTotalLinea: Math.round(margenTotalLinea * 100) / 100,
      };
    };

    // Construir líneas de albarán desde el parte de trabajo
    const lineas: any[] = [];
    let orden = 1;

    // 1. Líneas de personal -> Servicio
    for (const linea of (parteTrabajo.lineasPersonal || []).filter((l: any) => l.incluidoEnAlbaran)) {
      const horas = (linea.horasTrabajadas || 0) + (linea.horasExtras || 0);
      lineas.push(calcularLineaAlbaran({
        _id: new mongoose.Types.ObjectId(),
        orden: orden++,
        tipo: 'servicio',
        nombre: `Mano de obra: ${linea.personalNombre || 'Personal'}`,
        descripcion: linea.descripcionTrabajo || `Trabajo realizado`,
        cantidadSolicitada: horas,
        cantidadEntregada: horas,
        cantidadPendiente: 0,
        unidad: 'h',
        precioUnitario: linea.tarifaHoraVenta || 0,
        costeUnitario: linea.tarifaHoraCoste || 0,
        descuento: 0,
        iva: 21,
        mostrarComponentes: false,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    }

    // 2. Líneas de materiales -> Producto
    for (const linea of (parteTrabajo.lineasMateriales || []).filter((l: any) => l.incluidoEnAlbaran)) {
      lineas.push(calcularLineaAlbaran({
        _id: new mongoose.Types.ObjectId(),
        orden: orden++,
        tipo: 'producto',
        productoId: linea.productoId,
        codigo: linea.productoCodigo,
        nombre: linea.productoNombre || 'Material',
        descripcion: linea.descripcion,
        cantidadSolicitada: linea.cantidad || 0,
        cantidadEntregada: linea.cantidad || 0,
        cantidadPendiente: 0,
        unidad: linea.unidad || 'ud',
        precioUnitario: linea.precioVenta || 0,
        costeUnitario: linea.precioCoste || 0,
        descuento: linea.descuento || 0,
        iva: linea.iva || 21,
        lote: linea.lote,
        almacenId: linea.almacenId,
        mostrarComponentes: false,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    }

    // 3. Líneas de maquinaria -> Servicio
    for (const linea of (parteTrabajo.lineasMaquinaria || []).filter((l: any) => l.incluidoEnAlbaran)) {
      const unidadTexto = linea.tipoUnidad === 'horas' ? 'h' : linea.tipoUnidad === 'dias' ? 'd' : linea.tipoUnidad === 'km' ? 'km' : 'ud';
      lineas.push(calcularLineaAlbaran({
        _id: new mongoose.Types.ObjectId(),
        orden: orden++,
        tipo: 'servicio',
        nombre: `Maquinaria: ${linea.nombre || 'Equipo'}`,
        descripcion: linea.descripcion || `Uso de ${linea.nombre}`,
        cantidadSolicitada: linea.cantidad || 0,
        cantidadEntregada: linea.cantidad || 0,
        cantidadPendiente: 0,
        unidad: unidadTexto,
        precioUnitario: linea.tarifaVenta || 0,
        costeUnitario: linea.tarifaCoste || 0,
        descuento: 0,
        iva: 21,
        mostrarComponentes: false,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    }

    // 4. Líneas de transporte -> Servicio
    for (const linea of (parteTrabajo.lineasTransporte || []).filter((l: any) => l.incluidoEnAlbaran)) {
      const descripcion = linea.origen && linea.destino
        ? `Transporte de ${linea.origen} a ${linea.destino}`
        : `Desplazamiento ${linea.vehiculoNombre || ''}`;
      lineas.push(calcularLineaAlbaran({
        _id: new mongoose.Types.ObjectId(),
        orden: orden++,
        tipo: 'servicio',
        nombre: `Transporte: ${linea.vehiculoNombre || 'Vehículo'}`,
        descripcion,
        cantidadSolicitada: 1,
        cantidadEntregada: 1,
        cantidadPendiente: 0,
        unidad: 'ud',
        precioUnitario: linea.precioVenta || 0,
        costeUnitario: linea.costeTotal || 0,
        descuento: 0,
        iva: 21,
        mostrarComponentes: false,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    }

    // 5. Líneas de gastos -> Servicio
    for (const linea of (parteTrabajo.lineasGastos || []).filter((l: any) => l.incluidoEnAlbaran)) {
      lineas.push(calcularLineaAlbaran({
        _id: new mongoose.Types.ObjectId(),
        orden: orden++,
        tipo: 'servicio',
        nombre: `Gasto: ${linea.tipoGastoNombre || 'Gasto'}`,
        descripcion: linea.descripcion || linea.tipoGastoNombre,
        cantidadSolicitada: 1,
        cantidadEntregada: 1,
        cantidadPendiente: 0,
        unidad: 'ud',
        precioUnitario: linea.importeFacturable || linea.importe || 0,
        costeUnitario: linea.importe || 0,
        descuento: 0,
        iva: linea.iva || 21,
        mostrarComponentes: false,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    }

    // Calcular totales del albarán
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;
      subtotalBruto += linea.cantidadEntregada * linea.precioUnitario;
      totalDescuentos += linea.descuentoImporte || 0;

      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte;
    }

    const subtotalNeto = subtotalBruto - totalDescuentos;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * 100) / 100,
      cuota: Math.round(valores.cuota * 100) / 100,
    }));
    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalAlbaran = subtotalNeto + totalIva;
    const costeTotal = lineas.reduce((sum, l) => sum + (l.costeTotalLinea || 0), 0);
    const margenBruto = subtotalNeto - costeTotal;
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0;

    // Extraer datos del cliente (populado)
    const clienteAlb = proyecto.clienteId as any;
    const clienteNombreAlb = clienteAlb?.nombreComercial || clienteAlb?.nombre || 'Cliente desconocido';
    const clienteNifAlb = clienteAlb?.nif || 'N/A';

    const albaran = new AlbaranModel({
      serie: serieAlb,
      numero: numeroAlb,
      codigo: codigoAlbaran,
      tipo: TipoAlbaran.VENTA,
      estado: EstadoAlbaran.ENTREGADO,
      clienteId: clienteAlb?._id || proyecto.clienteId,
      clienteNombre: clienteNombreAlb,
      clienteNif: clienteNifAlb,
      clienteEmail: clienteAlb?.email,
      clienteTelefono: clienteAlb?.telefono,
      proyectoId: proyecto._id,
      proyectoCodigo: proyecto.codigo,
      parteTrabajoId: new mongoose.Types.ObjectId(parteTrabajoId),
      fecha: periodo.fin,
      fechaEntrega: periodo.fin,
      lineas,
      totales: {
        subtotalBruto: Math.round(subtotalBruto * 100) / 100,
        totalDescuentos: Math.round(totalDescuentos * 100) / 100,
        subtotalNeto: Math.round(subtotalNeto * 100) / 100,
        desgloseIva,
        totalIva: Math.round(totalIva * 100) / 100,
        total: Math.round(totalAlbaran * 100) / 100,
        costeTotal: Math.round(costeTotal * 100) / 100,
        margenBruto: Math.round(margenBruto * 100) / 100,
        margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
      },
      direccionEntrega: proyecto.direccion ? {
        tipo: 'personalizada',
        calle: proyecto.direccion.calle,
        numero: proyecto.direccion.numero,
        piso: proyecto.direccion.piso,
        codigoPostal: proyecto.direccion.codigoPostal,
        ciudad: proyecto.direccion.ciudad,
        provincia: proyecto.direccion.provincia,
        pais: proyecto.direccion.pais,
      } : undefined,
      observaciones: `Albarán generado automáticamente del proyecto recurrente ${proyecto.codigo}`,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      generadoAutomaticamente: true,
    });

    await albaran.save();

    // Marcar las líneas del parte como incluidas en albarán
    await ParteTrabajoModel.findByIdAndUpdate(parteTrabajoId, {
      albaranId: albaran._id,
      estado: EstadoParteTrabajo.FACTURADO,
    });

    return { id: albaran._id.toString(), numero: codigoAlbaran };
  }

  /**
   * Genera factura desde albarán
   * Si hay productos, el albarán ya debe estar generado para controlar stock
   */
  private async generarFactura(
    proyecto: IProyecto,
    albaranId: string,
    periodo: { inicio: Date; fin: Date },
    empresaId: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ id: string; numero: string } | null> {
    if (!proyecto.recurrencia?.generarFactura) {
      return null;
    }

    const FacturaModel = await getFacturaModel(empresaId, dbConfig);
    const AlbaranModel = await getAlbaranModel(empresaId, dbConfig);
    await getClienteModel(empresaId, dbConfig);

    // Obtener albarán
    const albaran = await AlbaranModel.findById(albaranId)
      .populate('clienteId', 'codigo nombre nombreComercial nif direccionFiscal formasPagoIds terminoPagoId')
      .lean();
    if (!albaran) return null;

    // Generar número de factura usando la misma estructura del modelo
    const serieFac = 'FAC';
    const añoFac = new Date().getFullYear();

    const ultimaFactura = await FacturaModel.findOne({
      serie: serieFac,
      codigo: new RegExp(`^${serieFac}${añoFac}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numeroFac = 1;
    if (ultimaFactura && typeof ultimaFactura.numero === 'number') {
      numeroFac = ultimaFactura.numero + 1;
    }
    const codigoFactura = `${serieFac}${añoFac}-${numeroFac.toString().padStart(5, '0')}`;

    // Construir líneas de factura desde el albarán
    const lineas: any[] = [];
    let orden = 1;

    for (const lineaAlbaran of (albaran.lineas || [])) {
      lineas.push({
        _id: new mongoose.Types.ObjectId(),
        orden: orden++,
        tipo: lineaAlbaran.tipo || 'producto',
        productoId: lineaAlbaran.productoId,
        codigo: lineaAlbaran.codigo,
        nombre: lineaAlbaran.nombre,
        descripcion: lineaAlbaran.descripcion,
        cantidad: lineaAlbaran.cantidadEntregada || lineaAlbaran.cantidad || 0,
        unidad: lineaAlbaran.unidad,
        precioUnitario: lineaAlbaran.precioUnitario,
        costeUnitario: lineaAlbaran.costeUnitario || 0,
        descuento: lineaAlbaran.descuento || 0,
        descuentoImporte: lineaAlbaran.descuentoImporte || 0,
        subtotal: lineaAlbaran.subtotal,
        iva: lineaAlbaran.iva || 21,
        ivaImporte: lineaAlbaran.ivaImporte || 0,
        total: lineaAlbaran.total || lineaAlbaran.subtotal,
        costeTotalLinea: lineaAlbaran.costeTotalLinea || 0,
        margenUnitario: lineaAlbaran.margenUnitario || 0,
        margenPorcentaje: lineaAlbaran.margenPorcentaje || 0,
        margenTotalLinea: lineaAlbaran.margenTotalLinea || 0,
        mostrarComponentes: false,
        esEditable: true,
        incluidoEnTotal: true,
        albaranLineaId: lineaAlbaran._id,
      });
    }

    // Calcular totales
    const subtotal = lineas.reduce((sum, l) => sum + (l.subtotal || 0), 0);
    const totalIva = lineas.reduce((sum, l) => sum + (l.ivaImporte || 0), 0);
    const total = lineas.reduce((sum, l) => sum + (l.total || l.subtotal || 0), 0);
    const costeTotal = lineas.reduce((sum, l) => sum + (l.costeTotalLinea || 0), 0);

    // Obtener datos del cliente
    const clienteFac = albaran.clienteId as any;
    const clienteNombreFac = clienteFac?.nombreComercial || clienteFac?.nombre || 'Cliente desconocido';
    const clienteNifFac = clienteFac?.nif || '';

    // Calcular fecha de vencimiento (30 días por defecto)
    const fechaVencimiento = new Date(periodo.fin);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    const factura = new FacturaModel({
      serie: serieFac,
      numero: numeroFac,
      codigo: codigoFactura,
      tipo: TipoFactura.ORDINARIA,
      estado: EstadoFactura.EMITIDA,
      clienteId: clienteFac?._id || proyecto.clienteId,
      clienteNombre: clienteNombreFac,
      clienteNif: clienteNifFac,
      clienteEmail: clienteFac?.email,
      clienteTelefono: clienteFac?.telefono,
      proyectoId: proyecto._id,
      proyectoCodigo: proyecto.codigo,
      fecha: periodo.fin,
      fechaVencimiento,
      lineas,
      // Albaranes asociados
      albaranesIds: [new mongoose.Types.ObjectId(albaranId)],
      // Totales
      totales: {
        subtotal,
        descuentoGlobalPorcentaje: 0,
        descuentoGlobalImporte: 0,
        baseImponible: subtotal,
        desgloseTiposIva: [{
          tipoIva: 21,
          baseImponible: subtotal,
          cuotaIva: totalIva,
        }],
        totalIva,
        recargoEquivalenciaTotal: 0,
        total,
        totalRetencion: 0,
        totalAPagar: total,
        costeTotal,
        margenTotal: subtotal - costeTotal,
        margenPorcentaje: subtotal > 0 ? ((subtotal - costeTotal) / subtotal) * 100 : 0,
      },
      // Direcciones
      direccionFiscal: cliente?.direccionFiscal || proyecto.direccion,
      // Observaciones
      observaciones: `Factura generada automáticamente del proyecto recurrente ${proyecto.codigo}`,
      observacionesInternas: `Periodo: ${periodo.inicio.toLocaleDateString('es-ES')} - ${periodo.fin.toLocaleDateString('es-ES')}`,
      // Metadatos
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      generadoAutomaticamente: true,
    });

    await factura.save();

    // Marcar el albarán como facturado
    await AlbaranModel.findByIdAndUpdate(albaranId, {
      facturaId: factura._id,
      estado: EstadoAlbaran.FACTURADO,
    });

    return { id: factura._id.toString(), numero: codigoFactura };
  }

  /**
   * Procesa un proyecto recurrente: genera parte de trabajo y/o albarán
   */
  async procesarProyectoRecurrente(
    proyecto: IProyecto,
    empresaId: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ResultadoGeneracion> {
    const resultado: ResultadoGeneracion = {
      exito: false,
      proyectoId: proyecto._id.toString(),
      proyectoCodigo: proyecto.codigo,
      proyectoNombre: proyecto.nombre,
      clienteNombre: (proyecto.clienteId as any)?.nombre || (proyecto.clienteId as any)?.nombreComercial,
    };

    try {
      if (!proyecto.recurrencia) {
        throw new Error('El proyecto no tiene configuración de recurrencia');
      }

      // Calcular periodo
      const periodo = this.calcularPeriodo(
        proyecto.recurrencia.frecuencia,
        proyecto.recurrencia.proximaGeneracion || new Date()
      );

      // Generar parte de trabajo
      let parteTrabajoResult: { id: string; numero: string } | null = null;
      if (proyecto.recurrencia.generarParteTrabajo) {
        parteTrabajoResult = await this.generarParteTrabajo(
          proyecto,
          periodo,
          empresaId,
          usuarioId,
          dbConfig
        );
        if (parteTrabajoResult) {
          resultado.parteTrabajoId = parteTrabajoResult.id;
          resultado.parteTrabajoNumero = parteTrabajoResult.numero;
        }
      }

      // Generar albarán (necesario si hay productos para control de stock, o si se solicita)
      // Si se solicita factura, también se genera albarán automáticamente
      let albaranResult: { id: string; numero: string } | null = null;
      const necesitaAlbaran = proyecto.recurrencia.generarAlbaran || proyecto.recurrencia.generarFactura;

      if (necesitaAlbaran && parteTrabajoResult) {
        albaranResult = await this.generarAlbaran(
          proyecto,
          parteTrabajoResult.id,
          periodo,
          empresaId,
          usuarioId,
          dbConfig
        );
        if (albaranResult) {
          resultado.albaranId = albaranResult.id;
          resultado.albaranNumero = albaranResult.numero;
        }
      }

      // Generar factura (requiere albarán previo para control de stock)
      if (proyecto.recurrencia.generarFactura && albaranResult) {
        const facturaResult = await this.generarFactura(
          proyecto,
          albaranResult.id,
          periodo,
          empresaId,
          usuarioId,
          dbConfig
        );
        if (facturaResult) {
          resultado.facturaId = facturaResult.id;
          resultado.facturaNumero = facturaResult.numero;
        }
      }

      // Actualizar proyecto: añadir instancia generada y calcular próxima fecha
      const ProyectoModel = await getProyectoModel(empresaId, dbConfig);

      // Determinar estado de la instancia
      let estadoInstancia = EstadoGeneracion.PENDIENTE;
      if (resultado.facturaId) {
        estadoInstancia = EstadoGeneracion.FACTURADO;
      } else if (resultado.albaranId) {
        estadoInstancia = EstadoGeneracion.ALBARAN_GENERADO;
      }

      const instancia: IInstanciaGenerada = {
        _id: new mongoose.Types.ObjectId(),
        fechaGeneracion: new Date(),
        periodoInicio: periodo.inicio,
        periodoFin: periodo.fin,
        estado: estadoInstancia,
        parteTrabajoId: parteTrabajoResult ? new mongoose.Types.ObjectId(parteTrabajoResult.id) : undefined,
        albaranId: resultado.albaranId ? new mongoose.Types.ObjectId(resultado.albaranId) : undefined,
        facturaId: resultado.facturaId ? new mongoose.Types.ObjectId(resultado.facturaId) : undefined,
      };

      const proximaGeneracion = this.calcularProximaFecha(
        proyecto.recurrencia.frecuencia,
        proyecto.recurrencia.diaGeneracion,
        proyecto.recurrencia.proximaGeneracion
      );

      await ProyectoModel.findByIdAndUpdate(proyecto._id, {
        $push: { 'recurrencia.instanciasGeneradas': instancia },
        $set: { 'recurrencia.proximaGeneracion': proximaGeneracion },
      });

      resultado.exito = true;
    } catch (error: any) {
      resultado.error = error.message;
    }

    return resultado;
  }

  /**
   * Ejecuta la generación masiva de todos los proyectos pendientes
   */
  async ejecutarGeneracionMasiva(
    empresaId: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ResumenGeneracion> {
    const resumen: ResumenGeneracion = {
      fecha: new Date(),
      totalProyectosProcessados: 0,
      totalExitos: 0,
      totalErrores: 0,
      resultados: [],
    };

    const proyectosPendientes = await this.obtenerProyectosPendientes(empresaId, dbConfig);
    resumen.totalProyectosProcessados = proyectosPendientes.length;

    for (const proyecto of proyectosPendientes) {
      const resultado = await this.procesarProyectoRecurrente(
        proyecto,
        empresaId,
        usuarioId,
        dbConfig
      );

      resumen.resultados.push(resultado);

      if (resultado.exito) {
        resumen.totalExitos++;
      } else {
        resumen.totalErrores++;
      }
    }

    return resumen;
  }

  /**
   * Actualiza la configuración de recurrencia de un proyecto
   */
  async configurarRecurrencia(
    proyectoId: string,
    configuracion: {
      activo: boolean;
      frecuencia: FrecuenciaRecurrencia;
      diaGeneracion: number;
      fechaInicio: Date;
      fechaFin?: Date;
      generarParteTrabajo: boolean;
      generarAlbaran: boolean;
      generarFactura: boolean;
      lineasPlantilla?: any[];
    },
    empresaId: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await getProyectoModel(empresaId, dbConfig);

    // Calcular próxima generación
    const proximaGeneracion = this.calcularProximaFecha(
      configuracion.frecuencia,
      configuracion.diaGeneracion,
      configuracion.fechaInicio
    );

    return ProyectoModel.findByIdAndUpdate(
      proyectoId,
      {
        esRecurrente: configuracion.activo,
        recurrencia: {
          activo: configuracion.activo,
          frecuencia: configuracion.frecuencia,
          diaGeneracion: configuracion.diaGeneracion,
          fechaInicio: configuracion.fechaInicio,
          fechaFin: configuracion.fechaFin,
          proximaGeneracion,
          generarParteTrabajo: configuracion.generarParteTrabajo,
          generarAlbaran: configuracion.generarAlbaran,
          generarFactura: configuracion.generarFactura,
          lineasPlantilla: configuracion.lineasPlantilla || [],
          instanciasGeneradas: [],
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Obtiene el historial de generaciones de un proyecto
   */
  async obtenerHistorialGeneraciones(
    proyectoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IInstanciaGenerada[]> {
    const ProyectoModel = await getProyectoModel(empresaId, dbConfig);

    const proyecto = await ProyectoModel.findById(proyectoId)
      .select('recurrencia.instanciasGeneradas')
      .populate('recurrencia.instanciasGeneradas.parteTrabajoId', 'numero titulo')
      .populate('recurrencia.instanciasGeneradas.albaranId', 'numero')
      .populate('recurrencia.instanciasGeneradas.facturaId', 'numero')
      .lean();

    return proyecto?.recurrencia?.instanciasGeneradas || [];
  }
}

export const proyectosRecurrenciaService = new ProyectosRecurrenciaService();
