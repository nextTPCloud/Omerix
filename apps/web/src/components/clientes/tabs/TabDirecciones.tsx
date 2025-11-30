'use client'

import { useState } from 'react'
import { DireccionExtendida, TipoDireccion, TIPOS_DIRECCION } from '@/types/cliente.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Star,
  Building2,
  Truck,
  Warehouse,
  HardHat,
  MoreHorizontal,
  Map,
} from 'lucide-react'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'

interface TabDireccionesProps {
  direcciones: DireccionExtendida[]
  onChange: (direcciones: DireccionExtendida[]) => void
  readOnly?: boolean
}

const ICONOS_TIPO: Record<TipoDireccion, React.ReactNode> = {
  fiscal: <Building2 className="h-4 w-4" />,
  envio: <Truck className="h-4 w-4" />,
  almacen: <Warehouse className="h-4 w-4" />,
  obra: <HardHat className="h-4 w-4" />,
  otro: <MoreHorizontal className="h-4 w-4" />,
}

const COLORES_TIPO: Record<TipoDireccion, string> = {
  fiscal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  envio: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  almacen: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  obra: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  otro: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

const emptyDireccion: Omit<DireccionExtendida, '_id'> = {
  tipo: 'fiscal',
  nombre: '',
  calle: '',
  numero: '',
  piso: '',
  codigoPostal: '',
  ciudad: '',
  provincia: '',
  pais: 'Espana',
  personaContacto: '',
  telefonoContacto: '',
  horario: '',
  notas: '',
  predeterminada: false,
  activa: true,
}

export function TabDirecciones({ direcciones, onChange, readOnly = false }: TabDireccionesProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<Omit<DireccionExtendida, '_id'>>(emptyDireccion)
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null)

  const handleAdd = () => {
    setEditingIndex(null)
    setFormData({ ...emptyDireccion })
    setDialogOpen(true)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setFormData({ ...direcciones[index] })
    setDialogOpen(true)
  }

  const handleSave = () => {
    const newDirecciones = [...direcciones]

    // Si es predeterminada, quitar predeterminada de otras del mismo tipo
    if (formData.predeterminada) {
      newDirecciones.forEach((d, i) => {
        if (d.tipo === formData.tipo && (editingIndex === null || i !== editingIndex)) {
          d.predeterminada = false
        }
      })
    }

    if (editingIndex !== null) {
      newDirecciones[editingIndex] = { ...formData, _id: direcciones[editingIndex]._id }
    } else {
      newDirecciones.push({ ...formData } as DireccionExtendida)
    }

    onChange(newDirecciones)
    setDialogOpen(false)
  }

  const handleDelete = (index: number) => {
    const newDirecciones = direcciones.filter((_, i) => i !== index)
    onChange(newDirecciones)
    setDeleteDialog(null)
  }

  const handleToggleActiva = (index: number) => {
    const newDirecciones = [...direcciones]
    newDirecciones[index].activa = !newDirecciones[index].activa
    onChange(newDirecciones)
  }

  const handleSetPredeterminada = (index: number) => {
    const newDirecciones = [...direcciones]
    const tipo = newDirecciones[index].tipo

    // Quitar predeterminada de otras del mismo tipo
    newDirecciones.forEach((d, i) => {
      if (d.tipo === tipo) {
        d.predeterminada = i === index
      }
    })

    onChange(newDirecciones)
  }

  const handleVerEnMapa = (direccion: DireccionExtendida) => {
    const direccionCompleta = `${direccion.calle} ${direccion.numero || ''}, ${direccion.codigoPostal} ${direccion.ciudad}, ${direccion.pais}`
    const url = direccion.latitud && direccion.longitud
      ? `https://www.google.com/maps?q=${direccion.latitud},${direccion.longitud}`
      : `https://www.google.com/maps/search/${encodeURIComponent(direccionCompleta)}`
    window.open(url, '_blank')
  }

  const getTipoLabel = (tipo: TipoDireccion) => {
    return TIPOS_DIRECCION.find(t => t.value === tipo)?.label || tipo
  }

  return (
    <div className="space-y-4">
      {/* Header con boton de anadir */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Direcciones</h3>
          <p className="text-sm text-muted-foreground">
            {direcciones.filter(d => d.activa).length} direcciones activas
          </p>
        </div>
        {!readOnly && (
          <Button type="button" onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Anadir Direccion
          </Button>
        )}
      </div>

      {/* Lista de direcciones */}
      {direcciones.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay direcciones registradas</p>
              {!readOnly && (
                <Button type="button" variant="link" onClick={handleAdd} className="mt-2">
                  Anadir primera direccion
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {direcciones.map((direccion, index) => (
            <Card
              key={direccion._id || index}
              className={!direccion.activa ? 'opacity-60' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header con tipo y badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={COLORES_TIPO[direccion.tipo]}>
                        {ICONOS_TIPO[direccion.tipo]}
                        <span className="ml-1">{getTipoLabel(direccion.tipo)}</span>
                      </Badge>
                      {direccion.predeterminada && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Predeterminada
                        </Badge>
                      )}
                      {!direccion.activa && (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                      {direccion.nombre && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {direccion.nombre}
                        </span>
                      )}
                    </div>

                    {/* Direccion */}
                    <div className="text-sm">
                      <p className="font-medium">
                        {direccion.calle} {direccion.numero}
                        {direccion.piso && `, ${direccion.piso}`}
                      </p>
                      <p className="text-muted-foreground">
                        {direccion.codigoPostal} {direccion.ciudad}, {direccion.provincia}
                      </p>
                      <p className="text-muted-foreground">{direccion.pais}</p>
                    </div>

                    {/* Contacto */}
                    {(direccion.personaContacto || direccion.telefonoContacto) && (
                      <div className="text-sm text-muted-foreground">
                        {direccion.personaContacto && <span>{direccion.personaContacto}</span>}
                        {direccion.personaContacto && direccion.telefonoContacto && <span> - </span>}
                        {direccion.telefonoContacto && <span>{direccion.telefonoContacto}</span>}
                      </div>
                    )}

                    {/* Horario */}
                    {direccion.horario && (
                      <p className="text-xs text-muted-foreground">
                        Horario: {direccion.horario}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerEnMapa(direccion)}
                      title="Ver en mapa"
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(index)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!direccion.predeterminada && direccion.activa && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetPredeterminada(index)}
                            title="Marcar como predeterminada"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog(index)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de edicion/creacion */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Editar Direccion' : 'Nueva Direccion'}
            </DialogTitle>
            <DialogDescription>
              {editingIndex !== null
                ? 'Modifica los datos de la direccion'
                : 'Completa los datos de la nueva direccion'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo y nombre */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de direccion *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoDireccion })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DIRECCION.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          {ICONOS_TIPO[tipo.value]}
                          {tipo.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre/Alias</Label>
                <Input
                  placeholder="Ej: Oficina Central"
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
            </div>

            {/* Buscador de direcciones */}
            <div className="space-y-2">
              <AddressAutocomplete
                label="Buscar direccion"
                placeholder="Escribe una direccion..."
                onAddressSelect={(address) => {
                  setFormData({
                    ...formData,
                    calle: address.calle,
                    numero: address.numero,
                    codigoPostal: address.codigoPostal,
                    ciudad: address.ciudad,
                    provincia: address.provincia,
                    pais: address.pais,
                    latitud: address.latitud,
                    longitud: address.longitud,
                  })
                }}
              />
            </div>

            {/* Campos de direccion manual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Calle *</Label>
                <Input
                  value={formData.calle}
                  onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input
                  value={formData.numero || ''}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Piso/Puerta</Label>
                <Input
                  value={formData.piso || ''}
                  onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Codigo Postal *</Label>
                <Input
                  value={formData.codigoPostal}
                  onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad *</Label>
                <Input
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Provincia *</Label>
                <Input
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pais *</Label>
                <Input
                  value={formData.pais}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Contacto en esta direccion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Persona de contacto</Label>
                <Input
                  placeholder="Nombre del contacto"
                  value={formData.personaContacto || ''}
                  onChange={(e) => setFormData({ ...formData, personaContacto: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefono de contacto</Label>
                <Input
                  placeholder="Telefono"
                  value={formData.telefonoContacto || ''}
                  onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Horario de atencion</Label>
              <Input
                placeholder="Ej: L-V 9:00-18:00"
                value={formData.horario || ''}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones sobre esta direccion..."
                value={formData.notas || ''}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={2}
              />
            </div>

            {/* Switches */}
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.predeterminada}
                  onCheckedChange={(checked) => setFormData({ ...formData, predeterminada: checked })}
                />
                <Label>Predeterminada para su tipo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                />
                <Label>Activa</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={!formData.calle || !formData.ciudad}>
              {editingIndex !== null ? 'Guardar cambios' : 'Anadir direccion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacion de eliminacion */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminacion</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que deseas eliminar esta direccion? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteDialog !== null && handleDelete(deleteDialog)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
