'use client'

import React, { forwardRef } from 'react'
import { IFactura, getEstadoConfig, getTipoFacturaLabel, TipoLinea, TipoFactura, getMetodoPagoLabel } from '@/types/factura.types'
import { EmpresaInfo } from '@/services/empresa.service'

export interface PrintOptions {
  mostrarDescripcion: 'ninguna' | 'corta' | 'larga'
  mostrarReferencias: boolean
  mostrarCondiciones: boolean
  mostrarVencimientos: boolean
  mostrarLOPD: boolean
  mostrarRegistroMercantil: boolean
  mostrarCuentaBancaria: boolean
  mostrarQR: boolean
}

export const defaultPrintOptions: PrintOptions = {
  mostrarDescripcion: 'corta',
  mostrarReferencias: true,
  mostrarCondiciones: true,
  mostrarVencimientos: true,
  mostrarLOPD: true,
  mostrarRegistroMercantil: true,
  mostrarCuentaBancaria: true,
  mostrarQR: true,
}

interface FacturaPrintViewProps {
  factura: IFactura
  empresa?: EmpresaInfo
  options?: PrintOptions
}

/**
 * Componente de vista de impresión para facturas.
 * Incluye QR VeriFactu/TicketBAI, condiciones y LOPD.
 */
export const FacturaPrintView = forwardRef<HTMLDivElement, FacturaPrintViewProps>(
  ({ factura, empresa, options = defaultPrintOptions }, ref) => {
    // Formatear moneda
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value || 0)
    }

    // Formatear fecha
    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    // Obtener nombre del cliente
    const clienteNombre = typeof factura.clienteId === 'object'
      ? (factura.clienteId as any).nombre
      : factura.clienteNombre

    // Estado de la factura
    const estadoConfig = getEstadoConfig(factura.estado)

    // Líneas que se incluyen en el total
    const lineasConImporte = (factura.lineas || []).filter(
      l => l.tipo !== TipoLinea.TEXTO && l.tipo !== TipoLinea.SUBTOTAL
    )

    // Título del documento según tipo
    const getTituloDocumento = () => {
      switch (factura.tipo) {
        case TipoFactura.RECTIFICATIVA:
          return 'FACTURA RECTIFICATIVA'
        case TipoFactura.SIMPLIFICADA:
          return 'FACTURA SIMPLIFICADA'
        case TipoFactura.PROFORMA:
          return 'FACTURA PROFORMA'
        case TipoFactura.RECAPITULATIVA:
          return 'FACTURA RECAPITULATIVA'
        default:
          return 'FACTURA'
      }
    }

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
              {empresa?.web && (
                <p className="text-gray-600">{empresa.web}</p>
              )}
            </div>
          </div>

          {/* Número de factura y QR */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">{getTituloDocumento()}</h2>
            <p className="text-lg font-semibold text-blue-700 mt-1">
              {factura.codigo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {formatDate(factura.fecha)}
            </p>
            {factura.fechaOperacion && factura.fechaOperacion !== factura.fecha && (
              <p className="text-sm text-gray-600">
                Fecha operación: {formatDate(factura.fechaOperacion)}
              </p>
            )}

            {/* QR Code VeriFactu/TicketBAI */}
            {options.mostrarQR && factura.codigoQR && (
              <div className="mt-3">
                <img
                  src={factura.codigoQR}
                  alt="Código QR"
                  className="w-24 h-24 ml-auto"
                />
                {(factura.verifactu as any)?.huella && (
                  <p className="text-[8px] text-gray-500 mt-1">
                    Huella: {(factura.verifactu as any).huella}
                  </p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Rectificativa - Factura original */}
        {factura.esRectificativa && factura.facturaRectificadaCodigo && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm text-amber-800">
              <strong>Factura rectificativa</strong> de la factura {factura.facturaRectificadaCodigo}
              {factura.motivoRectificacion && (
                <span> · Motivo: {factura.motivoRectificacion}</span>
              )}
            </p>
            {factura.descripcionRectificacion && (
              <p className="text-sm text-amber-700 mt-1">{factura.descripcionRectificacion}</p>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* DATOS DEL CLIENTE */}
        {/* ============================================ */}
        <section className="grid grid-cols-2 gap-8 mb-6">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Datos del Cliente
            </h3>
            <p className="font-semibold text-gray-900">{clienteNombre}</p>
            <p className="text-gray-700">NIF: {factura.clienteNif}</p>
            {factura.clienteEmail && (
              <p className="text-gray-600 text-sm">{factura.clienteEmail}</p>
            )}
            {factura.clienteTelefono && (
              <p className="text-gray-600 text-sm">Tel: {factura.clienteTelefono}</p>
            )}
            {factura.direccionFacturacion?.calle && (
              <p className="text-gray-600 text-sm mt-1">
                {factura.direccionFacturacion.calle} {factura.direccionFacturacion.numero}
                <br />
                {factura.direccionFacturacion.codigoPostal} {factura.direccionFacturacion.ciudad}
              </p>
            )}
          </div>

          {/* Referencias */}
          <div className="text-sm space-y-1">
            {factura.referenciaCliente && (
              <p className="text-gray-600">
                <span className="font-medium">Ref. Cliente:</span> {factura.referenciaCliente}
              </p>
            )}
            {factura.albaranesOrigen && factura.albaranesOrigen.length > 0 && (
              <p className="text-gray-600">
                <span className="font-medium">Albaranes:</span> {factura.albaranesOrigen.length} documento(s)
              </p>
            )}
            {factura.pedidosOrigen && factura.pedidosOrigen.length > 0 && (
              <p className="text-gray-600">
                <span className="font-medium">Pedidos:</span> {factura.pedidosOrigen.length} documento(s)
              </p>
            )}
          </div>
        </section>

        {/* Título de la factura */}
        {factura.titulo && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {factura.titulo}
            </h3>
            {factura.descripcion && (
              <p className="text-gray-600 text-sm mt-1">{factura.descripcion}</p>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* TABLA DE LÍNEAS */}
        {/* ============================================ */}
        <section className="mb-6">
          <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-left w-8">#</th>
                <th className="px-2 py-2 text-left">Descripción</th>
                <th className="px-2 py-2 text-right w-16">Cant.</th>
                <th className="px-2 py-2 text-right w-20">Precio</th>
                <th className="px-2 py-2 text-right w-14">Dto</th>
                <th className="px-2 py-2 text-right w-14">IVA</th>
                <th className="px-2 py-2 text-right w-24">Importe</th>
              </tr>
            </thead>
            <tbody>
              {(factura.lineas || []).map((linea, index) => {
                // Línea de texto
                if (linea.tipo === TipoLinea.TEXTO) {
                  return (
                    <tr key={index} className="border-b border-gray-200">
                      <td colSpan={7} className="px-2 py-2 text-gray-600 italic">
                        {linea.nombre}
                      </td>
                    </tr>
                  )
                }

                // Línea de subtotal
                if (linea.tipo === TipoLinea.SUBTOTAL) {
                  return (
                    <tr key={index} className="border-b-2 border-gray-400 bg-gray-100">
                      <td colSpan={6} className="px-2 py-2 text-right font-semibold">
                        Subtotal:
                      </td>
                      <td className="px-2 py-2 text-right font-semibold">
                        {formatCurrency(linea.subtotal || 0)}
                      </td>
                    </tr>
                  )
                }

                // Descripción según opciones
                const descripcionMostrar = options.mostrarDescripcion === 'ninguna'
                  ? null
                  : options.mostrarDescripcion === 'larga'
                    ? linea.descripcion
                    : (linea.descripcion && linea.descripcion.length > 100
                      ? linea.descripcion.substring(0, 100) + '...'
                      : linea.descripcion)

                return (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      <div className="font-medium text-gray-900">{linea.nombre}</div>
                      {descripcionMostrar && (
                        <div className="text-gray-500 text-xs mt-0.5">{descripcionMostrar}</div>
                      )}
                      {options.mostrarReferencias && linea.codigo && (
                        <div className="text-gray-400 text-xs">Ref: {linea.codigo}</div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {linea.cantidad} {linea.unidad || 'ud'}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {formatCurrency(linea.precioUnitario)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {linea.descuento > 0 ? `${linea.descuento}%` : '-'}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {linea.iva}%
                      {linea.recargoEquivalencia && linea.recargoEquivalencia > 0 && (
                        <span className="text-gray-500 block text-[9px]">+{linea.recargoEquivalencia}% RE</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {formatCurrency(linea.subtotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* ============================================ */}
        {/* TOTALES */}
        {/* ============================================ */}
        <section className="flex justify-end mb-6">
          <div className="w-80 border border-gray-300 rounded overflow-hidden">
            {/* Subtotal */}
            <div className="flex justify-between px-4 py-2 border-b border-gray-200">
              <span className="text-gray-600">Base Imponible:</span>
              <span className="font-medium">{formatCurrency(factura.totales?.subtotalNeto || 0)}</span>
            </div>

            {/* Descuento global */}
            {factura.descuentoGlobalPorcentaje > 0 && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-200 text-orange-600">
                <span>Descuento ({factura.descuentoGlobalPorcentaje}%):</span>
                <span>-{formatCurrency(factura.descuentoGlobalImporte || 0)}</span>
              </div>
            )}

            {/* Desglose de IVA */}
            {factura.totales?.desgloseIva && factura.totales.desgloseIva.length > 0 && (
              factura.totales.desgloseIva.map((desglose, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                    <span className="text-gray-600">IVA {desglose.tipo}% (Base: {formatCurrency(desglose.base)}):</span>
                    <span>{formatCurrency(desglose.cuota)}</span>
                  </div>
                  {desglose.recargo && desglose.recargo > 0 && (
                    <div className="flex justify-between px-4 py-1 border-b border-gray-200 text-sm">
                      <span className="text-gray-500 pl-4">Rec. Equiv. {desglose.recargo}%:</span>
                      <span className="text-gray-600">{formatCurrency(desglose.cuotaRecargo || 0)}</span>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}

            {/* Recargo equivalencia total si aplica */}
            {factura.recargoEquivalencia && factura.totales?.totalRecargoEquivalencia > 0 && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-gray-600">Total Recargo Equiv.:</span>
                <span>{formatCurrency(factura.totales.totalRecargoEquivalencia)}</span>
              </div>
            )}

            {/* Retención IRPF si aplica */}
            {factura.retencionIRPF && factura.retencionIRPF > 0 && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-200 text-red-600">
                <span>Retención IRPF ({factura.retencionIRPF}%):</span>
                <span>-{formatCurrency(factura.importeRetencion || 0)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between px-4 py-3 bg-gray-800 text-white">
              <span className="font-bold">TOTAL FACTURA:</span>
              <span className="font-bold text-lg">{formatCurrency(factura.totales?.totalFactura || 0)}</span>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* VENCIMIENTOS */}
        {/* ============================================ */}
        {options.mostrarVencimientos && factura.vencimientos && factura.vencimientos.length > 0 && (
          <section className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Vencimientos:</h4>
            <table className="w-full border-collapse text-sm" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border border-gray-200">Nº</th>
                  <th className="px-3 py-2 text-left border border-gray-200">Fecha</th>
                  <th className="px-3 py-2 text-right border border-gray-200">Importe</th>
                  <th className="px-3 py-2 text-left border border-gray-200">Forma de Pago</th>
                  <th className="px-3 py-2 text-center border border-gray-200">Estado</th>
                </tr>
              </thead>
              <tbody>
                {factura.vencimientos.map((venc, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 border border-gray-200">{venc.numero}</td>
                    <td className="px-3 py-2 border border-gray-200">{formatDate(venc.fecha)}</td>
                    <td className="px-3 py-2 text-right border border-gray-200 font-medium">
                      {formatCurrency(venc.importe)}
                    </td>
                    <td className="px-3 py-2 border border-gray-200">{getMetodoPagoLabel(venc.metodoPago)}</td>
                    <td className="px-3 py-2 text-center border border-gray-200">
                      <span className={`px-2 py-0.5 rounded text-xs ${venc.cobrado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {venc.cobrado ? 'Cobrado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* PIE DE PÁGINA Y CONDICIONES */}
        {/* ============================================ */}
        <footer className="mt-8 pt-4 border-t border-gray-300">
          {/* Condiciones de pago */}
          {options.mostrarCondiciones && factura.condicionesPago && (
            <div className="mb-4 text-sm text-gray-600">
              <h4 className="font-semibold text-gray-800 mb-2">Condiciones de Pago:</h4>
              <p className="whitespace-pre-wrap">{factura.condicionesPago}</p>
            </div>
          )}

          {/* Pie de factura personalizado */}
          {factura.pieFactura && (
            <div className="mb-4 text-sm text-gray-600 whitespace-pre-wrap">
              {factura.pieFactura}
            </div>
          )}

          {/* Condiciones generales de la empresa */}
          {options.mostrarCondiciones && empresa?.textosLegales?.facturaCondiciones && (
            <div className="mb-4 text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Condiciones Generales:</h4>
              {empresa.textosLegales.facturaCondiciones}
            </div>
          )}

          {/* Cuenta bancaria */}
          {options.mostrarCuentaBancaria && empresa?.cuentasBancarias && empresa.cuentasBancarias.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Datos Bancarios:</h4>
              {(() => {
                const cuentaPredeterminada = empresa.cuentasBancarias.find(c => c.predeterminada && c.activa)
                  || empresa.cuentasBancarias.find(c => c.activa)
                if (!cuentaPredeterminada) return null
                return (
                  <div className="text-xs text-gray-600 space-y-1">
                    {cuentaPredeterminada.banco && (
                      <p><span className="font-medium">Banco:</span> {cuentaPredeterminada.banco}</p>
                    )}
                    <p><span className="font-medium">Titular:</span> {cuentaPredeterminada.titular}</p>
                    <p><span className="font-medium">IBAN:</span> {cuentaPredeterminada.iban}</p>
                    {cuentaPredeterminada.swift && (
                      <p><span className="font-medium">BIC/SWIFT:</span> {cuentaPredeterminada.swift}</p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Observaciones */}
          {factura.observaciones && (
            <div className="mt-4 text-sm text-gray-600">
              <h4 className="font-semibold text-gray-800 mb-1">Observaciones:</h4>
              <p className="whitespace-pre-wrap">{factura.observaciones}</p>
            </div>
          )}

          {/* ============================================ */}
          {/* TEXTO LOPD/RGPD */}
          {/* ============================================ */}
          {options.mostrarLOPD && empresa?.textosLegales?.textoLOPD && (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="text-[9px] text-gray-500 whitespace-pre-wrap leading-tight">
                {empresa.textosLegales.textoLOPD}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* DATOS DE REGISTRO MERCANTIL */}
          {/* ============================================ */}
          {options.mostrarRegistroMercantil && empresa?.datosRegistro && (
            <div className="mt-4 pt-3 border-t border-gray-200 text-center">
              <p className="text-[9px] text-gray-500">
                {empresa.nombre}
                {empresa.nif && ` · CIF: ${empresa.nif}`}
                {empresa.datosRegistro.registroMercantil && ` · ${empresa.datosRegistro.registroMercantil}`}
                {empresa.datosRegistro.tomo && ` · Tomo ${empresa.datosRegistro.tomo}`}
                {empresa.datosRegistro.folio && `, Folio ${empresa.datosRegistro.folio}`}
                {empresa.datosRegistro.hoja && `, Hoja ${empresa.datosRegistro.hoja}`}
                {empresa.datosRegistro.inscripcion && `, Inscripción ${empresa.datosRegistro.inscripcion}`}
              </p>
              {empresa.direccion && (
                <p className="text-[9px] text-gray-500 mt-1">
                  {empresa.direccion.calle}
                  {empresa.direccion.numero && `, ${empresa.direccion.numero}`}
                  {empresa.direccion.codigoPostal && ` · ${empresa.direccion.codigoPostal}`}
                  {empresa.direccion.ciudad && ` ${empresa.direccion.ciudad}`}
                  {empresa.telefono && ` · Tel: ${empresa.telefono}`}
                  {empresa.email && ` · ${empresa.email}`}
                  {empresa.web && ` · ${empresa.web}`}
                </p>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* INFORMACIÓN FISCAL VeriFactu */}
          {/* ============================================ */}
          {factura.verifactu && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-[8px] text-gray-400 text-center space-y-0.5">
                <p>Factura generada conforme al Reglamento VeriFactu (RD 1007/2023)</p>
                <p>ID: {factura.verifactu.idFactura} · Hash: {factura.verifactu.hash.substring(0, 16)}...</p>
                {factura.verifactu.estadoEnvio === 'aceptado' && (
                  <p className="text-green-600">✓ Factura verificada por la AEAT</p>
                )}
              </div>
            </div>
          )}

          {factura.ticketbai && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-[8px] text-gray-400 text-center space-y-0.5">
                <p>Factura generada conforme a TicketBAI</p>
                <p>TBAI-ID: {factura.ticketbai.tbaiId}</p>
                {factura.ticketbai.estadoEnvio === 'aceptado' && (
                  <p className="text-green-600">✓ Factura verificada</p>
                )}
              </div>
            </div>
          )}
        </footer>

        {/* Estilos de impresión */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-view {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            nav, aside, .no-print, button, .sidebar {
              display: none !important;
            }

            .bg-gray-800 {
              background-color: #1f2937 !important;
              -webkit-print-color-adjust: exact;
            }

            .bg-gray-100 {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact;
            }

            .bg-gray-50 {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact;
            }

            .text-white {
              color: white !important;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-footer-group;
            }
          }
        `}</style>
      </div>
    )
  }
)

FacturaPrintView.displayName = 'FacturaPrintView'

export default FacturaPrintView
