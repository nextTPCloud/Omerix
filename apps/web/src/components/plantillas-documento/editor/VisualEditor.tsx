'use client'

import React, { useCallback, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { EditorProvider, useEditor } from './EditorContext'
import { EditorToolbar } from './EditorToolbar'
import { EditorCanvas } from './EditorCanvas'
import { EditorProperties } from './EditorProperties'
import { BlockType, EditorLayout, BLOCK_DEFAULTS, BLOCK_METADATA, EditorBlock } from './types'
import { PlantillaDocumento, UpdatePlantillaDTO } from '@/types/plantilla-documento.types'
import { plantillasDocumentoService } from '@/services/plantillas-documento.service'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlantillaPreview } from '../PlantillaPreview'
import {
  Image,
  Building2,
  Type,
  FileText,
  User,
  Table,
  Calculator,
  CreditCard,
  Landmark,
  ScrollText,
  PenTool,
  AlignLeft,
  Minus,
  Square,
  ImagePlus,
  QrCode,
} from 'lucide-react'

// Mapeo de iconos
const ICON_MAP: Record<string, React.ElementType> = {
  Image,
  Building2,
  Type,
  FileText,
  User,
  Table,
  Calculator,
  CreditCard,
  Landmark,
  ScrollText,
  PenTool,
  AlignLeft,
  Minus,
  Square,
  ImagePlus,
  QrCode,
}

// Componente de overlay durante el drag
function DragOverlayContent({ type }: { type: BlockType }) {
  const metadata = BLOCK_METADATA.find((m) => m.type === type)
  const Icon = metadata ? ICON_MAP[metadata.icon] : Square

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-xl border-2 border-blue-500">
      <Icon className="h-5 w-5 text-blue-500" />
      <span className="font-medium">{metadata?.label || type}</span>
    </div>
  )
}

// Componente interno del editor (con acceso al contexto)
function EditorInner({
  plantilla,
  onSave,
}: {
  plantilla: PlantillaDocumento
  onSave: (data: UpdatePlantillaDTO) => Promise<void>
}) {
  const { state, dispatch, addBlock } = useEditor()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<BlockType | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handlers de drag & drop
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Si viene del toolbar, obtener el tipo
    if (active.data.current?.fromToolbar) {
      setActiveType(active.data.current.type as BlockType)
    } else {
      setActiveType(null)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Opcional: mostrar indicadores de donde se puede soltar
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      setActiveId(null)
      setActiveType(null)

      if (!over) return

      // Si viene del toolbar, crear un nuevo bloque
      if (active.data.current?.fromToolbar) {
        const type = active.data.current.type as BlockType
        const sectionId = over.id as string

        // Verificar que se soltó sobre una sección válida
        if (['header', 'body', 'footer'].includes(sectionId)) {
          addBlock(sectionId, type)
          toast.success(`Bloque "${BLOCK_METADATA.find((m) => m.type === type)?.label}" añadido`)
        }
        return
      }

      // Si es un bloque existente, reordenar
      const activeBlockId = active.id as string
      const overId = over.id as string

      if (activeBlockId !== overId) {
        // Encontrar las secciones
        for (const section of state.layout.sections) {
          const activeIndex = section.blocks.findIndex((b) => b.id === activeBlockId)
          const overIndex = section.blocks.findIndex((b) => b.id === overId)

          if (activeIndex !== -1 && overIndex !== -1) {
            const newBlockIds = arrayMove(
              section.blocks.map((b) => b.id),
              activeIndex,
              overIndex
            )
            dispatch({
              type: 'REORDER_BLOCKS',
              payload: { sectionId: section.id, blockIds: newBlockIds },
            })
            break
          }
        }
      }
    },
    [state.layout.sections, addBlock, dispatch]
  )

  // Convertir layout del editor a formato de plantilla
  const layoutToPlantilla = useCallback((): UpdatePlantillaDTO => {
    // Aquí convertimos la estructura del editor visual al formato de la plantilla
    // Por ahora, mantenemos la estructura original pero actualizamos colores y fuentes
    return {
      colores: {
        primario: state.layout.globalStyles.primaryColor,
        secundario: state.layout.globalStyles.secondaryColor,
        texto: state.layout.globalStyles.textColor,
        fondo: state.layout.globalStyles.backgroundColor,
      },
      fuentes: {
        familia: state.layout.globalStyles.fontFamily,
      },
      // Extraer configuración de los bloques
      cabecera: extractCabeceraConfig(),
      cliente: extractClienteConfig(),
      lineas: extractLineasConfig(),
      totales: extractTotalesConfig(),
      pie: extractPieConfig(),
    }
  }, [state.layout])

  // Helpers para extraer configuración de bloques
  const extractCabeceraConfig = () => {
    const logoBlock = findBlockByType('logo')
    const empresaBlock = findBlockByType('empresa-info')

    return {
      mostrarLogo: logoBlock?.config?.showLogo ?? true,
      anchoLogo: logoBlock?.config?.maxWidth ?? 150,
      mostrarDatosEmpresa: !!empresaBlock,
      mostrarNIF: empresaBlock?.config?.showNIF ?? true,
      mostrarDireccion: empresaBlock?.config?.showDireccion ?? true,
      mostrarContacto: empresaBlock?.config?.showContacto ?? true,
      mostrarWeb: empresaBlock?.config?.showWeb ?? false,
    }
  }

  const extractClienteConfig = () => {
    const clienteBlock = findBlockByType('cliente-info')
    return {
      mostrarTitulo: clienteBlock?.config?.showTitulo ?? true,
      mostrarCodigo: clienteBlock?.config?.showCodigo ?? false,
      mostrarNIF: clienteBlock?.config?.showNIF ?? true,
      mostrarDireccion: clienteBlock?.config?.showDireccion ?? true,
      mostrarContacto: clienteBlock?.config?.showContacto ?? true,
    }
  }

  const extractLineasConfig = () => {
    const tablaBlock = findBlockByType('tabla-lineas')
    const columnas = tablaBlock?.config?.columnas || []
    return {
      mostrarReferencia: columnas.includes('referencia'),
      mostrarDescripcion: columnas.includes('descripcion'),
      mostrarCantidad: columnas.includes('cantidad'),
      mostrarUnidad: columnas.includes('unidad'),
      mostrarPrecioUnitario: columnas.includes('precio'),
      mostrarDescuento: columnas.includes('descuento'),
      mostrarIVA: columnas.includes('iva'),
      mostrarSubtotal: columnas.includes('subtotal'),
      filasZebra: tablaBlock?.config?.filasZebra ?? true,
    }
  }

  const extractTotalesConfig = () => {
    const totalesBlock = findBlockByType('totales')
    return {
      mostrarSubtotal: totalesBlock?.config?.showSubtotal ?? true,
      mostrarDescuentoGlobal: totalesBlock?.config?.showDescuento ?? true,
      mostrarBaseImponible: totalesBlock?.config?.showBaseImponible ?? true,
      mostrarDetalleIVA: totalesBlock?.config?.showIVA ?? true,
      mostrarTotal: totalesBlock?.config?.showTotal ?? true,
      resaltarTotal: totalesBlock?.config?.resaltarTotal ?? true,
    }
  }

  const extractPieConfig = () => {
    const formaPagoBlock = findBlockByType('forma-pago')
    const datosBancariosBlock = findBlockByType('datos-bancarios')
    const firmaBlock = findBlockByType('firma')
    const condicionesBlock = findBlockByType('condiciones')

    return {
      mostrarFormaPago: !!formaPagoBlock,
      mostrarVencimientos: formaPagoBlock?.config?.showVencimientos ?? true,
      mostrarDatosBancarios: !!datosBancariosBlock,
      mostrarFirma: !!firmaBlock,
      mostrarCondiciones: !!condicionesBlock,
    }
  }

  const findBlockByType = (type: BlockType): EditorBlock | undefined => {
    for (const section of state.layout.sections) {
      const block = section.blocks.find((b) => b.type === type)
      if (block) return block
    }
    return undefined
  }

  // Guardar cambios
  const handleSave = async () => {
    try {
      setIsSaving(true)
      const data = layoutToPlantilla()
      await onSave(data)
      dispatch({ type: 'MARK_SAVED' })
      toast.success('Plantilla guardada correctamente')
    } catch (error) {
      toast.error('Error al guardar la plantilla')
    } finally {
      setIsSaving(false)
    }
  }

  // Vista previa
  const handlePreview = () => {
    setShowPreview(true)
  }

  // Obtener plantilla actualizada para preview
  const getUpdatedPlantilla = (): PlantillaDocumento => {
    const updates = layoutToPlantilla()
    return {
      ...plantilla,
      ...updates,
      colores: { ...plantilla.colores, ...updates.colores },
      fuentes: { ...plantilla.fuentes, ...updates.fuentes },
      cabecera: { ...plantilla.cabecera, ...updates.cabecera },
      cliente: { ...plantilla.cliente, ...updates.cliente },
      lineas: { ...plantilla.lineas, ...updates.lineas },
      totales: { ...plantilla.totales, ...updates.totales },
      pie: { ...plantilla.pie, ...updates.pie },
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full">
          {/* Toolbar izquierdo */}
          <EditorToolbar
            onSave={handleSave}
            onPreview={handlePreview}
            isSaving={isSaving}
          />

          {/* Canvas central */}
          <EditorCanvas />

          {/* Panel de propiedades derecho */}
          <EditorProperties />
        </div>

        {/* Overlay durante el drag */}
        <DragOverlay>
          {activeType && <DragOverlayContent type={activeType} />}
        </DragOverlay>
      </DndContext>

      {/* Modal de vista previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
            <DialogDescription>
              Así se verá el documento con la configuración actual
            </DialogDescription>
          </DialogHeader>
          <PlantillaPreview plantilla={getUpdatedPlantilla()} scale={0.6} />
        </DialogContent>
      </Dialog>
    </>
  )
}

// Componente principal del editor visual
interface VisualEditorProps {
  plantilla: PlantillaDocumento
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function VisualEditor({ plantilla, open, onOpenChange, onSave }: VisualEditorProps) {
  // Convertir plantilla a layout del editor
  const plantillaToLayout = (p: PlantillaDocumento): EditorLayout => {
    const blocks: { sectionId: string; block: EditorBlock }[] = []

    // Crear bloques de cabecera
    if (p.cabecera?.mostrarLogo) {
      blocks.push({
        sectionId: 'header',
        block: {
          id: 'block-logo',
          type: 'logo',
          position: { x: 0, y: 0, width: 25, height: 'auto' },
          style: {},
          config: { showLogo: true, maxWidth: p.cabecera.anchoLogo || 150 },
        },
      })
    }

    if (p.cabecera?.mostrarDatosEmpresa) {
      blocks.push({
        sectionId: 'header',
        block: {
          id: 'block-empresa',
          type: 'empresa-info',
          position: { x: 0, y: 0, width: 40, height: 'auto' },
          style: {},
          config: {
            showNIF: p.cabecera.mostrarNIF,
            showDireccion: p.cabecera.mostrarDireccion,
            showContacto: p.cabecera.mostrarContacto,
            showWeb: p.cabecera.mostrarWeb,
          },
        },
      })
    }

    // Título y datos del documento
    blocks.push({
      sectionId: 'header',
      block: {
        id: 'block-titulo',
        type: 'documento-titulo',
        position: { x: 60, y: 0, width: 40, height: 'auto' },
        style: { textAlign: 'right' },
        config: { titulo: p.textos?.tituloDocumento || 'FACTURA' },
      },
    })

    blocks.push({
      sectionId: 'header',
      block: {
        id: 'block-doc-info',
        type: 'documento-info',
        position: { x: 60, y: 0, width: 40, height: 'auto' },
        style: { textAlign: 'right' },
        config: { showNumero: true, showFecha: true, showVencimiento: true },
      },
    })

    // Cliente
    blocks.push({
      sectionId: 'header',
      block: {
        id: 'block-cliente',
        type: 'cliente-info',
        position: { x: p.cliente?.posicion === 'derecha' ? 55 : 0, y: 0, width: 45, height: 'auto' },
        style: {},
        config: {
          showTitulo: p.cliente?.mostrarTitulo,
          showCodigo: p.cliente?.mostrarCodigo,
          showNIF: p.cliente?.mostrarNIF,
          showDireccion: p.cliente?.mostrarDireccion,
          showContacto: p.cliente?.mostrarContacto,
        },
      },
    })

    // Tabla de líneas
    const columnas: string[] = []
    if (p.lineas?.mostrarReferencia) columnas.push('referencia')
    if (p.lineas?.mostrarDescripcion) columnas.push('descripcion')
    if (p.lineas?.mostrarCantidad) columnas.push('cantidad')
    if (p.lineas?.mostrarUnidad) columnas.push('unidad')
    if (p.lineas?.mostrarPrecioUnitario) columnas.push('precio')
    if (p.lineas?.mostrarDescuento) columnas.push('descuento')
    if (p.lineas?.mostrarIVA) columnas.push('iva')
    if (p.lineas?.mostrarSubtotal) columnas.push('subtotal')

    blocks.push({
      sectionId: 'body',
      block: {
        id: 'block-tabla',
        type: 'tabla-lineas',
        position: { x: 0, y: 0, width: 100, height: 'auto' },
        style: {},
        config: { columnas, filasZebra: p.lineas?.filasZebra },
      },
    })

    // Totales
    blocks.push({
      sectionId: 'body',
      block: {
        id: 'block-totales',
        type: 'totales',
        position: { x: 60, y: 0, width: 40, height: 'auto' },
        style: { textAlign: 'right' },
        config: {
          showSubtotal: p.totales?.mostrarSubtotal,
          showDescuento: p.totales?.mostrarDescuentoGlobal,
          showBaseImponible: p.totales?.mostrarBaseImponible,
          showIVA: p.totales?.mostrarDetalleIVA,
          showTotal: p.totales?.mostrarTotal,
          resaltarTotal: p.totales?.resaltarTotal,
        },
      },
    })

    // Pie
    if (p.pie?.mostrarFormaPago) {
      blocks.push({
        sectionId: 'footer',
        block: {
          id: 'block-forma-pago',
          type: 'forma-pago',
          position: { x: 0, y: 0, width: 50, height: 'auto' },
          style: {},
          config: { showFormaPago: true, showVencimientos: p.pie.mostrarVencimientos },
        },
      })
    }

    if (p.pie?.mostrarDatosBancarios) {
      blocks.push({
        sectionId: 'footer',
        block: {
          id: 'block-datos-bancarios',
          type: 'datos-bancarios',
          position: { x: 50, y: 0, width: 50, height: 'auto' },
          style: {},
          config: { showCuentaBancaria: true, showIBAN: true },
        },
      })
    }

    if (p.pie?.mostrarCondiciones) {
      blocks.push({
        sectionId: 'footer',
        block: {
          id: 'block-condiciones',
          type: 'condiciones',
          position: { x: 0, y: 0, width: 100, height: 'auto' },
          style: {},
          config: { texto: p.textos?.condicionesPago || '' },
        },
      })
    }

    if (p.pie?.mostrarFirma) {
      blocks.push({
        sectionId: 'footer',
        block: {
          id: 'block-firma',
          type: 'firma',
          position: { x: 70, y: 0, width: 30, height: 40 },
          style: {},
          config: { showLinea: true, textoDebajo: 'Firma y sello' },
        },
      })
    }

    // Construir layout
    return {
      sections: [
        {
          id: 'header',
          name: 'Cabecera',
          blocks: blocks.filter((b) => b.sectionId === 'header').map((b) => b.block),
          height: 'auto',
        },
        {
          id: 'body',
          name: 'Cuerpo',
          blocks: blocks.filter((b) => b.sectionId === 'body').map((b) => b.block),
          height: 'auto',
        },
        {
          id: 'footer',
          name: 'Pie',
          blocks: blocks.filter((b) => b.sectionId === 'footer').map((b) => b.block),
          height: 'auto',
        },
      ],
      globalStyles: {
        fontFamily: p.fuentes?.familia || 'Helvetica, Arial, sans-serif',
        primaryColor: p.colores?.primario || '#3b82f6',
        secondaryColor: p.colores?.secundario || '#64748b',
        textColor: p.colores?.texto || '#1e293b',
        backgroundColor: p.colores?.fondo || '#ffffff',
      },
    }
  }

  const initialLayout = plantillaToLayout(plantilla)

  // Guardar cambios
  const handleSave = async (data: UpdatePlantillaDTO) => {
    await plantillasDocumentoService.update(plantilla._id, data)
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1600px] max-h-[95vh] h-[90vh] p-0 overflow-hidden">
        <EditorProvider initialLayout={initialLayout}>
          <EditorInner plantilla={plantilla} onSave={handleSave} />
        </EditorProvider>
      </DialogContent>
    </Dialog>
  )
}
