'use client'

import { useState } from 'react'
import { CuentaBancaria, TipoMandatoSEPA, TIPOS_MANDATO_SEPA } from '@/types/cliente.types'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Star,
  CreditCard,
  FileSignature,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabCuentasBancariasProps {
  cuentas: CuentaBancaria[]
  nombreTitularDefault?: string
  onChange: (cuentas: CuentaBancaria[]) => void
  readOnly?: boolean
}

const emptyCuenta: Omit<CuentaBancaria, '_id'> = {
  alias: '',
  titular: '',
  iban: '',
  swift: '',
  banco: '',
  sucursal: '',
  predeterminada: false,
  usarParaCobros: true,
  usarParaPagos: false,
  activa: true,
  notas: '',
}

// Funcion para formatear IBAN
const formatIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
}

// Funcion para validar IBAN basico (longitud y formato)
const validarIBAN = (iban: string): boolean => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  // IBAN espanol tiene 24 caracteres
  if (cleaned.startsWith('ES') && cleaned.length !== 24) return false
  // Otros IBAN tienen entre 15 y 34 caracteres
  return cleaned.length >= 15 && cleaned.length <= 34 && /^[A-Z]{2}[0-9A-Z]+$/.test(cleaned)
}

export function TabCuentasBancarias({
  cuentas,
  nombreTitularDefault = '',
  onChange,
  readOnly = false,
}: TabCuentasBancariasProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<Omit<CuentaBancaria, '_id'>>({
    ...emptyCuenta,
    titular: nombreTitularDefault,
  })
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null)
  const [showMandato, setShowMandato] = useState(false)
  const [copiedIban, setCopiedIban] = useState<string | null>(null)

  const handleAdd = () => {
    setEditingIndex(null)
    setFormData({ ...emptyCuenta, titular: nombreTitularDefault })
    setShowMandato(false)
    setDialogOpen(true)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setFormData({ ...cuentas[index] })
    setShowMandato(!!cuentas[index].mandatoSEPA)
    setDialogOpen(true)
  }

  const handleSave = () => {
    // Validar IBAN
    if (!validarIBAN(formData.iban)) {
      toast.error('El IBAN no tiene un formato valido')
      return
    }

    const newCuentas = [...cuentas]

    // Limpiar y formatear IBAN
    const cuentaToSave = {
      ...formData,
      iban: formData.iban.replace(/\s/g, '').toUpperCase(),
    }

    // Si no hay mandato, eliminar el objeto
    if (!showMandato) {
      delete cuentaToSave.mandatoSEPA
    }

    // Si es predeterminada, quitar predeterminada de otras
    if (cuentaToSave.predeterminada) {
      newCuentas.forEach((c, i) => {
        if (editingIndex === null || i !== editingIndex) {
          c.predeterminada = false
        }
      })
    }

    if (editingIndex !== null) {
      newCuentas[editingIndex] = { ...cuentaToSave, _id: cuentas[editingIndex]._id }
    } else {
      newCuentas.push(cuentaToSave as CuentaBancaria)
    }

    onChange(newCuentas)
    setDialogOpen(false)
  }

  const handleDelete = (index: number) => {
    const newCuentas = cuentas.filter((_, i) => i !== index)
    onChange(newCuentas)
    setDeleteDialog(null)
  }

  const handleSetPredeterminada = (index: number) => {
    const newCuentas = [...cuentas]
    newCuentas.forEach((c, i) => {
      c.predeterminada = i === index
    })
    onChange(newCuentas)
  }

  const handleCopyIban = async (iban: string) => {
    try {
      await navigator.clipboard.writeText(formatIBAN(iban))
      setCopiedIban(iban)
      setTimeout(() => setCopiedIban(null), 2000)
      toast.success('IBAN copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar el IBAN')
    }
  }

  const getTipoMandatoLabel = (tipo: TipoMandatoSEPA) => {
    return TIPOS_MANDATO_SEPA.find(t => t.value === tipo)?.label || tipo
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cuentas Bancarias</h3>
          <p className="text-sm text-muted-foreground">
            {cuentas.filter(c => c.activa).length} cuentas activas
            {cuentas.some(c => c.mandatoSEPA?.firmado) && ' - Con mandato SEPA'}
          </p>
        </div>
        {!readOnly && (
          <Button type="button" onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Anadir Cuenta
          </Button>
        )}
      </div>

      {/* Lista de cuentas */}
      {cuentas.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cuentas bancarias registradas</p>
              {!readOnly && (
                <Button type="button" variant="link" onClick={handleAdd} className="mt-2">
                  Anadir primera cuenta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cuentas.map((cuenta, index) => (
            <Card
              key={cuenta._id || index}
              className={!cuenta.activa ? 'opacity-60' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header con badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {cuenta.alias && (
                        <span className="font-medium">{cuenta.alias}</span>
                      )}
                      {cuenta.predeterminada && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Predeterminada
                        </Badge>
                      )}
                      {cuenta.usarParaCobros && (
                        <Badge variant="secondary" className="text-xs">Cobros</Badge>
                      )}
                      {cuenta.usarParaPagos && (
                        <Badge variant="secondary" className="text-xs">Pagos</Badge>
                      )}
                      {!cuenta.activa && (
                        <Badge variant="outline">Inactiva</Badge>
                      )}
                      {cuenta.mandatoSEPA?.firmado && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <FileSignature className="h-3 w-3 mr-1" />
                          SEPA
                        </Badge>
                      )}
                    </div>

                    {/* IBAN y banco */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">
                          {formatIBAN(cuenta.iban)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyIban(cuenta.iban)}
                        >
                          {copiedIban === cuenta.iban ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {cuenta.banco && (
                        <p className="text-sm text-muted-foreground">
                          {cuenta.banco}
                          {cuenta.sucursal && ` - ${cuenta.sucursal}`}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Titular: {cuenta.titular}
                      </p>
                    </div>

                    {/* Mandato SEPA */}
                    {cuenta.mandatoSEPA && (
                      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                        <p>
                          <span className="font-medium">Mandato SEPA:</span> {cuenta.mandatoSEPA.referencia}
                        </p>
                        <p>
                          Tipo: {getTipoMandatoLabel(cuenta.mandatoSEPA.tipoMandato)} |
                          Firma: {new Date(cuenta.mandatoSEPA.fechaFirma).toLocaleDateString()}
                          {cuenta.mandatoSEPA.firmado ? ' (Firmado)' : ' (Pendiente)'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-1">
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
                        {!cuenta.predeterminada && cuenta.activa && (
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
              {editingIndex !== null ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </DialogTitle>
            <DialogDescription>
              {editingIndex !== null
                ? 'Modifica los datos de la cuenta bancaria'
                : 'Completa los datos de la nueva cuenta bancaria'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Alias y titular */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alias/Nombre</Label>
                <Input
                  placeholder="Ej: Cuenta Principal"
                  value={formData.alias || ''}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Titular *</Label>
                <Input
                  placeholder="Nombre del titular"
                  value={formData.titular}
                  onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* IBAN y SWIFT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>IBAN *</Label>
                <Input
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  value={formatIBAN(formData.iban)}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.replace(/\s/g, '') })}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>SWIFT/BIC</Label>
                <Input
                  placeholder="XXXXXXXX"
                  value={formData.swift || ''}
                  onChange={(e) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Banco y sucursal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input
                  placeholder="Nombre del banco"
                  value={formData.banco || ''}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Input
                  placeholder="Sucursal"
                  value={formData.sucursal || ''}
                  onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                />
              </div>
            </div>

            {/* Mandato SEPA (colapsable) */}
            <Collapsible open={showMandato} onOpenChange={setShowMandato}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Mandato SEPA
                    {formData.mandatoSEPA?.firmado && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Configurado</Badge>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMandato ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Referencia del mandato *</Label>
                      <Input
                        placeholder="MAND-2024-00001"
                        value={formData.mandatoSEPA?.referencia || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          mandatoSEPA: {
                            ...formData.mandatoSEPA,
                            referencia: e.target.value.toUpperCase(),
                            fechaFirma: formData.mandatoSEPA?.fechaFirma || new Date().toISOString().split('T')[0],
                            tipoMandato: formData.mandatoSEPA?.tipoMandato || 'recurrente',
                            firmado: formData.mandatoSEPA?.firmado || false,
                          },
                        })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de firma *</Label>
                      <Input
                        type="date"
                        value={formData.mandatoSEPA?.fechaFirma?.split('T')[0] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          mandatoSEPA: {
                            ...formData.mandatoSEPA!,
                            fechaFirma: e.target.value,
                          },
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de mandato</Label>
                      <Select
                        value={formData.mandatoSEPA?.tipoMandato || 'recurrente'}
                        onValueChange={(value: TipoMandatoSEPA) => setFormData({
                          ...formData,
                          mandatoSEPA: {
                            ...formData.mandatoSEPA!,
                            tipoMandato: value,
                          },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_MANDATO_SEPA.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.mandatoSEPA?.firmado || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            mandatoSEPA: {
                              ...formData.mandatoSEPA!,
                              firmado: checked,
                            },
                          })}
                        />
                        <Label>Mandato firmado</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones sobre esta cuenta..."
                value={formData.notas || ''}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={2}
              />
            </div>

            {/* Switches de uso y estado */}
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.usarParaCobros}
                  onCheckedChange={(checked) => setFormData({ ...formData, usarParaCobros: checked })}
                />
                <Label>Usar para cobros (domiciliaciones)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.usarParaPagos}
                  onCheckedChange={(checked) => setFormData({ ...formData, usarParaPagos: checked })}
                />
                <Label>Usar para pagos</Label>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.predeterminada}
                  onCheckedChange={(checked) => setFormData({ ...formData, predeterminada: checked })}
                />
                <Label>Cuenta predeterminada</Label>
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
            <Button type="button" onClick={handleSave} disabled={!formData.iban || !formData.titular}>
              {editingIndex !== null ? 'Guardar cambios' : 'Anadir cuenta'}
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
              ¿Estas seguro de que deseas eliminar esta cuenta bancaria? Esta accion no se puede deshacer.
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
