import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect, MultiSearchableSelect } from '@/components/ui/searchable-select'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  ChefHat,
  AlertTriangle,
  Clock,
  Utensils,
  Settings2,
  Plus,
  Trash2,
  Info,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { impresorasService, Impresora } from '@/services/impresoras.service'
import { zonasPreparacionService, ZonaPreparacion } from '@/services/zonas-preparacion.service'
import { gruposModificadoresService, GrupoModificadores } from '@/services/modificadores.service'
import { alergenosService, Alergeno, ALERGENOS_UE } from '@/services/alergenos.service'

interface TabRestauracionProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabRestauracion({ formData, setFormData, isEditing }: TabRestauracionProps) {
  // Estados para datos de referencia
  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [zonasPreparacion, setZonasPreparacion] = useState<ZonaPreparacion[]>([])
  const [gruposModificadores, setGruposModificadores] = useState<GrupoModificadores[]>([])
  const [alergenos, setAlergenos] = useState<Alergeno[]>([])

  // Estados de carga
  const [loadingImpresoras, setLoadingImpresoras] = useState(true)
  const [loadingZonas, setLoadingZonas] = useState(true)
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [loadingAlergenos, setLoadingAlergenos] = useState(true)

  // Cargar datos al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar impresoras
        setLoadingImpresoras(true)
        const impresorasRes = await impresorasService.getAll({ limit: 100, activo: true })
        setImpresoras(impresorasRes.data || [])
      } catch (error) {
        console.error('Error al cargar impresoras:', error)
      } finally {
        setLoadingImpresoras(false)
      }

      try {
        // Cargar zonas de preparación
        setLoadingZonas(true)
        const zonasRes = await zonasPreparacionService.getAll({ limit: 100, activo: true })
        setZonasPreparacion(zonasRes.data || [])
      } catch (error) {
        console.error('Error al cargar zonas de preparación:', error)
      } finally {
        setLoadingZonas(false)
      }

      try {
        // Cargar grupos de modificadores
        setLoadingGrupos(true)
        const gruposRes = await gruposModificadoresService.getAll({ limit: 100, activo: true, includeModificadores: true })
        setGruposModificadores(gruposRes.data || [])
      } catch (error) {
        console.error('Error al cargar grupos de modificadores:', error)
      } finally {
        setLoadingGrupos(false)
      }

      try {
        // Cargar alérgenos
        setLoadingAlergenos(true)
        const alergenosRes = await alergenosService.getAll({ limit: 100, activo: true })
        setAlergenos(alergenosRes.data || [])
      } catch (error) {
        console.error('Error al cargar alérgenos:', error)
      } finally {
        setLoadingAlergenos(false)
      }
    }

    fetchData()
  }, [])

  // Opciones para los selects
  const impresorasOptions = useMemo(() => {
    return impresoras
      .filter((i) => i.tipo === 'cocina')
      .map((impresora) => ({
        value: impresora._id,
        label: impresora.nombre,
        description: `${impresora.tipo} - ${impresora.tipoConexion}`,
      }))
  }, [impresoras])

  const zonasOptions = useMemo(() => {
    return zonasPreparacion.map((zona) => ({
      value: zona._id,
      label: zona.nombre,
      description: zona.codigo || undefined,
    }))
  }, [zonasPreparacion])

  const gruposOptions = useMemo(() => {
    return gruposModificadores.map((grupo) => ({
      value: grupo._id,
      label: grupo.nombre,
      description: `${grupo.tipo === 'exclusivo' ? 'Exclusivo' : 'Múltiple'} - ${grupo.modificadores?.length || 0} modificadores`,
    }))
  }, [gruposModificadores])

  const alergenosOptions = useMemo(() => {
    return alergenos.map((alergeno) => ({
      value: alergeno._id,
      label: alergeno.nombre,
      description: alergeno.esObligatorioUE ? 'Obligatorio UE' : undefined,
    }))
  }, [alergenos])

  // Funciones de actualización
  const updateRestauracion = (updates: Record<string, any>) => {
    setFormData({
      ...formData,
      restauracion: { ...(formData.restauracion || {}), ...updates },
    })
  }

  // Obtener nombres de alérgenos seleccionados
  const alergenosSeleccionados = useMemo(() => {
    const ids = formData.restauracion?.alergenosIds || []
    return alergenos.filter((a) => ids.includes(a._id))
  }, [formData.restauracion?.alergenosIds, alergenos])

  return (
    <div className="space-y-4">
      {/* Zona de Preparación e Impresora */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Preparación y Cocina</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zona de preparación */}
          <div>
            <Label htmlFor="zonaPreparacionId">Zona de Preparación</Label>
            <SearchableSelect
              options={zonasOptions}
              value={formData.restauracion?.zonaPreparacionId || ''}
              onValueChange={(value) => updateRestauracion({ zonaPreparacionId: value })}
              placeholder="Seleccionar zona"
              searchPlaceholder="Buscar zona..."
              emptyMessage="No hay zonas configuradas"
              disabled={!isEditing}
              loading={loadingZonas}
              allowClear
            />
            <p className="text-xs text-muted-foreground mt-1">
              Zona donde se prepara este producto (cocina caliente, fría, barra, etc.)
            </p>
          </div>

          {/* Impresora de cocina */}
          <div>
            <Label htmlFor="impresoraId">Impresora de Cocina</Label>
            <SearchableSelect
              options={impresorasOptions}
              value={formData.restauracion?.impresoraId || ''}
              onValueChange={(value) => updateRestauracion({ impresoraId: value })}
              placeholder="Seleccionar impresora"
              searchPlaceholder="Buscar impresora..."
              emptyMessage="No hay impresoras de cocina"
              disabled={!isEditing}
              loading={loadingImpresoras}
              allowClear
            />
            <p className="text-xs text-muted-foreground mt-1">
              Impresora donde se enviará la comanda para este producto
            </p>
          </div>
        </div>

        {/* Tiempo de preparación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <Label htmlFor="tiempoPreparacion" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Tiempo Preparación (min)
            </Label>
            <Input
              id="tiempoPreparacion"
              type="number"
              min="0"
              value={formData.restauracion?.tiempoPreparacionMinutos || 0}
              onChange={(e) =>
                updateRestauracion({ tiempoPreparacionMinutos: parseInt(e.target.value) || 0 })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="prioridad">Prioridad de Preparación</Label>
            <Select
              value={formData.restauracion?.prioridadPreparacion || 'normal'}
              onValueChange={(value) => updateRestauracion({ prioridadPreparacion: value })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja - Preparar al final</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta - Preparar primero</SelectItem>
                <SelectItem value="inmediata">Inmediata - Servir enseguida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mostrarEnKds"
                checked={formData.restauracion?.mostrarEnKds ?? true}
                onCheckedChange={(checked) => updateRestauracion({ mostrarEnKds: !!checked })}
                disabled={!isEditing}
              />
              <Label htmlFor="mostrarEnKds" className="cursor-pointer">
                Mostrar en monitor de cocina (KDS)
              </Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Modificadores */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Modificadores / Comentarios</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Selecciona los grupos de modificadores que aplican a este producto (ej: punto de cocción, extras, sin ingredientes...)
        </p>

        <MultiSearchableSelect
          options={gruposOptions}
          values={formData.restauracion?.gruposModificadoresIds || []}
          onValuesChange={(values) => updateRestauracion({ gruposModificadoresIds: values })}
          placeholder="Seleccionar grupos de modificadores..."
          searchPlaceholder="Buscar grupos..."
          emptyMessage="No hay grupos de modificadores configurados"
          disabled={!isEditing}
        />

        {/* Mostrar grupos seleccionados con sus modificadores */}
        {formData.restauracion?.gruposModificadoresIds?.length > 0 && (
          <div className="mt-4 space-y-3">
            {gruposModificadores
              .filter((g) => formData.restauracion?.gruposModificadoresIds?.includes(g._id))
              .map((grupo) => (
                <div key={grupo._id} className="p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{grupo.nombre}</span>
                    <Badge variant="outline" className="text-xs">
                      {grupo.tipo === 'exclusivo' ? 'Elegir uno' : 'Múltiple'}
                    </Badge>
                    {grupo.minSelecciones > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Mín: {grupo.minSelecciones}
                      </Badge>
                    )}
                  </div>
                  {grupo.modificadores && grupo.modificadores.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {grupo.modificadores.map((mod) => (
                        <Badge key={mod._id} variant="outline" className="text-xs font-normal">
                          {mod.nombre}
                          {mod.precioExtra > 0 && ` (+${mod.precioExtra.toFixed(2)}€)`}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin modificadores en este grupo</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Alérgenos */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Alérgenos</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Indica los alérgenos presentes en este producto. Obligatorio según normativa UE 1169/2011.
        </p>

        <MultiSearchableSelect
          options={alergenosOptions}
          values={formData.restauracion?.alergenosIds || []}
          onValuesChange={(values) => updateRestauracion({ alergenosIds: values })}
          placeholder="Seleccionar alérgenos..."
          searchPlaceholder="Buscar alérgenos..."
          emptyMessage="No hay alérgenos configurados"
          disabled={!isEditing}
        />

        {/* Mostrar alérgenos seleccionados con iconos */}
        {alergenosSeleccionados.length > 0 && (
          <div className="mt-4">
            <Label className="text-xs mb-2 block">Alérgenos declarados:</Label>
            <div className="flex flex-wrap gap-2">
              {alergenosSeleccionados.map((alergeno) => (
                <Badge
                  key={alergeno._id}
                  style={{ backgroundColor: alergeno.color, color: '#fff' }}
                  className="text-xs"
                >
                  {alergeno.nombre}
                  {alergeno.esObligatorioUE && ' *'}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">* Alérgenos obligatorios según normativa UE</p>
          </div>
        )}

        {/* Advertencia si no hay alérgenos y es producto de restauración */}
        {formData.restauracion?.zonaPreparacionId && !alergenosSeleccionados.length && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Este producto no tiene alérgenos declarados. Recuerda indicarlos si contiene alguno.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Opciones adicionales de restauración */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Opciones Adicionales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="permitirNotasCamarero"
              checked={formData.restauracion?.permitirNotasCamarero ?? true}
              onCheckedChange={(checked) => updateRestauracion({ permitirNotasCamarero: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="permitirNotasCamarero" className="cursor-pointer">
              Permitir notas del camarero
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requierePunto"
              checked={formData.restauracion?.requierePuntoCoccion ?? false}
              onCheckedChange={(checked) => updateRestauracion({ requierePuntoCoccion: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="requierePunto" className="cursor-pointer">
              Preguntar punto de cocción
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="puedeSerAcompanamiento"
              checked={formData.restauracion?.puedeSerAcompanamiento ?? false}
              onCheckedChange={(checked) => updateRestauracion({ puedeSerAcompanamiento: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="puedeSerAcompanamiento" className="cursor-pointer">
              Puede ser acompañamiento
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiereAcompanamiento"
              checked={formData.restauracion?.requiereAcompanamiento ?? false}
              onCheckedChange={(checked) => updateRestauracion({ requiereAcompanamiento: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="requiereAcompanamiento" className="cursor-pointer">
              Requiere elegir acompañamiento
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="esParaCompartir"
              checked={formData.restauracion?.esParaCompartir ?? false}
              onCheckedChange={(checked) => updateRestauracion({ esParaCompartir: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="esParaCompartir" className="cursor-pointer">
              Es para compartir (ración grande)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="disponibleParaLlevar"
              checked={formData.restauracion?.disponibleParaLlevar ?? true}
              onCheckedChange={(checked) => updateRestauracion({ disponibleParaLlevar: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="disponibleParaLlevar" className="cursor-pointer">
              Disponible para llevar / delivery
            </Label>
          </div>
        </div>

        {/* Información calórica opcional */}
        <div className="mt-6 pt-4 border-t">
          <Label className="text-sm font-medium mb-3 block">Información Nutricional (opcional)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="calorias" className="text-xs">Calorías (kcal)</Label>
              <Input
                id="calorias"
                type="number"
                min="0"
                value={formData.restauracion?.infoNutricional?.calorias || ''}
                onChange={(e) =>
                  updateRestauracion({
                    infoNutricional: {
                      ...(formData.restauracion?.infoNutricional || {}),
                      calorias: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="proteinas" className="text-xs">Proteínas (g)</Label>
              <Input
                id="proteinas"
                type="number"
                min="0"
                step="0.1"
                value={formData.restauracion?.infoNutricional?.proteinas || ''}
                onChange={(e) =>
                  updateRestauracion({
                    infoNutricional: {
                      ...(formData.restauracion?.infoNutricional || {}),
                      proteinas: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carbohidratos" className="text-xs">Carbohidratos (g)</Label>
              <Input
                id="carbohidratos"
                type="number"
                min="0"
                step="0.1"
                value={formData.restauracion?.infoNutricional?.carbohidratos || ''}
                onChange={(e) =>
                  updateRestauracion({
                    infoNutricional: {
                      ...(formData.restauracion?.infoNutricional || {}),
                      carbohidratos: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="grasas" className="text-xs">Grasas (g)</Label>
              <Input
                id="grasas"
                type="number"
                min="0"
                step="0.1"
                value={formData.restauracion?.infoNutricional?.grasas || ''}
                onChange={(e) =>
                  updateRestauracion({
                    infoNutricional: {
                      ...(formData.restauracion?.infoNutricional || {}),
                      grasas: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                disabled={!isEditing}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
