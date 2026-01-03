'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  cuentasBancariasService,
  CuentaBancaria,
  CreateCuentaBancariaDTO,
  UpdateCuentaBancariaDTO,
} from '@/services/cuentas-bancarias.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Landmark,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  StarOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const initialFormData: CreateCuentaBancariaDTO = {
  iban: '',
  banco: '',
  bic: '',
  titular: '',
  alias: '',
  saldoInicial: 0,
  usarParaCobros: true,
  usarParaPagos: true,
  predeterminada: false,
}

export default function CuentasBancariasPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [busqueda, setBusqueda] = useState('')

  // Modal de formulario
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear')
  const [formData, setFormData] = useState<CreateCuentaBancariaDTO>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Dialog de eliminar
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cuenta: CuentaBancaria | null }>({
    open: false,
    cuenta: null,
  })

  // Cargar cuentas
  const cargarCuentas = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await cuentasBancariasService.getAll({
        busqueda: busqueda || undefined,
      })
      if (response.success) {
        setCuentas(response.data)
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error)
      toast.error('Error al cargar las cuentas bancarias')
    } finally {
      setIsLoading(false)
    }
  }, [busqueda])

  useEffect(() => {
    cargarCuentas()
  }, [cargarCuentas])

  // Abrir formulario para crear
  const handleNueva = () => {
    setFormData(initialFormData)
    setFormMode('crear')
    setEditingId(null)
    setShowFormDialog(true)
  }

  // Abrir formulario para editar
  const handleEditar = (cuenta: CuentaBancaria) => {
    setFormData({
      iban: cuenta.iban,
      banco: cuenta.banco,
      bic: cuenta.bic || '',
      titular: cuenta.titular,
      alias: cuenta.alias || '',
      saldoInicial: cuenta.saldoInicial,
      usarParaCobros: cuenta.usarParaCobros,
      usarParaPagos: cuenta.usarParaPagos,
      predeterminada: cuenta.predeterminada,
    })
    setFormMode('editar')
    setEditingId(cuenta._id)
    setShowFormDialog(true)
  }

  // Guardar cuenta
  const handleGuardar = async () => {
    if (!formData.iban.trim() || !formData.banco.trim() || !formData.titular.trim()) {
      toast.error('IBAN, banco y titular son obligatorios')
      return
    }

    // Validar IBAN
    if (!cuentasBancariasService.validateIban(formData.iban)) {
      toast.error('El formato del IBAN no es válido')
      return
    }

    try {
      setIsSaving(true)
      if (formMode === 'crear') {
        const result = await cuentasBancariasService.create(formData)
        if (result.success) {
          toast.success('Cuenta bancaria creada correctamente')
          setShowFormDialog(false)
          cargarCuentas()
        } else {
          toast.error(result.error || 'Error al crear la cuenta')
        }
      } else if (editingId) {
        const updateData: UpdateCuentaBancariaDTO = {
          iban: formData.iban,
          banco: formData.banco,
          bic: formData.bic,
          titular: formData.titular,
          alias: formData.alias,
          usarParaCobros: formData.usarParaCobros,
          usarParaPagos: formData.usarParaPagos,
        }
        const result = await cuentasBancariasService.update(editingId, updateData)
        if (result.success) {
          toast.success('Cuenta bancaria actualizada correctamente')
          setShowFormDialog(false)
          cargarCuentas()
        } else {
          toast.error(result.error || 'Error al actualizar la cuenta')
        }
      }
    } catch (error: any) {
      console.error('Error guardando cuenta:', error)
      toast.error(error.response?.data?.error || 'Error al guardar la cuenta')
    } finally {
      setIsSaving(false)
    }
  }

  // Establecer como predeterminada
  const handleSetPredeterminada = async (cuenta: CuentaBancaria) => {
    try {
      const result = await cuentasBancariasService.setPredeterminada(cuenta._id)
      if (result.success) {
        toast.success('Cuenta establecida como predeterminada')
        cargarCuentas()
      }
    } catch (error) {
      console.error('Error estableciendo cuenta predeterminada:', error)
      toast.error('Error al establecer cuenta predeterminada')
    }
  }

  // Eliminar cuenta
  const handleEliminar = async () => {
    if (!deleteDialog.cuenta) return

    try {
      const result = await cuentasBancariasService.delete(deleteDialog.cuenta._id)
      if (result.success) {
        toast.success('Cuenta bancaria eliminada')
        setDeleteDialog({ open: false, cuenta: null })
        cargarCuentas()
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error)
      toast.error('Error al eliminar la cuenta')
    }
  }

  // Estadísticas
  const totalSaldos = cuentas.reduce((sum, c) => sum + (c.activa ? c.saldoActual : 0), 0)
  const cuentasActivas = cuentas.filter(c => c.activa).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cuentas Bancarias</h1>
            <p className="text-muted-foreground">
              Gestión de cuentas bancarias de la empresa
            </p>
          </div>
          <Button onClick={handleNueva}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cuenta
          </Button>
        </div>

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cuentasBancariasService.getSaldoColor(totalSaldos)}`}>
                {formatCurrency(totalSaldos)}
              </div>
              <p className="text-xs text-muted-foreground">
                Suma de todas las cuentas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas Activas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cuentasActivas}</div>
              <p className="text-xs text-muted-foreground">
                de {cuentas.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuenta Predeterminada</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium truncate">
                {cuentas.find(c => c.predeterminada)?.alias ||
                 cuentas.find(c => c.predeterminada)?.banco ||
                 'No definida'}
              </div>
              <p className="text-xs text-muted-foreground">
                {cuentas.find(c => c.predeterminada)?.iban
                  ? `...${cuentas.find(c => c.predeterminada)?.iban.slice(-4)}`
                  : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y tabla */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Cuentas</CardTitle>
                <CardDescription>
                  {cuentas.length} cuenta{cuentas.length !== 1 ? 's' : ''} registrada{cuentas.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={cargarCuentas}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Uso</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : cuentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay cuentas bancarias registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  cuentas.map((cuenta) => (
                    <TableRow key={cuenta._id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {cuenta.predeterminada && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {cuentasBancariasService.formatIban(cuenta.iban)}
                        </div>
                      </TableCell>
                      <TableCell>{cuenta.banco}</TableCell>
                      <TableCell>{cuenta.titular}</TableCell>
                      <TableCell>{cuenta.alias || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${cuentasBancariasService.getSaldoColor(cuenta.saldoActual)}`}>
                        {formatCurrency(cuenta.saldoActual)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {cuenta.usarParaCobros && (
                            <Badge variant="outline" className="text-xs">Cobros</Badge>
                          )}
                          {cuenta.usarParaPagos && (
                            <Badge variant="outline" className="text-xs">Pagos</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {cuenta.activa ? (
                          <Badge variant="default" className="bg-green-500">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditar(cuenta)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {!cuenta.predeterminada && cuenta.activa && (
                              <DropdownMenuItem onClick={() => handleSetPredeterminada(cuenta)}>
                                <Star className="mr-2 h-4 w-4" />
                                Predeterminada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, cuenta })}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de formulario */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'crear' ? 'Nueva Cuenta Bancaria' : 'Editar Cuenta Bancaria'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'crear'
                ? 'Complete los datos para crear una nueva cuenta bancaria'
                : 'Modifique los datos de la cuenta bancaria'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                placeholder="ES00 0000 0000 0000 0000 0000"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco *</Label>
                <Input
                  id="banco"
                  placeholder="Nombre del banco"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bic">BIC/SWIFT</Label>
                <Input
                  id="bic"
                  placeholder="XXXXXXXX"
                  value={formData.bic}
                  onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titular">Titular *</Label>
              <Input
                id="titular"
                placeholder="Nombre del titular de la cuenta"
                value={formData.titular}
                onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                placeholder="Nombre corto para identificar la cuenta"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              />
            </div>

            {formMode === 'crear' && (
              <div className="space-y-2">
                <Label htmlFor="saldoInicial">Saldo Inicial</Label>
                <Input
                  id="saldoInicial"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.saldoInicial}
                  onChange={(e) => setFormData({ ...formData, saldoInicial: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="usarParaCobros"
                  checked={formData.usarParaCobros}
                  onCheckedChange={(checked) => setFormData({ ...formData, usarParaCobros: checked })}
                />
                <Label htmlFor="usarParaCobros">Usar para cobros</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="usarParaPagos"
                  checked={formData.usarParaPagos}
                  onCheckedChange={(checked) => setFormData({ ...formData, usarParaPagos: checked })}
                />
                <Label htmlFor="usarParaPagos">Usar para pagos</Label>
              </div>
            </div>

            {formMode === 'crear' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="predeterminada"
                  checked={formData.predeterminada}
                  onCheckedChange={(checked) => setFormData({ ...formData, predeterminada: checked })}
                />
                <Label htmlFor="predeterminada">Establecer como predeterminada</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                formMode === 'crear' ? 'Crear Cuenta' : 'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta bancaria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará la cuenta bancaria &quot;{deleteDialog.cuenta?.alias || deleteDialog.cuenta?.banco}&quot;.
              Los movimientos asociados se mantendrán en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
