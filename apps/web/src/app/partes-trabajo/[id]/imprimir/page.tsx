'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import { ParteTrabajoView, PrintOptions, defaultPrintOptions } from '@/components/partes-trabajo/ParteTrabajoView'
import { Loader2, Printer, X, ZoomIn, ZoomOut, Settings2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ParteTrabajoImprimirPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()

  const [parte, setParte] = useState<any | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [showOptions, setShowOptions] = useState(false)

  // Obtener opciones de impresión de los query params
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    mostrarPersonal: searchParams.get('personal') !== 'false',
    mostrarMaterial: searchParams.get('material') !== 'false',
    mostrarMaquinaria: searchParams.get('maquinaria') !== 'false',
    mostrarTransporte: searchParams.get('transporte') !== 'false',
    mostrarGastos: searchParams.get('gastos') !== 'false',
    mostrarPrecios: searchParams.get('precios') !== 'false',
    mostrarCostes: searchParams.get('costes') === 'true',
    mostrarFirmas: searchParams.get('firmas') !== 'false',
    mostrarLOPD: searchParams.get('lopd') !== 'false',
    mostrarConformidad: searchParams.get('conformidad') !== 'false',
    mostrarRegistroMercantil: searchParams.get('reg') !== 'false',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [parteRes, empresaRes] = await Promise.all([
          partesTrabajoService.getById(resolvedParams.id),
          empresaService.getMiEmpresa(),
        ])

        if (parteRes.success && parteRes.data) {
          setParte(parteRes.data)
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

  const toggleOption = (key: keyof PrintOptions) => {
    setPrintOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
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

  if (!parte) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-medium">Parte de trabajo no encontrado</p>
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
              Parte de Trabajo {parte.codigo}
            </span>
            <span className="text-gray-300 text-sm">
              Usa Ctrl + rueda del ratón para zoom
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Controles de zoom */}
            <div className="flex items-center gap-1 mr-2 bg-gray-700 rounded px-2 py-1">
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

            {/* Botón de opciones */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-2 px-3 py-2 rounded font-medium transition-colors ${
                showOptions ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              Opciones
            </button>

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

        {/* Panel de opciones */}
        {showOptions && (
          <div className="bg-gray-700 border-t border-gray-600">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarPersonal}
                    onChange={() => toggleOption('mostrarPersonal')}
                    className="rounded"
                  />
                  Mostrar Personal
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarMaterial}
                    onChange={() => toggleOption('mostrarMaterial')}
                    className="rounded"
                  />
                  Mostrar Materiales
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarMaquinaria}
                    onChange={() => toggleOption('mostrarMaquinaria')}
                    className="rounded"
                  />
                  Mostrar Maquinaria
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarTransporte}
                    onChange={() => toggleOption('mostrarTransporte')}
                    className="rounded"
                  />
                  Mostrar Transporte
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarGastos}
                    onChange={() => toggleOption('mostrarGastos')}
                    className="rounded"
                  />
                  Mostrar Gastos
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarPrecios}
                    onChange={() => toggleOption('mostrarPrecios')}
                    className="rounded"
                  />
                  Mostrar Precios
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarFirmas}
                    onChange={() => toggleOption('mostrarFirmas')}
                    className="rounded"
                  />
                  Mostrar Firmas
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarLOPD}
                    onChange={() => toggleOption('mostrarLOPD')}
                    className="rounded"
                  />
                  Mostrar LOPD
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarConformidad}
                    onChange={() => toggleOption('mostrarConformidad')}
                    className="rounded"
                  />
                  Texto Conformidad
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.mostrarRegistroMercantil}
                    onChange={() => toggleOption('mostrarRegistroMercantil')}
                    className="rounded"
                  />
                  Registro Mercantil
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido del documento */}
      <div
        className="py-8 print:py-0"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        <ParteTrabajoView
          parte={parte}
          empresa={empresa || undefined}
          options={printOptions}
        />
      </div>

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

          .print\\:hidden {
            display: none !important;
          }

          .print-view {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
