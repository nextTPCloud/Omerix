'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { FullCreateModal } from '@/components/ui/full-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Building2, User, MapPin, CreditCard, FileText } from 'lucide-react'
import { clientesService } from '@/services/clientes.service'
import { agentesService } from '@/services/agentes-comerciales.service'
import { AgenteComercial } from '@/types/agente-comercial.types'
import { CreateClienteDTO, DireccionExtendida, CuentaBancaria } from '@/types/cliente.types'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'

interface FullCreateClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (cliente: { _id: string; codigo: string; nombre: string; nif: string }) => void
}

const FORMAS_PAGO = [
  { value: 'contado', label: 'Contado' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'domiciliacion', label: 'Domiciliación' },
  { value: 'confirming', label: 'Confirming' },
  { value: 'pagare', label: 'Pagaré' },
]

export function FullCreateCliente({ open, onOpenChange, onCreated }: FullCreateClienteProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('datos')
  const [agentesDisponibles, setAgentesDisponibles] = useState<AgenteComercial[]>([])
  const [loadingAgentes, setLoadingAgentes] = useState(false)

  const [formData, setFormData] = useState<CreateClienteDTO>({
    tipoCliente: 'particular',
    nombre: '',
    nif: '',
    activo: true,
    usarEnTPV: false,
    direcciones: [],
    cuentasBancarias: [],
    agentesComerciales: [],
  })

  // Cargar agentes comerciales
  useEffect(() => {
    const loadAgentes = async () => {
      try {
        setLoadingAgentes(true)
        const response = await agentesService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setAgentesDisponibles(response.data || [])
        }
      } catch (error) {
        console.error('Error cargando agentes:', error)
      } finally {
        setLoadingAgentes(false)
      }
    }
    if (open) loadAgentes()
  }, [open])

  const agentesOptions = React.useMemo(() => {
    return agentesDisponibles.map((agente) => ({
      value: agente._id,
      label: `${agente.nombre} ${agente.apellidos || ''}`.trim(),
      description: agente.codigo,
    }))
  }, [agentesDisponibles])

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.nif?.trim()) {
      toast.error('El NIF/CIF es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await clientesService.create(formData)

      if (response.success && response.data) {
        toast.success('Cliente creado correctamente')
        onCreated({
          _id: response.data._id,
          codigo: response.data.codigo,
          nombre: response.data.nombre,
          nif: response.data.nif,
        })
        onOpenChange(false)
        resetForm()
      }
    } catch (error: any) {
      console.error('Error al crear cliente:', error)
      toast.error(error.response?.data?.message || 'Error al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tipoCliente: 'particular',
      nombre: '',
      nif: '',
      activo: true,
      usarEnTPV: false,
      direcciones: [],
      cuentasBancarias: [],
      agentesComerciales: [],
    })
    setActiveTab('datos')
  }

  // Funciones para direcciones
  const agregarDireccion = () => {
    setFormData(prev => ({
      ...prev,
      direcciones: [...(prev.direcciones || []), {
        tipo: 'fiscal' as const,
        calle: '',
        codigoPostal: '',
        ciudad: '',
        provincia: '',
        pais: 'España',
        predeterminada: (prev.direcciones || []).length === 0,
        activa: true,
      }]
    }))
  }

  const actualizarDireccion = (index: number, field: keyof DireccionExtendida, value: any) => {
    setFormData(prev => ({
      ...prev,
      direcciones: (prev.direcciones || []).map((dir, i) =>
        i === index ? { ...dir, [field]: value } : dir
      )
    }))
  }

  const eliminarDireccion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      direcciones: (prev.direcciones || []).filter((_, i) => i !== index)
    }))
  }

  // Funciones para cuentas bancarias
  const agregarCuenta = () => {
    setFormData(prev => ({
      ...prev,
      cuentasBancarias: [...(prev.cuentasBancarias || []), {
        iban: '',
        swift: '',
        banco: '',
        titular: '',
        predeterminada: (prev.cuentasBancarias || []).length === 0,
        activa: true,
        usarParaCobros: false,
        usarParaPagos: false,
      }]
    }))
  }

  const actualizarCuenta = (index: number, field: keyof CuentaBancaria, value: any) => {
    setFormData(prev => ({
      ...prev,
      cuentasBancarias: (prev.cuentasBancarias || []).map((cuenta, i) =>
        i === index ? { ...cuenta, [field]: value } : cuenta
      )
    }))
  }

  const eliminarCuenta = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cuentasBancarias: (prev.cuentasBancarias || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <FullCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Nuevo Cliente"
      description="Complete los datos del cliente"
      onSubmit={handleSubmit}
      loading={loading}
      size="xl"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datos" className="gap-2">
            {formData.tipoCliente === 'empresa' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            Datos
          </TabsTrigger>
          <TabsTrigger value="direcciones" className="gap-2">
            <MapPin className="h-4 w-4" />
            Direcciones
          </TabsTrigger>
          <TabsTrigger value="bancarios" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Bancarios
          </TabsTrigger>
          <TabsTrigger value="condiciones" className="gap-2">
            <FileText className="h-4 w-4" />
            Condiciones
          </TabsTrigger>
        </TabsList>

        {/* Tab Datos */}
        <TabsContent value="datos" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Cliente *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.tipoCliente}
                onChange={(e) => setFormData({ ...formData, tipoCliente: e.target.value as 'particular' | 'empresa' })}
              >
                <option value="particular">Particular</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>NIF/CIF *</Label>
              <Input
                value={formData.nif || ''}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                placeholder="Ej: 12345678A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre / Razón Social *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo o razón social"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre Comercial</Label>
              <Input
                value={formData.nombreComercial || ''}
                onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                placeholder="Nombre comercial (opcional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="912345678"
              />
            </div>
            <div className="space-y-2">
              <Label>Móvil</Label>
              <Input
                value={formData.movil || ''}
                onChange={(e) => setFormData({ ...formData, movil: e.target.value })}
                placeholder="612345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Web</Label>
            <Input
              value={formData.web || ''}
              onChange={(e) => setFormData({ ...formData, web: e.target.value })}
              placeholder="https://www.ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Agente Comercial</Label>
            <SearchableSelect
              options={agentesOptions}
              value={formData.agentesComerciales?.[0] || ''}
              onValueChange={(value) => setFormData({ ...formData, agentesComerciales: value ? [value] : [] })}
              placeholder="Seleccionar agente..."
              searchPlaceholder="Buscar agente..."
              emptyMessage="No se encontraron agentes"
              loading={loadingAgentes}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label>Cliente Activo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.usarEnTPV}
                onCheckedChange={(checked) => setFormData({ ...formData, usarEnTPV: checked })}
              />
              <Label>Usar en TPV</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el cliente..."
              rows={3}
            />
          </div>
        </TabsContent>

        {/* Tab Direcciones */}
        <TabsContent value="direcciones" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Direcciones</h3>
            <Button type="button" variant="outline" size="sm" onClick={agregarDireccion}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Dirección
            </Button>
          </div>

          {(formData.direcciones || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No hay direcciones añadidas</p>
                <Button type="button" variant="link" onClick={agregarDireccion}>
                  Añadir primera dirección
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(formData.direcciones || []).map((dir, index) => (
                <Card key={index}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Dirección {index + 1}</CardTitle>
                      <Button type="button" variant="ghost" size="sm" onClick={() => eliminarDireccion(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={dir.tipo}
                          onChange={(e) => actualizarDireccion(index, 'tipo', e.target.value)}
                        >
                          <option value="fiscal">Fiscal</option>
                          <option value="envio">Envío</option>
                          <option value="facturacion">Facturación</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={dir.predeterminada}
                          onCheckedChange={(checked) => actualizarDireccion(index, 'predeterminada', checked)}
                        />
                        <Label>Principal</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input
                        value={dir.calle}
                        onChange={(e) => actualizarDireccion(index, 'calle', e.target.value)}
                        placeholder="Calle, número, piso..."
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>C.P.</Label>
                        <Input
                          value={dir.codigoPostal}
                          onChange={(e) => actualizarDireccion(index, 'codigoPostal', e.target.value)}
                          placeholder="28001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ciudad</Label>
                        <Input
                          value={dir.ciudad}
                          onChange={(e) => actualizarDireccion(index, 'ciudad', e.target.value)}
                          placeholder="Madrid"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Provincia</Label>
                        <Input
                          value={dir.provincia}
                          onChange={(e) => actualizarDireccion(index, 'provincia', e.target.value)}
                          placeholder="Madrid"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>País</Label>
                        <Input
                          value={dir.pais}
                          onChange={(e) => actualizarDireccion(index, 'pais', e.target.value)}
                          placeholder="España"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Bancarios */}
        <TabsContent value="bancarios" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cuentas Bancarias</h3>
            <Button type="button" variant="outline" size="sm" onClick={agregarCuenta}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Cuenta
            </Button>
          </div>

          {(formData.cuentasBancarias || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No hay cuentas bancarias añadidas</p>
                <Button type="button" variant="link" onClick={agregarCuenta}>
                  Añadir primera cuenta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(formData.cuentasBancarias || []).map((cuenta, index) => (
                <Card key={index}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Cuenta {index + 1}</CardTitle>
                      <Button type="button" variant="ghost" size="sm" onClick={() => eliminarCuenta(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          value={cuenta.iban}
                          onChange={(e) => actualizarCuenta(index, 'iban', e.target.value)}
                          placeholder="ES00 0000 0000 0000 0000 0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SWIFT/BIC</Label>
                        <Input
                          value={cuenta.swift || ''}
                          onChange={(e) => actualizarCuenta(index, 'swift', e.target.value)}
                          placeholder="XXXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre del Banco</Label>
                        <Input
                          value={cuenta.banco || ''}
                          onChange={(e) => actualizarCuenta(index, 'banco', e.target.value)}
                          placeholder="Nombre del banco"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={cuenta.predeterminada}
                          onCheckedChange={(checked) => actualizarCuenta(index, 'predeterminada', checked)}
                        />
                        <Label>Cuenta Principal</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Condiciones */}
        <TabsContent value="condiciones" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condiciones de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.formaPago || ''}
                    onChange={(e) => setFormData({ ...formData, formaPago: e.target.value as any })}
                  >
                    <option value="">Seleccionar...</option>
                    {FORMAS_PAGO.map(fp => (
                      <option key={fp.value} value={fp.value}>{fp.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Días de Pago</Label>
                  <Input
                    type="number"
                    value={formData.diasPago || ''}
                    onChange={(e) => setFormData({ ...formData, diasPago: parseInt(e.target.value) || undefined })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Límite de Crédito (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.limiteCredito || ''}
                    onChange={(e) => setFormData({ ...formData, limiteCredito: parseFloat(e.target.value) || undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.descuentoGeneral || ''}
                    onChange={(e) => setFormData({ ...formData, descuentoGeneral: parseFloat(e.target.value) || undefined })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </FullCreateModal>
  )
}
