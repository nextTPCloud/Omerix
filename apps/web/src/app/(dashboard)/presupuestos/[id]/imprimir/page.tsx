'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { presupuestosService } from '@/services/presupuestos.service'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import { IPresupuesto } from '@/types/presupuesto.types'
import { PresupuestoPrintView, PrintOptions, defaultPrintOptions } from '@/components/presupuestos/PresupuestoPrintView'
import { Loader2, Printer, X, ZoomIn, ZoomOut } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PresupuestoImprimirPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()

  const [presupuesto, setPresupuesto] = useState<IPresupuesto | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(100)

  // Obtener opciones de impresión de los query params
  const printOptions: PrintOptions = {
    mostrarDescripcion: (searchParams.get('desc') as PrintOptions['mostrarDescripcion']) || defaultPrintOptions.mostrarDescripcion,
    mostrarReferencias: searchParams.get('ref') !== 'false',
    mostrarCondiciones: searchParams.get('cond') !== 'false',
    mostrarFirmas: searchParams.get('firmas') !== 'false',
    mostrarLOPD: searchParams.get('lopd') !== 'false',
    mostrarRegistroMercantil: searchParams.get('reg') !== 'false',
    mostrarCuentaBancaria: searchParams.get('banco') !== 'false',
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [presupuestoRes, empresaRes] = await Promise.all([
          presupuestosService.getById(resolvedParams.id),
          empresaService.getMiEmpresa(),
        ])

        if (presupuestoRes.success && presupuestoRes.data) {
          setPresupuesto(presupuestoRes.data)
        }
        if (empresaRes.success && empresaRes.data) {
          setEmpresa(empresaRes.data)
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [resolvedParams.id])

  const handlePrint = () => {
    window.print()
  }

  const handleClose = () => {
    window.close()
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-medium">Presupuesto no encontrado</p>
          <button
            onClick={handleClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de herramientas - no se imprime */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-800 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              Presupuesto {presupuesto.codigo}
            </span>
            <span className="text-gray-300 text-sm">
              Usa Ctrl + rueda del ratón para zoom
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Controles de zoom */}
            <div className="flex items-center gap-1 mr-4 bg-gray-700 rounded px-2 py-1">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-600 rounded"
                title="Reducir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-600 rounded"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de impresión */}
      <div
        className="py-8 print:py-0"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="bg-white shadow-lg print:shadow-none max-w-[210mm] mx-auto">
          <PresupuestoPrintView
            presupuesto={presupuesto}
            empresa={empresa || undefined}
            options={printOptions}
          />
        </div>
      </div>

      {/* Estilos de impresión */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
