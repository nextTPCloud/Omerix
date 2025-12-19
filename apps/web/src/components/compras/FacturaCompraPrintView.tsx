'use client'

import React, { forwardRef } from 'react'
import { FacturaCompra } from '@/types/factura-compra.types'
import { EmpresaInfo } from '@/services/empresa.service'

export interface PrintOptions {
  mostrarDescripcion: 'ninguna' | 'corta' | 'larga'
  mostrarReferencias: boolean
  mostrarVencimientos: boolean
}

export const defaultPrintOptions: PrintOptions = {
  mostrarDescripcion: 'corta',
  mostrarReferencias: true,
  mostrarVencimientos: true,
}

interface FacturaCompraPrintViewProps {
  factura: FacturaCompra
  empresa?: EmpresaInfo
  options?: PrintOptions
}

/**
 * Componente de vista de impresion para facturas de compra.
 */
export const FacturaCompraPrintView = forwardRef<HTMLDivElement, FacturaCompraPrintViewProps>(
  ({ factura, empresa, options = defaultPrintOptions }, ref) => {
    // Formatear moneda
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value || 0)
    }

    // Formatear fecha
    const formatDate = (date: string | Date | undefined) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
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
            </div>
          </div>

          {/* Numero de factura */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">FACTURA DE COMPRA</h2>
            <p className="text-lg font-semibold text-purple-700 mt-1">
              {factura.codigo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {formatDate(factura.fecha)}
            </p>
            {factura.numeroFacturaProveedor && (
              <p className="text-sm text-gray-600">
                Fact. Prov.: {factura.numeroFacturaProveedor}
              </p>
            )}
          </div>
        </header>

        {/* ============================================ */}
        {/* DATOS DEL PROVEEDOR */}
        {/* ============================================ */}
        <section className="grid grid-cols-2 gap-8 mb-6">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Proveedor
            </h3>
            <p className="font-semibold text-gray-900">{factura.proveedorNombre}</p>
            <p className="text-gray-700">NIF: {factura.proveedorNif}</p>
            {factura.proveedorEmail && (
              <p className="text-gray-600 text-sm">{factura.proveedorEmail}</p>
            )}
            {factura.proveedorTelefono && (
              <p className="text-gray-600 text-sm">Tel: {factura.proveedorTelefono}</p>
            )}
          </div>

          {/* Info adicional */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Informacion
            </h3>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Serie:</span> {factura.serie || '-'}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Numero:</span> {factura.numero || '-'}
            </p>
            {factura.fechaFacturaProveedor && (
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Fecha Fact. Prov.:</span> {formatDate(factura.fechaFacturaProveedor)}
              </p>
            )}
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Estado:</span> {factura.contabilizada ? 'Contabilizada' : 'Pendiente contab.'}
            </p>
          </div>
        </section>

        {/* Titulo de la factura */}
        {factura.titulo && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {factura.titulo}
            </h3>
          </div>
        )}

        {/* ============================================ */}
        {/* TABLA DE LINEAS */}
        {/* ============================================ */}
        <section className="mb-6">
          <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-left w-8">#</th>
                <th className="px-2 py-2 text-left">Descripcion</th>
                <th className="px-2 py-2 text-right w-16">Cant.</th>
                <th className="px-2 py-2 text-right w-20">Precio</th>
                <th className="px-2 py-2 text-right w-14">Dto</th>
                <th className="px-2 py-2 text-right w-14">IVA</th>
                <th className="px-2 py-2 text-right w-24">Importe</th>
              </tr>
            </thead>
            <tbody>
              {(factura.lineas || []).map((linea: any, index) => {
                // Determinar que descripcion mostrar segun las opciones
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
                      {options.mostrarReferencias && linea.sku && (
                        <div className="text-gray-400 text-xs">SKU: {linea.sku}</div>
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
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {formatCurrency(linea.total)}
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
          <div className="w-72 border border-gray-300 rounded overflow-hidden">
            {/* Subtotal */}
            <div className="flex justify-between px-4 py-2 border-b border-gray-200">
              <span className="text-gray-600">Base Imponible:</span>
              <span className="font-medium">{formatCurrency(factura.totales?.subtotalNeto || 0)}</span>
            </div>

            {/* Desglose IVA */}
            {factura.totales?.desgloseIva?.map((desglose, idx) => (
              <div key={idx} className="flex justify-between px-4 py-1 border-b border-gray-200">
                <span className="text-gray-600 text-xs">IVA {desglose.tipo}%:</span>
                <span className="text-xs">{formatCurrency(desglose.cuota)}</span>
              </div>
            ))}

            {/* Total IVA */}
            <div className="flex justify-between px-4 py-2 border-b border-gray-200">
              <span className="text-gray-600">Total IVA:</span>
              <span>{formatCurrency(factura.totales?.totalIva || 0)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between px-4 py-3 bg-gray-800 text-white">
              <span className="font-bold">TOTAL:</span>
              <span className="font-bold text-lg">{formatCurrency(factura.totales?.totalFactura || 0)}</span>
            </div>

            {/* Pagado y Pendiente */}
            {factura.totales?.totalPagado > 0 && (
              <>
                <div className="flex justify-between px-4 py-2 border-b border-gray-200 bg-green-50">
                  <span className="text-green-700">Pagado:</span>
                  <span className="text-green-700 font-medium">{formatCurrency(factura.totales?.totalPagado || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 bg-orange-50">
                  <span className="text-orange-700 font-medium">Pendiente:</span>
                  <span className="text-orange-700 font-bold">{formatCurrency(factura.totales?.totalPendiente || 0)}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ============================================ */}
        {/* VENCIMIENTOS */}
        {/* ============================================ */}
        {options.mostrarVencimientos && factura.vencimientos && factura.vencimientos.length > 0 && (
          <section className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Vencimientos:</h4>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">Num.</th>
                  <th className="px-2 py-1 text-left">Fecha Vencimiento</th>
                  <th className="px-2 py-1 text-right">Importe</th>
                  <th className="px-2 py-1 text-right">Pagado</th>
                  <th className="px-2 py-1 text-right">Pendiente</th>
                  <th className="px-2 py-1 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {factura.vencimientos.map((venc, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-1">{venc.numero || index + 1}</td>
                    <td className="px-2 py-1">{formatDate(venc.fechaVencimiento)}</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(venc.importe)}</td>
                    <td className="px-2 py-1 text-right text-green-600">{formatCurrency(venc.importePagado || 0)}</td>
                    <td className="px-2 py-1 text-right text-orange-600">{formatCurrency(venc.importePendiente || 0)}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${venc.pagado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {venc.pagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ============================================ */}
        {/* OBSERVACIONES */}
        {/* ============================================ */}
        <footer className="mt-8 pt-4 border-t border-gray-300">
          {/* Observaciones */}
          {factura.observaciones && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Observaciones:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{factura.observaciones}</p>
            </div>
          )}

          {/* Datos de empresa */}
          {empresa && (
            <div className="mt-4 pt-3 border-t border-gray-200 text-center">
              <p className="text-[9px] text-gray-500">
                {empresa.nombre}
                {empresa.nif && ` - CIF: ${empresa.nif}`}
              </p>
              {empresa.direccion && (
                <p className="text-[9px] text-gray-500 mt-1">
                  {empresa.direccion.calle}
                  {empresa.direccion.numero && `, ${empresa.direccion.numero}`}
                  {empresa.direccion.codigoPostal && ` - ${empresa.direccion.codigoPostal}`}
                  {empresa.direccion.ciudad && ` ${empresa.direccion.ciudad}`}
                  {empresa.telefono && ` - Tel: ${empresa.telefono}`}
                  {empresa.email && ` - ${empresa.email}`}
                </p>
              )}
            </div>
          )}
        </footer>

        {/* Estilos de impresion */}
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
              -webkit-print-color-adjust: exact !important;
            }

            .bg-gray-100, .bg-gray-50 {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
            }

            .bg-green-50 {
              background-color: #f0fdf4 !important;
              -webkit-print-color-adjust: exact !important;
            }

            .bg-orange-50 {
              background-color: #fff7ed !important;
              -webkit-print-color-adjust: exact !important;
            }

            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
        `}</style>
      </div>
    )
  }
)

FacturaCompraPrintView.displayName = 'FacturaCompraPrintView'

export default FacturaCompraPrintView
