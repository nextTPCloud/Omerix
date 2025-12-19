'use client'

import React, { forwardRef } from 'react'
import { AlbaranCompra } from '@/types/albaran-compra.types'
import { EmpresaInfo } from '@/services/empresa.service'

export interface PrintOptions {
  mostrarDescripcion: 'ninguna' | 'corta' | 'larga'
  mostrarReferencias: boolean
}

export const defaultPrintOptions: PrintOptions = {
  mostrarDescripcion: 'corta',
  mostrarReferencias: true,
}

interface AlbaranCompraPrintViewProps {
  albaran: AlbaranCompra
  empresa?: EmpresaInfo
  options?: PrintOptions
}

/**
 * Componente de vista de impresion para albaranes de compra.
 */
export const AlbaranCompraPrintView = forwardRef<HTMLDivElement, AlbaranCompraPrintViewProps>(
  ({ albaran, empresa, options = defaultPrintOptions }, ref) => {
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

          {/* Numero de albaran */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">ALBARAN DE COMPRA</h2>
            <p className="text-lg font-semibold text-green-700 mt-1">
              {albaran.codigo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {formatDate(albaran.fecha)}
            </p>
            {albaran.fechaRecepcion && (
              <p className="text-sm text-gray-600">
                Recepcion: {formatDate(albaran.fechaRecepcion)}
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
            <p className="font-semibold text-gray-900">{albaran.proveedorNombre}</p>
            <p className="text-gray-700">NIF: {albaran.proveedorNif}</p>
            {albaran.proveedorEmail && (
              <p className="text-gray-600 text-sm">{albaran.proveedorEmail}</p>
            )}
            {albaran.proveedorTelefono && (
              <p className="text-gray-600 text-sm">Tel: {albaran.proveedorTelefono}</p>
            )}
          </div>

          {/* Info adicional */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Informacion
            </h3>
            {albaran.albaranProveedor && (
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Alb. Proveedor:</span> {albaran.albaranProveedor}
              </p>
            )}
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Serie:</span> {albaran.serie || '-'}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Numero:</span> {albaran.numero || '-'}
            </p>
          </div>
        </section>

        {/* Titulo del albaran */}
        {albaran.titulo && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {albaran.titulo}
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
                <th className="px-2 py-2 text-right w-16">Recib.</th>
                <th className="px-2 py-2 text-right w-20">Precio</th>
                <th className="px-2 py-2 text-right w-14">Dto</th>
                <th className="px-2 py-2 text-right w-14">IVA</th>
                <th className="px-2 py-2 text-right w-24">Importe</th>
              </tr>
            </thead>
            <tbody>
              {(albaran.lineas || []).map((linea: any, index) => {
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
                      <span className={linea.cantidadRecibida >= linea.cantidad ? 'text-green-700' : 'text-yellow-700'}>
                        {linea.cantidadRecibida || 0}
                      </span>
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
              <span className="font-medium">{formatCurrency(albaran.totales?.subtotalNeto || 0)}</span>
            </div>

            {/* IVA */}
            <div className="flex justify-between px-4 py-2 border-b border-gray-200">
              <span className="text-gray-600">IVA:</span>
              <span>{formatCurrency(albaran.totales?.totalIva || 0)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between px-4 py-3 bg-gray-800 text-white">
              <span className="font-bold">TOTAL:</span>
              <span className="font-bold text-lg">{formatCurrency(albaran.totales?.totalAlbaran || 0)}</span>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* OBSERVACIONES */}
        {/* ============================================ */}
        <footer className="mt-8 pt-4 border-t border-gray-300">
          {/* Observaciones */}
          {albaran.observaciones && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Observaciones:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{albaran.observaciones}</p>
            </div>
          )}

          {/* Observaciones de almacen */}
          {albaran.observacionesAlmacen && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Observaciones de Almacen:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{albaran.observacionesAlmacen}</p>
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

AlbaranCompraPrintView.displayName = 'AlbaranCompraPrintView'

export default AlbaranCompraPrintView
