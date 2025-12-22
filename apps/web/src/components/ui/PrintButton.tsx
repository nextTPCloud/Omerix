'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column {
  key: string
  label: string
  render?: (value: any, row?: any) => React.ReactNode | string
}

interface Stat {
  label: string
  value: number | string
}

interface PrintButtonProps {
  data: any[]
  columns: Column[]
  title?: string
  stats?: Stat[]
  filters?: Record<string, any>
  className?: string
}

export function PrintButton({
  data,
  columns,
  title = 'Listado',
  stats = [],
  filters = {},
  className
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = React.useState(false)

  const handlePrint = () => {
    setIsPrinting(true)

    // Esperar un frame para que React actualice el DOM
    requestAnimationFrame(() => {
      window.print()
      setIsPrinting(false)
    })
  }

  // Formatear valores para mostrar
  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-'

    // Fechas
    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES')
    }

    // Booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }

    // Números que parecen moneda
    if (key.toLowerCase().includes('precio') ||
        key.toLowerCase().includes('importe') ||
        key.toLowerCase().includes('riesgo') ||
        key.toLowerCase().includes('limite') ||
        key.toLowerCase().includes('credito')) {
      const num = Number(value)
      if (!isNaN(num)) {
        return num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
      }
    }

    // Objetos (como direcciones)
    if (typeof value === 'object') {
      if (value.calle) {
        return `${value.calle}, ${value.codigoPostal} ${value.ciudad}`
      }
      return JSON.stringify(value)
    }

    return String(value)
  }

  // Filtros activos para mostrar
  const activeFilters = Object.entries(filters).filter(([_, value]) => {
    if (value === null || value === undefined || value === '' || value === 'all') return false
    return true
  })

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className={className}
      >
        <Printer className="mr-2 h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Imprimir</span>
      </Button>

      {/* Vista de impresión - solo visible cuando isPrinting es true */}
      {isPrinting && (
        <div className="print-view">
          <style jsx global>{`
            @media print {
              /* Ocultar todo excepto el contenido de impresión */
              body * {
                visibility: hidden;
              }

              .print-view,
              .print-view * {
                visibility: visible;
              }

              .print-view {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
              }

              /* Configuración de página */
              @page {
                size: A4 landscape;
                margin: 1cm;
              }

              /* Estilos de la tabla */
              .print-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9pt;
              }

              .print-table th {
                background-color: #f3f4f6 !important;
                border: 1px solid #d1d5db;
                padding: 4px 6px;
                text-align: left;
                font-weight: 600;
                font-size: 8pt;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .print-table td {
                border: 1px solid #e5e7eb;
                padding: 4px 6px;
                font-size: 8pt;
              }

              .print-table tr:nth-child(even) {
                background-color: #f9fafb !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              /* Evitar saltos de página dentro de filas */
              .print-table tr {
                page-break-inside: avoid;
              }

              /* Header y footer */
              .print-header {
                margin-bottom: 16px;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
              }

              .print-footer {
                margin-top: 16px;
                padding-top: 8px;
                border-top: 1px solid #d1d5db;
                font-size: 8pt;
              }
            }

            @media screen {
              .print-view {
                display: none;
              }
            }
          `}</style>

          <div className="print-container p-8">
            {/* HEADER */}
            <div className="print-header">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Generado el {new Date().toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Sistema ERP Omerix</p>
                  <p className="text-sm text-gray-600">Gestión Comercial</p>
                </div>
              </div>

              {/* Filtros aplicados */}
              {activeFilters.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-semibold mb-1">Filtros aplicados:</p>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map(([key, value]) => (
                      <span key={key} className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ESTADÍSTICAS */}
            {stats.length > 0 && (
              <div className="mb-4 grid grid-cols-6 gap-2">
                {stats.map((stat, idx) => (
                  <div key={idx} className="border border-gray-300 p-2 rounded">
                    <p className="text-xs text-gray-600">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TABLA */}
            <table className="print-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : formatValue(row[col.key], col.key)
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* FOOTER */}
            <div className="print-footer">
              <div className="flex justify-between text-gray-600">
                <div>
                  <p>Total de registros: {data.length}</p>
                </div>
                <div className="text-right">
                  <p>Página generada automáticamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}