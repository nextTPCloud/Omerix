'use client'

import React from 'react'
import { useEditor } from './EditorContext'
import { EditorBlock, BLOCK_METADATA } from './types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Settings,
  Palette,
  Move,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from 'lucide-react'

// Componente para selección de color
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
        style={{ backgroundColor: value }}
        onClick={() => document.getElementById(`color-${label}`)?.click()}
      />
      <input
        id={`color-${label}`}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
    </div>
  )
}

// Componente para toggle con label
function ToggleField({
  label,
  checked,
  onChange,
  description,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

// Panel de propiedades para el bloque seleccionado
function BlockProperties({ block }: { block: EditorBlock }) {
  const { updateBlock, removeBlock } = useEditor()
  const metadata = BLOCK_METADATA.find((m) => m.type === block.type)

  const updateConfig = (key: string, value: any) => {
    updateBlock(block.id, { config: { ...block.config, [key]: value } })
  }

  const updateStyle = (key: string, value: any) => {
    updateBlock(block.id, { style: { ...block.style, [key]: value } })
  }

  const updatePosition = (key: string, value: any) => {
    updateBlock(block.id, { position: { ...block.position, [key]: value } })
  }

  return (
    <Tabs defaultValue="config" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="config" className="text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Config
        </TabsTrigger>
        <TabsTrigger value="style" className="text-xs">
          <Palette className="h-3 w-3 mr-1" />
          Estilo
        </TabsTrigger>
        <TabsTrigger value="position" className="text-xs">
          <Move className="h-3 w-3 mr-1" />
          Posición
        </TabsTrigger>
      </TabsList>

      {/* Tab de Configuración */}
      <TabsContent value="config" className="mt-4 space-y-4">
        <div className="text-sm font-medium">{metadata?.label}</div>
        <p className="text-xs text-muted-foreground">{metadata?.description}</p>

        <Separator />

        {/* Configuración específica por tipo de bloque */}
        {block.type === 'logo' && (
          <div className="space-y-4">
            <ToggleField
              label="Mostrar Logo"
              checked={block.config?.showLogo ?? true}
              onChange={(v) => updateConfig('showLogo', v)}
            />
            <div>
              <Label className="text-xs">Ancho máximo (px)</Label>
              <Slider
                value={[block.config?.maxWidth || 150]}
                min={50}
                max={300}
                step={10}
                onValueChange={([v]) => updateConfig('maxWidth', v)}
              />
              <span className="text-xs text-muted-foreground">{block.config?.maxWidth || 150}px</span>
            </div>
          </div>
        )}

        {block.type === 'empresa-info' && (
          <div className="space-y-2">
            <ToggleField
              label="Mostrar NIF"
              checked={block.config?.showNIF ?? true}
              onChange={(v) => updateConfig('showNIF', v)}
            />
            <ToggleField
              label="Mostrar Dirección"
              checked={block.config?.showDireccion ?? true}
              onChange={(v) => updateConfig('showDireccion', v)}
            />
            <ToggleField
              label="Mostrar Contacto"
              checked={block.config?.showContacto ?? true}
              onChange={(v) => updateConfig('showContacto', v)}
            />
            <ToggleField
              label="Mostrar Web"
              checked={block.config?.showWeb ?? false}
              onChange={(v) => updateConfig('showWeb', v)}
            />
          </div>
        )}

        {block.type === 'documento-titulo' && (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.config?.titulo || 'FACTURA'}
                onChange={(e) => updateConfig('titulo', e.target.value)}
              />
            </div>
          </div>
        )}

        {block.type === 'documento-info' && (
          <div className="space-y-2">
            <ToggleField
              label="Mostrar Número"
              checked={block.config?.showNumero ?? true}
              onChange={(v) => updateConfig('showNumero', v)}
            />
            <ToggleField
              label="Mostrar Fecha"
              checked={block.config?.showFecha ?? true}
              onChange={(v) => updateConfig('showFecha', v)}
            />
            <ToggleField
              label="Mostrar Vencimiento"
              checked={block.config?.showVencimiento ?? true}
              onChange={(v) => updateConfig('showVencimiento', v)}
            />
          </div>
        )}

        {block.type === 'cliente-info' && (
          <div className="space-y-2">
            <ToggleField
              label="Mostrar Título"
              checked={block.config?.showTitulo ?? true}
              onChange={(v) => updateConfig('showTitulo', v)}
            />
            <ToggleField
              label="Mostrar Código"
              checked={block.config?.showCodigo ?? false}
              onChange={(v) => updateConfig('showCodigo', v)}
            />
            <ToggleField
              label="Mostrar NIF"
              checked={block.config?.showNIF ?? true}
              onChange={(v) => updateConfig('showNIF', v)}
            />
            <ToggleField
              label="Mostrar Dirección"
              checked={block.config?.showDireccion ?? true}
              onChange={(v) => updateConfig('showDireccion', v)}
            />
            <ToggleField
              label="Mostrar Contacto"
              checked={block.config?.showContacto ?? true}
              onChange={(v) => updateConfig('showContacto', v)}
            />
          </div>
        )}

        {block.type === 'tabla-lineas' && (
          <div className="space-y-4">
            <Label>Columnas visibles</Label>
            <div className="space-y-2">
              {['referencia', 'descripcion', 'cantidad', 'unidad', 'precio', 'descuento', 'iva', 'subtotal'].map((col) => (
                <ToggleField
                  key={col}
                  label={col.charAt(0).toUpperCase() + col.slice(1)}
                  checked={block.config?.columnas?.includes(col) ?? true}
                  onChange={(v) => {
                    const cols = block.config?.columnas || []
                    updateConfig('columnas', v ? [...cols, col] : cols.filter((c: string) => c !== col))
                  }}
                />
              ))}
            </div>
            <Separator />
            <ToggleField
              label="Filas Zebra"
              checked={block.config?.filasZebra ?? true}
              onChange={(v) => updateConfig('filasZebra', v)}
              description="Alternar colores de fondo"
            />
          </div>
        )}

        {block.type === 'totales' && (
          <div className="space-y-2">
            <ToggleField
              label="Subtotal"
              checked={block.config?.showSubtotal ?? true}
              onChange={(v) => updateConfig('showSubtotal', v)}
            />
            <ToggleField
              label="Descuento"
              checked={block.config?.showDescuento ?? true}
              onChange={(v) => updateConfig('showDescuento', v)}
            />
            <ToggleField
              label="Base Imponible"
              checked={block.config?.showBaseImponible ?? true}
              onChange={(v) => updateConfig('showBaseImponible', v)}
            />
            <ToggleField
              label="IVA"
              checked={block.config?.showIVA ?? true}
              onChange={(v) => updateConfig('showIVA', v)}
            />
            <ToggleField
              label="Total"
              checked={block.config?.showTotal ?? true}
              onChange={(v) => updateConfig('showTotal', v)}
            />
            <Separator />
            <ToggleField
              label="Resaltar Total"
              checked={block.config?.resaltarTotal ?? true}
              onChange={(v) => updateConfig('resaltarTotal', v)}
              description="Destacar con color de fondo"
            />
          </div>
        )}

        {block.type === 'forma-pago' && (
          <div className="space-y-2">
            <ToggleField
              label="Mostrar Forma de Pago"
              checked={block.config?.showFormaPago ?? true}
              onChange={(v) => updateConfig('showFormaPago', v)}
            />
            <ToggleField
              label="Mostrar Vencimientos"
              checked={block.config?.showVencimientos ?? true}
              onChange={(v) => updateConfig('showVencimientos', v)}
            />
          </div>
        )}

        {block.type === 'datos-bancarios' && (
          <div className="space-y-2">
            <ToggleField
              label="Mostrar Cuenta"
              checked={block.config?.showCuentaBancaria ?? true}
              onChange={(v) => updateConfig('showCuentaBancaria', v)}
            />
            <ToggleField
              label="Mostrar IBAN"
              checked={block.config?.showIBAN ?? true}
              onChange={(v) => updateConfig('showIBAN', v)}
            />
          </div>
        )}

        {block.type === 'condiciones' && (
          <div className="space-y-4">
            <div>
              <Label>Texto de condiciones</Label>
              <Textarea
                value={block.config?.texto || ''}
                onChange={(e) => updateConfig('texto', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        {block.type === 'firma' && (
          <div className="space-y-4">
            <ToggleField
              label="Mostrar línea"
              checked={block.config?.showLinea ?? true}
              onChange={(v) => updateConfig('showLinea', v)}
            />
            <div>
              <Label>Texto debajo</Label>
              <Input
                value={block.config?.textoDebajo || 'Firma y sello'}
                onChange={(e) => updateConfig('textoDebajo', e.target.value)}
              />
            </div>
          </div>
        )}

        {block.type === 'texto-libre' && (
          <div className="space-y-4">
            <div>
              <Label>Texto</Label>
              <Textarea
                value={block.config?.texto || ''}
                onChange={(e) => updateConfig('texto', e.target.value)}
                rows={4}
              />
            </div>
            <ToggleField
              label="HTML"
              checked={block.config?.html ?? false}
              onChange={(v) => updateConfig('html', v)}
              description="Permitir formato HTML"
            />
          </div>
        )}

        {block.type === 'espacio' && (
          <div className="space-y-4">
            <div>
              <Label>Altura (mm)</Label>
              <Slider
                value={[typeof block.position.height === 'number' ? block.position.height : 10]}
                min={5}
                max={50}
                step={5}
                onValueChange={([v]) => updatePosition('height', v)}
              />
              <span className="text-xs text-muted-foreground">
                {typeof block.position.height === 'number' ? block.position.height : 10}mm
              </span>
            </div>
          </div>
        )}

        {block.type === 'qr-code' && (
          <div className="space-y-4">
            <div>
              <Label>Contenido</Label>
              <Select
                value={block.config?.contenido || 'url'}
                onValueChange={(v) => updateConfig('contenido', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL del documento</SelectItem>
                  <SelectItem value="facturae">Datos FacturaE</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamaño (px)</Label>
              <Slider
                value={[block.config?.tamaño || 60]}
                min={40}
                max={120}
                step={10}
                onValueChange={([v]) => updateConfig('tamaño', v)}
              />
              <span className="text-xs text-muted-foreground">{block.config?.tamaño || 60}px</span>
            </div>
          </div>
        )}
      </TabsContent>

      {/* Tab de Estilo */}
      <TabsContent value="style" className="mt-4 space-y-4">
        <div>
          <Label className="text-xs">Alineación de texto</Label>
          <div className="flex gap-1 mt-2">
            {[
              { value: 'left', icon: AlignLeft },
              { value: 'center', icon: AlignCenter },
              { value: 'right', icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <Button
                key={value}
                variant={block.style?.textAlign === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStyle('textAlign', value)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Tamaño de fuente</Label>
          <Slider
            value={[block.style?.fontSize || 10]}
            min={8}
            max={32}
            step={1}
            onValueChange={([v]) => updateStyle('fontSize', v)}
          />
          <span className="text-xs text-muted-foreground">{block.style?.fontSize || 10}pt</span>
        </div>

        <div>
          <Label className="text-xs">Peso de fuente</Label>
          <Select
            value={block.style?.fontWeight || 'normal'}
            onValueChange={(v) => updateStyle('fontWeight', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Negrita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <ColorInput
          label="Color de texto"
          value={block.style?.color || '#1e293b'}
          onChange={(v) => updateStyle('color', v)}
        />

        <ColorInput
          label="Color de fondo"
          value={block.style?.backgroundColor || 'transparent'}
          onChange={(v) => updateStyle('backgroundColor', v)}
        />

        <ColorInput
          label="Color de borde"
          value={block.style?.borderColor || '#e2e8f0'}
          onChange={(v) => updateStyle('borderColor', v)}
        />

        <div>
          <Label className="text-xs">Grosor de borde</Label>
          <Slider
            value={[block.style?.borderWidth || 0]}
            min={0}
            max={5}
            step={1}
            onValueChange={([v]) => updateStyle('borderWidth', v)}
          />
          <span className="text-xs text-muted-foreground">{block.style?.borderWidth || 0}px</span>
        </div>

        <div>
          <Label className="text-xs">Radio de borde</Label>
          <Slider
            value={[block.style?.borderRadius || 0]}
            min={0}
            max={20}
            step={2}
            onValueChange={([v]) => updateStyle('borderRadius', v)}
          />
          <span className="text-xs text-muted-foreground">{block.style?.borderRadius || 0}px</span>
        </div>

        <div>
          <Label className="text-xs">Padding interno</Label>
          <Slider
            value={[block.style?.padding || 0]}
            min={0}
            max={30}
            step={2}
            onValueChange={([v]) => updateStyle('padding', v)}
          />
          <span className="text-xs text-muted-foreground">{block.style?.padding || 0}px</span>
        </div>
      </TabsContent>

      {/* Tab de Posición */}
      <TabsContent value="position" className="mt-4 space-y-4">
        <div>
          <Label className="text-xs">Posición X (%)</Label>
          <Slider
            value={[block.position.x]}
            min={0}
            max={75}
            step={5}
            onValueChange={([v]) => updatePosition('x', v)}
          />
          <span className="text-xs text-muted-foreground">{block.position.x}%</span>
        </div>

        <div>
          <Label className="text-xs">Ancho (%)</Label>
          <Slider
            value={[block.position.width]}
            min={25}
            max={100}
            step={5}
            onValueChange={([v]) => updatePosition('width', v)}
          />
          <span className="text-xs text-muted-foreground">{block.position.width}%</span>
        </div>

        <Separator />

        <ToggleField
          label="Bloquear posición"
          checked={block.locked ?? false}
          onChange={(v) => updateBlock(block.id, { locked: v })}
          description="Impide mover o redimensionar"
        />

        <ToggleField
          label="Visible"
          checked={block.visible !== false}
          onChange={(v) => updateBlock(block.id, { visible: v })}
          description="Mostrar en el documento"
        />
      </TabsContent>
    </Tabs>
  )
}

// Panel de estilos globales
function GlobalStylesPanel() {
  const { state, dispatch } = useEditor()
  const { globalStyles } = state.layout

  const updateGlobal = (key: string, value: string) => {
    dispatch({ type: 'UPDATE_GLOBAL_STYLES', payload: { [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Estilos Globales</div>
      <p className="text-xs text-muted-foreground">
        Estos estilos se aplican a todo el documento
      </p>

      <Separator />

      <div>
        <Label className="text-xs">Familia de fuentes</Label>
        <Select
          value={globalStyles.fontFamily}
          onValueChange={(v) => updateGlobal('fontFamily', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Helvetica, Arial, sans-serif">Helvetica</SelectItem>
            <SelectItem value="Inter, Helvetica, Arial, sans-serif">Inter</SelectItem>
            <SelectItem value="Georgia, Times New Roman, serif">Georgia</SelectItem>
            <SelectItem value="Roboto, Helvetica, Arial, sans-serif">Roboto</SelectItem>
            <SelectItem value="Poppins, Helvetica, Arial, sans-serif">Poppins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <ColorInput
        label="Color Primario"
        value={globalStyles.primaryColor}
        onChange={(v) => updateGlobal('primaryColor', v)}
      />

      <ColorInput
        label="Color Secundario"
        value={globalStyles.secondaryColor}
        onChange={(v) => updateGlobal('secondaryColor', v)}
      />

      <ColorInput
        label="Color de Texto"
        value={globalStyles.textColor}
        onChange={(v) => updateGlobal('textColor', v)}
      />

      <ColorInput
        label="Color de Fondo"
        value={globalStyles.backgroundColor}
        onChange={(v) => updateGlobal('backgroundColor', v)}
      />
    </div>
  )
}

// Componente principal del panel de propiedades
export function EditorProperties() {
  const { getSelectedBlock, removeBlock } = useEditor()
  const selectedBlock = getSelectedBlock()

  return (
    <div className="w-72 bg-white border-l flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Propiedades</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {selectedBlock ? (
            <>
              <BlockProperties block={selectedBlock} />

              <Separator className="my-4" />

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => removeBlock(selectedBlock.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Bloque
              </Button>
            </>
          ) : (
            <GlobalStylesPanel />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
