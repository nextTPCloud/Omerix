'use client'

import React, { forwardRef } from 'react'
import { EmpresaInfo } from '@/services/empresa.service'

// Opciones de impresión
export interface PrintOptions {
  mostrarPersonal: boolean
  mostrarMaterial: boolean
  mostrarMaquinaria: boolean
  mostrarTransporte: boolean
  mostrarGastos: boolean
  mostrarPrecios: boolean
  mostrarCostes: boolean
  mostrarFirmas: boolean
  mostrarLOPD: boolean
  mostrarConformidad: boolean
  mostrarRegistroMercantil: boolean
}

export const defaultPrintOptions: PrintOptions = {
  mostrarPersonal: true,
  mostrarMaterial: true,
  mostrarMaquinaria: true,
  mostrarTransporte: true,
  mostrarGastos: true,
  mostrarPrecios: true,
  mostrarCostes: false,
  mostrarFirmas: true,
  mostrarLOPD: true,
  mostrarConformidad: true,
  mostrarRegistroMercantil: true,
}

interface ParteTrabajoViewProps {
  parte: any // Tipo del parte de trabajo
  empresa?: EmpresaInfo
  options?: PrintOptions
}

/**
 * Componente de vista de impresión para partes de trabajo.
 * Diseño profesional con cabecera de empresa, datos del cliente,
 * líneas de personal, material, maquinaria, transporte y gastos.
 */
export const ParteTrabajoView = forwardRef<HTMLDivElement, ParteTrabajoViewProps>(
  ({ parte, empresa, options = defaultPrintOptions }, ref) => {
    // Formatear moneda
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value || 0)
    }

    // Formatear fecha
    const formatDate = (date: string | Date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    // Formatear hora
    const formatTime = (time: string) => {
      if (!time) return '-'
      return time
    }

    // Obtener nombre del cliente
    const clienteNombre = typeof parte.clienteId === 'object'
      ? parte.clienteId?.nombre
      : parte.clienteNombre || 'Sin cliente'

    // Obtener nombre del proyecto
    const proyectoNombre = typeof parte.proyectoId === 'object'
      ? parte.proyectoId?.nombre
      : parte.proyectoNombre || ''

    // Calcular totales por sección
    const totalPersonal = options.mostrarPrecios
      ? (parte.lineasPersonal || []).reduce((sum: number, l: any) => sum + (l.ventaTotal || 0), 0)
      : 0
    const totalMaterial = options.mostrarPrecios
      ? (parte.lineasMaterial || []).reduce((sum: number, l: any) => sum + (l.ventaTotal || 0), 0)
      : 0
    const totalMaquinaria = options.mostrarPrecios
      ? (parte.lineasMaquinaria || []).reduce((sum: number, l: any) => sum + (l.ventaTotal || 0), 0)
      : 0
    const totalTransporte = options.mostrarPrecios
      ? (parte.lineasTransporte || []).reduce((sum: number, l: any) => sum + (l.precioVenta || 0), 0)
      : 0
    const totalGastos = options.mostrarPrecios
      ? (parte.lineasGastos || []).reduce((sum: number, l: any) => sum + (l.importeFacturable || 0), 0)
      : 0

    const totalGeneral = totalPersonal + totalMaterial + totalMaquinaria + totalTransporte + totalGastos

    return (
      <div
        ref={ref}
        className="print-view bg-white text-black p-8 max-w-[210mm] mx-auto"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '11px',
          lineHeight: '1.4'
        }}
      >
        {/* ============================================ */}
        {/* CABECERA DE EMPRESA */}
        {/* ============================================ */}
        <header className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-start gap-4">
            {/* Logo de la empresa */}
            {empresa?.logo ? (
              <img
                src={empresa.logo}
                alt={empresa.nombre}
                className="h-16 w-auto object-contain"
                style={{ maxWidth: '120px' }}
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded">
                Logo
              </div>
            )}

            {/* Datos de la empresa */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {empresa?.nombreComercial || empresa?.nombre || 'Mi Empresa'}
              </h1>
              {empresa?.direccion && (
                <p className="text-gray-600 mt-1">
                  {empresa.direccion.calle}
                  {empresa.direccion.codigoPostal && `, ${empresa.direccion.codigoPostal}`}
                  {empresa.direccion.ciudad && ` ${empresa.direccion.ciudad}`}
                </p>
              )}
              <div className="flex gap-4 mt-1 text-gray-600">
                {empresa?.nif && <span>NIF: {empresa.nif}</span>}
                {empresa?.telefono && <span>Tel: {empresa.telefono}</span>}
              </div>
              {empresa?.email && (
                <p className="text-gray-600">{empresa.email}</p>
              )}
            </div>
          </div>

          {/* Número de parte de trabajo */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">PARTE DE TRABAJO</h2>
            <p className="text-lg font-semibold text-blue-700 mt-1">
              {parte.codigo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {formatDate(parte.fecha)}
            </p>
            {parte.horaInicio && (
              <p className="text-sm text-gray-600">
                Hora: {formatTime(parte.horaInicio)} - {formatTime(parte.horaFin) || '...'}
              </p>
            )}
          </div>
        </header>

        {/* ============================================ */}
        {/* DATOS DEL CLIENTE Y PROYECTO */}
        {/* ============================================ */}
        <section className="grid grid-cols-2 gap-8 mb-6">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Cliente
            </h3>
            <p className="font-semibold text-gray-900">{clienteNombre}</p>
            {parte.clienteNif && (
              <p className="text-gray-700">NIF: {parte.clienteNif}</p>
            )}
            {parte.clienteTelefono && (
              <p className="text-gray-600 text-sm">Tel: {parte.clienteTelefono}</p>
            )}
            {parte.direccionTrabajo?.calle && (
              <p className="text-gray-600 text-sm mt-1">
                {parte.direccionTrabajo.calle}
                {parte.direccionTrabajo.numero && ` ${parte.direccionTrabajo.numero}`}
                <br />
                {parte.direccionTrabajo.codigoPostal} {parte.direccionTrabajo.ciudad}
              </p>
            )}
          </div>

          {proyectoNombre && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Proyecto / Obra
              </h3>
              <p className="font-semibold text-gray-900">{proyectoNombre}</p>
              {parte.proyectoCodigo && (
                <p className="text-gray-600 text-sm">Ref: {parte.proyectoCodigo}</p>
              )}
            </div>
          )}
        </section>

        {/* Descripción del trabajo */}
        {parte.descripcion && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Descripción del Trabajo</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{parte.descripcion}</p>
          </div>
        )}

        {/* Introducción - Texto configurado en empresa */}
        {empresa?.textosLegales?.parteTrabajoIntroduccion && (
          <div className="mb-4 text-sm text-gray-700 whitespace-pre-wrap">
            {empresa.textosLegales.parteTrabajoIntroduccion}
          </div>
        )}

        {/* ============================================ */}
        {/* LÍNEAS DE PERSONAL */}
        {/* ============================================ */}
        {options.mostrarPersonal && (parte.lineasPersonal || []).length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b pb-1">
              Mano de Obra
            </h3>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-2 py-2 text-left">Trabajador</th>
                  <th className="px-2 py-2 text-left">Servicio</th>
                  <th className="px-2 py-2 text-center w-16">Entrada</th>
                  <th className="px-2 py-2 text-center w-16">Salida</th>
                  <th className="px-2 py-2 text-right w-16">Horas</th>
                  {options.mostrarPrecios && (
                    <th className="px-2 py-2 text-right w-20">Importe</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(parte.lineasPersonal || []).map((linea: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-2">{linea.personalNombre || 'Sin asignar'}</td>
                    <td className="px-2 py-2">{linea.productoServicioNombre || '-'}</td>
                    <td className="px-2 py-2 text-center">{formatTime(linea.horaInicio)}</td>
                    <td className="px-2 py-2 text-center">{formatTime(linea.horaFin)}</td>
                    <td className="px-2 py-2 text-right">
                      {((linea.horasTrabajadas || 0) + (linea.horasExtras || 0)).toFixed(2)}
                    </td>
                    {options.mostrarPrecios && (
                      <td className="px-2 py-2 text-right font-medium">
                        {formatCurrency(linea.ventaTotal || 0)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {options.mostrarPrecios && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={5} className="px-2 py-2 text-right">Subtotal Mano de Obra:</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totalPersonal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* LÍNEAS DE MATERIAL */}
        {/* ============================================ */}
        {options.mostrarMaterial && (parte.lineasMaterial || []).length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b pb-1">
              Materiales
            </h3>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-2 py-2 text-left">Producto</th>
                  <th className="px-2 py-2 text-right w-16">Cantidad</th>
                  <th className="px-2 py-2 text-center w-12">Ud.</th>
                  {options.mostrarPrecios && (
                    <>
                      <th className="px-2 py-2 text-right w-20">Precio</th>
                      <th className="px-2 py-2 text-right w-12">Dto</th>
                      <th className="px-2 py-2 text-right w-20">Importe</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(parte.lineasMaterial || []).map((linea: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-2">
                      {linea.productoNombre || linea.nombre || 'Sin nombre'}
                      {linea.codigo && <span className="text-gray-500 ml-1">({linea.codigo})</span>}
                    </td>
                    <td className="px-2 py-2 text-right">{linea.cantidad || 0}</td>
                    <td className="px-2 py-2 text-center">{linea.unidad || 'ud'}</td>
                    {options.mostrarPrecios && (
                      <>
                        <td className="px-2 py-2 text-right">{formatCurrency(linea.precioVenta || 0)}</td>
                        <td className="px-2 py-2 text-right">{linea.descuento ? `${linea.descuento}%` : '-'}</td>
                        <td className="px-2 py-2 text-right font-medium">{formatCurrency(linea.ventaTotal || 0)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              {options.mostrarPrecios && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={5} className="px-2 py-2 text-right">Subtotal Materiales:</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totalMaterial)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* LÍNEAS DE MAQUINARIA */}
        {/* ============================================ */}
        {options.mostrarMaquinaria && (parte.lineasMaquinaria || []).length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b pb-1">
              Maquinaria
            </h3>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-2 py-2 text-left">Máquina</th>
                  <th className="px-2 py-2 text-right w-16">Cantidad</th>
                  <th className="px-2 py-2 text-center w-16">Unidad</th>
                  {options.mostrarPrecios && (
                    <>
                      <th className="px-2 py-2 text-right w-20">Tarifa</th>
                      <th className="px-2 py-2 text-right w-20">Importe</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(parte.lineasMaquinaria || []).map((linea: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-2">{linea.nombre || 'Sin nombre'}</td>
                    <td className="px-2 py-2 text-right">{linea.cantidad || 0}</td>
                    <td className="px-2 py-2 text-center">{linea.tipoUnidad || 'horas'}</td>
                    {options.mostrarPrecios && (
                      <>
                        <td className="px-2 py-2 text-right">{formatCurrency(linea.tarifaVenta || 0)}</td>
                        <td className="px-2 py-2 text-right font-medium">{formatCurrency(linea.ventaTotal || 0)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              {options.mostrarPrecios && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={4} className="px-2 py-2 text-right">Subtotal Maquinaria:</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totalMaquinaria)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* LÍNEAS DE TRANSPORTE */}
        {/* ============================================ */}
        {options.mostrarTransporte && (parte.lineasTransporte || []).length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b pb-1">
              Transporte
            </h3>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-2 py-2 text-left">Vehículo</th>
                  <th className="px-2 py-2 text-left">Origen / Destino</th>
                  <th className="px-2 py-2 text-right w-16">Km</th>
                  {options.mostrarPrecios && (
                    <th className="px-2 py-2 text-right w-20">Importe</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(parte.lineasTransporte || []).map((linea: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-2">{linea.vehiculoNombre || linea.matricula || '-'}</td>
                    <td className="px-2 py-2">
                      {linea.origen && linea.destino ? `${linea.origen} → ${linea.destino}` : '-'}
                    </td>
                    <td className="px-2 py-2 text-right">{linea.kmRecorridos || 0}</td>
                    {options.mostrarPrecios && (
                      <td className="px-2 py-2 text-right font-medium">{formatCurrency(linea.precioVenta || 0)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
              {options.mostrarPrecios && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={3} className="px-2 py-2 text-right">Subtotal Transporte:</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totalTransporte)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* LÍNEAS DE GASTOS */}
        {/* ============================================ */}
        {options.mostrarGastos && (parte.lineasGastos || []).length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b pb-1">
              Otros Gastos
            </h3>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-2 py-2 text-left">Concepto</th>
                  <th className="px-2 py-2 text-left">Descripción</th>
                  {options.mostrarPrecios && (
                    <th className="px-2 py-2 text-right w-20">Importe</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(parte.lineasGastos || []).map((linea: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-2">{linea.tipoGastoNombre || 'Gasto'}</td>
                    <td className="px-2 py-2">{linea.descripcion || '-'}</td>
                    {options.mostrarPrecios && (
                      <td className="px-2 py-2 text-right font-medium">{formatCurrency(linea.importeFacturable || 0)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
              {options.mostrarPrecios && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={2} className="px-2 py-2 text-right">Subtotal Gastos:</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(totalGastos)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* TOTAL GENERAL */}
        {/* ============================================ */}
        {options.mostrarPrecios && (
          <section className="flex justify-end mb-6">
            <div className="w-72 border border-gray-300 rounded overflow-hidden">
              <div className="flex justify-between px-4 py-2 bg-gray-800 text-white font-bold">
                <span>TOTAL</span>
                <span>{formatCurrency(totalGeneral)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Observaciones */}
        {parte.observaciones && (
          <div className="mb-6 p-3 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Observaciones</h4>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{parte.observaciones}</p>
          </div>
        )}

        {/* ============================================ */}
        {/* FIRMAS */}
        {/* ============================================ */}
        {options.mostrarFirmas && (
          <section className="mt-8 mb-6">
            {/* Texto de conformidad */}
            {options.mostrarConformidad && empresa?.textosLegales?.parteTrabajoConformidad && (
              <div className="mb-4 text-sm text-gray-700 text-center italic">
                {empresa.textosLegales.parteTrabajoConformidad}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {/* Firma del técnico */}
              <div className="border border-gray-300 rounded p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">
                  Firma del Técnico
                </h4>
                <div className="h-24 border-b border-gray-400 mb-2 flex items-end justify-center">
                  {parte.firmaTecnico && (
                    <img src={parte.firmaTecnico} alt="Firma técnico" className="max-h-20" />
                  )}
                </div>
                <p className="text-center text-sm text-gray-600">
                  {parte.nombreTecnico || '_____________________'}
                </p>
                {parte.fechaFirmaTecnico && (
                  <p className="text-center text-xs text-gray-500 mt-1">
                    Fecha: {formatDate(parte.fechaFirmaTecnico)}
                  </p>
                )}
              </div>

              {/* Firma del cliente */}
              <div className="border border-gray-300 rounded p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">
                  Firma del Cliente (Conforme)
                </h4>
                <div className="h-24 border-b border-gray-400 mb-2 flex items-end justify-center">
                  {parte.firmaCliente && (
                    <img src={parte.firmaCliente} alt="Firma cliente" className="max-h-20" />
                  )}
                </div>
                <p className="text-center text-sm text-gray-600">
                  {parte.nombreCliente || '_____________________'}
                </p>
                {parte.dniCliente && (
                  <p className="text-center text-xs text-gray-500">
                    DNI: {parte.dniCliente}
                  </p>
                )}
                {parte.fechaFirmaCliente && (
                  <p className="text-center text-xs text-gray-500 mt-1">
                    Fecha: {formatDate(parte.fechaFirmaCliente)}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* PIE DE PÁGINA Y TEXTOS LEGALES */}
        {/* ============================================ */}
        <footer className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
          {/* Pie de página configurado */}
          {empresa?.textosLegales?.parteTrabajoPiePagina && (
            <div className="mb-3 whitespace-pre-wrap">
              {empresa.textosLegales.parteTrabajoPiePagina}
            </div>
          )}

          {/* LOPD */}
          {options.mostrarLOPD && empresa?.textosLegales?.textoLOPD && (
            <div className="mb-3 p-2 bg-gray-50 rounded">
              <p className="font-semibold text-gray-600 mb-1">Protección de Datos (LOPD/RGPD):</p>
              <p className="whitespace-pre-wrap">{empresa.textosLegales.textoLOPD}</p>
            </div>
          )}

          {/* Datos de registro mercantil */}
          {options.mostrarRegistroMercantil && empresa?.datosRegistro?.registroMercantil && (
            <div className="text-center mt-3">
              <p>
                Inscrita en el {empresa.datosRegistro.registroMercantil}
                {empresa.datosRegistro.tomo && `, Tomo ${empresa.datosRegistro.tomo}`}
                {empresa.datosRegistro.folio && `, Folio ${empresa.datosRegistro.folio}`}
                {empresa.datosRegistro.hoja && `, Hoja ${empresa.datosRegistro.hoja}`}
              </p>
            </div>
          )}
        </footer>
      </div>
    )
  }
)

ParteTrabajoView.displayName = 'ParteTrabajoView'

export default ParteTrabajoView
