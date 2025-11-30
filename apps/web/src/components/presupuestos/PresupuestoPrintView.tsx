'use client'

import React, { forwardRef } from 'react'
import { IPresupuesto, getEstadoConfig, getTipoLineaLabel, TipoLinea } from '@/types/presupuesto.types'
import { EmpresaInfo } from '@/services/empresa.service'

interface PresupuestoPrintViewProps {
  presupuesto: IPresupuesto
  empresa?: EmpresaInfo
}

/**
 * Componente de vista de impresión para presupuestos.
 * Diseño profesional con cabecera de empresa, datos del cliente y líneas.
 */
export const PresupuestoPrintView = forwardRef<HTMLDivElement, PresupuestoPrintViewProps>(
  ({ presupuesto, empresa }, ref) => {
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
    const clienteNombre = typeof presupuesto.clienteId === 'object'
      ? presupuesto.clienteId.nombre
      : presupuesto.clienteNombre

    // Estado del presupuesto
    const estadoConfig = getEstadoConfig(presupuesto.estado)

    // Líneas que se incluyen en el total (excluir texto puro)
    const lineasConImporte = (presupuesto.lineas || []).filter(
      l => l.tipo !== TipoLinea.TEXTO && l.tipo !== TipoLinea.SUBTOTAL
    )

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

          {/* Número de presupuesto */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">PRESUPUESTO</h2>
            <p className="text-lg font-semibold text-blue-700 mt-1">
              {presupuesto.codigo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {formatDate(presupuesto.fecha)}
            </p>
            <p className="text-sm text-gray-600">
              Válido hasta: {formatDate(presupuesto.fechaValidez)}
            </p>
          </div>
        </header>

        {/* ============================================ */}
        {/* DATOS DEL CLIENTE */}
        {/* ============================================ */}
        <section className="grid grid-cols-2 gap-8 mb-6">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Datos del Cliente
            </h3>
            <p className="font-semibold text-gray-900">{clienteNombre}</p>
            <p className="text-gray-700">NIF: {presupuesto.clienteNif}</p>
            {presupuesto.clienteEmail && (
              <p className="text-gray-600 text-sm">{presupuesto.clienteEmail}</p>
            )}
            {presupuesto.clienteTelefono && (
              <p className="text-gray-600 text-sm">Tel: {presupuesto.clienteTelefono}</p>
            )}
            {presupuesto.direccionFacturacion?.calle && (
              <p className="text-gray-600 text-sm mt-1">
                {presupuesto.direccionFacturacion.calle} {presupuesto.direccionFacturacion.numero}
                <br />
                {presupuesto.direccionFacturacion.codigoPostal} {presupuesto.direccionFacturacion.ciudad}
              </p>
            )}
          </div>

          {/* Dirección de entrega si es diferente */}
          {presupuesto.direccionEntrega && presupuesto.direccionEntrega.tipo !== 'recogida' && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Dirección de Entrega
              </h3>
              {presupuesto.direccionEntrega.nombre && (
                <p className="font-semibold text-gray-900">{presupuesto.direccionEntrega.nombre}</p>
              )}
              <p className="text-gray-600 text-sm">
                {presupuesto.direccionEntrega.calle} {presupuesto.direccionEntrega.numero}
                {presupuesto.direccionEntrega.piso && `, ${presupuesto.direccionEntrega.piso}`}
              </p>
              <p className="text-gray-600 text-sm">
                {presupuesto.direccionEntrega.codigoPostal} {presupuesto.direccionEntrega.ciudad}
              </p>
              {presupuesto.direccionEntrega.provincia && (
                <p className="text-gray-600 text-sm">
                  {presupuesto.direccionEntrega.provincia}, {presupuesto.direccionEntrega.pais}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Título del presupuesto */}
        {presupuesto.titulo && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {presupuesto.titulo}
            </h3>
            {presupuesto.descripcion && (
              <p className="text-gray-600 text-sm mt-1">{presupuesto.descripcion}</p>
            )}
          </div>
        )}

        {/* Introducción */}
        {presupuesto.introduccion && (
          <div className="mb-4 text-sm text-gray-700 whitespace-pre-wrap">
            {presupuesto.introduccion}
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
              {(presupuesto.lineas || []).map((linea, index) => {
                // Línea de texto (sin valores)
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

                // Línea normal
                return (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      <div className="font-medium text-gray-900">{linea.nombre}</div>
                      {linea.descripcion && (
                        <div className="text-gray-500 text-xs mt-0.5">{linea.descripcion}</div>
                      )}
                      {linea.codigo && (
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
          <div className="w-72 border border-gray-300 rounded overflow-hidden">
            {/* Subtotal */}
            <div className="flex justify-between px-4 py-2 border-b border-gray-200">
              <span className="text-gray-600">Base Imponible:</span>
              <span className="font-medium">{formatCurrency(presupuesto.totales?.subtotalNeto || 0)}</span>
            </div>

            {/* Descuento global si existe */}
            {presupuesto.descuentoGlobalPorcentaje > 0 && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-200 text-orange-600">
                <span>Descuento ({presupuesto.descuentoGlobalPorcentaje}%):</span>
                <span>-{formatCurrency(presupuesto.descuentoGlobalImporte || 0)}</span>
              </div>
            )}

            {/* Desglose de IVA */}
            {presupuesto.totales?.desgloseIva && presupuesto.totales.desgloseIva.length > 0 && (
              presupuesto.totales.desgloseIva.map((desglose, idx) => (
                <div key={idx} className="flex justify-between px-4 py-2 border-b border-gray-200">
                  <span className="text-gray-600">IVA {desglose.tipo}%:</span>
                  <span>{formatCurrency(desglose.cuota)}</span>
                </div>
              ))
            )}

            {/* IVA total si no hay desglose */}
            {(!presupuesto.totales?.desgloseIva || presupuesto.totales.desgloseIva.length === 0) && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-gray-600">IVA:</span>
                <span>{formatCurrency(presupuesto.totales?.totalIva || 0)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between px-4 py-3 bg-gray-800 text-white">
              <span className="font-bold">TOTAL:</span>
              <span className="font-bold text-lg">{formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}</span>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* PIE DE PÁGINA Y CONDICIONES */}
        {/* ============================================ */}
        <footer className="mt-8 pt-4 border-t border-gray-300">
          {/* Condiciones comerciales */}
          {presupuesto.condiciones && (
            <div className="mb-4 text-sm text-gray-600">
              <h4 className="font-semibold text-gray-800 mb-2">Condiciones:</h4>
              <ul className="list-disc list-inside space-y-1">
                {presupuesto.condiciones.validezDias && (
                  <li>Presupuesto válido por {presupuesto.condiciones.validezDias} días</li>
                )}
                {presupuesto.condiciones.tiempoEntrega && (
                  <li>Plazo de entrega: {presupuesto.condiciones.tiempoEntrega}</li>
                )}
                {presupuesto.condiciones.garantia && (
                  <li>Garantía: {presupuesto.condiciones.garantia}</li>
                )}
                {presupuesto.condiciones.portesPagados !== undefined && (
                  <li>
                    Portes: {presupuesto.condiciones.portesPagados
                      ? 'Incluidos'
                      : presupuesto.condiciones.portesImporte
                        ? formatCurrency(presupuesto.condiciones.portesImporte)
                        : 'A cargo del cliente'}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Pie de página personalizado */}
          {presupuesto.piePagina && (
            <div className="mb-4 text-sm text-gray-600 whitespace-pre-wrap">
              {presupuesto.piePagina}
            </div>
          )}

          {/* Condiciones legales */}
          {presupuesto.condicionesLegales && (
            <div className="text-xs text-gray-500 whitespace-pre-wrap border-t border-gray-200 pt-3 mt-3">
              {presupuesto.condicionesLegales}
            </div>
          )}

          {/* Firma/Aceptación */}
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-8">
                <p className="text-sm text-gray-600">Firma y sello de la empresa</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-8">
                <p className="text-sm text-gray-600">Conforme del cliente</p>
                <p className="text-xs text-gray-400 mt-1">Fecha: ___/___/_____</p>
              </div>
            </div>
          </div>
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

            /* Ocultar elementos que no deben imprimirse */
            nav, aside, .no-print, button, .sidebar {
              display: none !important;
            }

            /* Asegurar que los colores de fondo se impriman */
            .bg-gray-800 {
              background-color: #1f2937 !important;
              -webkit-print-color-adjust: exact !important;
            }

            .bg-gray-100, .bg-gray-50 {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
            }

            /* Evitar que la tabla se corte */
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

PresupuestoPrintView.displayName = 'PresupuestoPrintView'

export default PresupuestoPrintView
