'use client'

import React, { useState, useEffect } from 'react'
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  DireccionExtendida,
  CuentaBancaria,
} from '@/types/cliente.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  User,
  Building2,
  MapPin,
  CreditCard,
  Landmark,
  FileText,
  Save,
  Users,
  X,
} from 'lucide-react'
import { AgenteComercial } from '@/types/agente-comercial.types'
import { agentesService } from '@/services/agentes-comerciales.service'

// Importar componentes de tabs
import { TabDirecciones } from './tabs/TabDirecciones'
import { TabCuentasBancarias } from './tabs/TabCuentasBancarias'
import { TabCondicionesPago } from './tabs/TabCondicionesPago'

interface ClienteFormProps {
  initialData?: Cliente
  onSubmit: (data: CreateClienteDTO | UpdateClienteDTO) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function ClienteForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: ClienteFormProps) {
  const [activeTab, setActiveTab] = useState('datos')

  // Estado para agentes comerciales disponibles
  const [agentesDisponibles, setAgentesDisponibles] = useState<AgenteComercial[]>([])
  const [loadingAgentes, setLoadingAgentes] = useState(false)

  // Estado del formulario
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

  // Cargar agentes comerciales disponibles
  useEffect(() => {
    const loadAgentes = async () => {
      try {
        setLoadingAgentes(true)
        const response = await agentesService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setAgentesDisponibles(response.data || [])
        }
      } catch (error) {
        console.error('Error cargando agentes comerciales:', error)
      } finally {
        setLoadingAgentes(false)
      }
    }
    loadAgentes()
  }, [])

  // Helper para extraer ID de un campo que puede venir poblado como objeto
  const extractId = (value: any): string | undefined => {
    if (!value) return undefined
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value._id) return value._id
    return undefined
  }

  // Cargar datos iniciales si existen
  useEffect(() => {
    if (initialData) {
      setFormData({
        tipoCliente: initialData.tipoCliente,
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        nombreComercial: initialData.nombreComercial,
        nif: initialData.nif,
        email: initialData.email,
        telefono: initialData.telefono,
        movil: initialData.movil,
        web: initialData.web,
        // Nuevos campos
        direcciones: initialData.direcciones || [],
        cuentasBancarias: initialData.cuentasBancarias || [],
        // Condiciones de pago (extraer ID si viene como objeto poblado)
        formaPagoId: extractId(initialData.formaPagoId),
        terminoPagoId: extractId(initialData.terminoPagoId),
        // Legacy (por compatibilidad)
        direccion: initialData.direccion,
        direccionEnvio: initialData.direccionEnvio,
        formaPago: initialData.formaPago,
        diasPago: initialData.diasPago,
        iban: initialData.iban,
        swift: initialData.swift,
        // Otros
        descuentoGeneral: initialData.descuentoGeneral,
        tarifaId: initialData.tarifaId,
        personaContacto: initialData.personaContacto,
        categoriaId: initialData.categoriaId,
        zona: initialData.zona,
        vendedorId: initialData.vendedorId,
        agentesComerciales: initialData.agentesComerciales || [],
        limiteCredito: initialData.limiteCredito,
        activo: initialData.activo,
        usarEnTPV: initialData.usarEnTPV,
        observaciones: initialData.observaciones,
        tags: initialData.tags,
      })
    }
  }, [initialData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  // Contadores para badges en tabs
  const numDirecciones = formData.direcciones?.length || 0
  const numCuentas = formData.cuentasBancarias?.length || 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="datos" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Datos</span>
          </TabsTrigger>
          <TabsTrigger value="direcciones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Direcciones</span>
            {numDirecciones > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {numDirecciones}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="bancarios" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bancarios</span>
            {numCuentas > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {numCuentas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="otros" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Otros</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: DATOS BASICOS */}
        {/* ============================================ */}
        <TabsContent value="datos" className="space-y-6 mt-6">
          {/* Tipo de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {formData.tipoCliente === 'empresa' ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                Tipo de Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCliente">Tipo *</Label>
                <select
                  id="tipoCliente"
                  name="tipoCliente"
                  value={formData.tipoCliente}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="particular">Particular</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="activo" className="cursor-pointer">Cliente Activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="usarEnTPV" className="cursor-pointer">Usar en TPV</Label>
                <Switch
                  id="usarEnTPV"
                  checked={formData.usarEnTPV}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, usarEnTPV: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos Basicos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Basicos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Codigo {mode === 'create' && '(opcional)'}</Label>
                <div className="relative">
                  <Input
                    id="codigo"
                    name="codigo"
                    value={formData.codigo || ''}
                    onChange={handleChange}
                    onKeyDown={async (e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        try {
                          const codigoActual = e.currentTarget.value
                          const match = codigoActual.match(/^([A-Za-z]+-?)/)
                          const prefijo = match ? match[1] : undefined
                          const { clientesService } = await import('@/services/clientes.service')
                          const response = await clientesService.sugerirSiguienteCodigo(prefijo)
                          if (response.success) {
                            setFormData((prev) => ({ ...prev, codigo: response.data.codigo }))
                          }
                        } catch (error) {
                          console.error('Error al sugerir codigo:', error)
                        }
                      }
                    }}
                    placeholder={mode === 'create' ? 'Ej: CLI-001 (vacio para autogenerar)' : 'Codigo del cliente'}
                    disabled={mode === 'edit'}
                    className={mode === 'edit' ? 'bg-muted' : ''}
                  />
                  {mode === 'create' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Presiona flecha abajo para sugerir el siguiente codigo
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF/CIF *</Label>
                <Input
                  id="nif"
                  name="nif"
                  value={formData.nif || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="nombre">Nombre / Razon Social *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                <Input
                  id="nombreComercial"
                  name="nombreComercial"
                  value={formData.nombreComercial || ''}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="movil">Movil</Label>
                <Input
                  id="movil"
                  name="movil"
                  type="tel"
                  value={formData.movil || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="web">Sitio Web</Label>
                <Input
                  id="web"
                  name="web"
                  type="url"
                  value={formData.web || ''}
                  onChange={handleChange}
                  placeholder="https://"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: DIRECCIONES */}
        {/* ============================================ */}
        <TabsContent value="direcciones" className="mt-6">
          <TabDirecciones
            direcciones={formData.direcciones || []}
            onChange={(direcciones) => setFormData(prev => ({ ...prev, direcciones }))}
          />
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: CONDICIONES DE PAGO */}
        {/* ============================================ */}
        <TabsContent value="pagos" className="mt-6">
          <TabCondicionesPago
            condiciones={{
              formaPagoId: formData.formaPagoId,
              terminoPagoId: formData.terminoPagoId,
              tarifaId: formData.tarifaId,
              descuentoGeneral: formData.descuentoGeneral,
              limiteCredito: formData.limiteCredito,
            }}
            onChange={(condiciones) => setFormData(prev => ({
              ...prev,
              formaPagoId: condiciones.formaPagoId,
              terminoPagoId: condiciones.terminoPagoId,
              tarifaId: condiciones.tarifaId,
              descuentoGeneral: condiciones.descuentoGeneral,
              limiteCredito: condiciones.limiteCredito,
            }))}
          />
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: CUENTAS BANCARIAS */}
        {/* ============================================ */}
        <TabsContent value="bancarios" className="mt-6">
          <TabCuentasBancarias
            cuentas={formData.cuentasBancarias || []}
            nombreTitularDefault={formData.nombre}
            onChange={(cuentas) => setFormData(prev => ({ ...prev, cuentasBancarias: cuentas }))}
          />
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: OTROS */}
        {/* ============================================ */}
        <TabsContent value="otros" className="space-y-6 mt-6">
          {/* Clasificacion */}
          <Card>
            <CardHeader>
              <CardTitle>Clasificacion</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zona">Zona</Label>
                <Input
                  id="zona"
                  name="zona"
                  value={formData.zona || ''}
                  onChange={handleChange}
                  placeholder="Ej: Norte, Sur, Centro..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    setFormData(prev => ({ ...prev, tags }))
                  }}
                  placeholder="VIP, Mayorista, Premium..."
                />
                <p className="text-xs text-muted-foreground">
                  Separar con comas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agentes Comerciales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agentes Comerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de agente */}
              <div className="space-y-2">
                <Label>Añadir Agente Comercial</Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value=""
                  onChange={(e) => {
                    const agenteId = e.target.value
                    if (agenteId && !formData.agentesComerciales?.includes(agenteId)) {
                      setFormData(prev => ({
                        ...prev,
                        agentesComerciales: [...(prev.agentesComerciales || []), agenteId]
                      }))
                    }
                  }}
                  disabled={loadingAgentes}
                >
                  <option value="">
                    {loadingAgentes ? 'Cargando...' : 'Seleccionar agente...'}
                  </option>
                  {agentesDisponibles
                    .filter(a => !formData.agentesComerciales?.includes(a._id))
                    .map(agente => (
                      <option key={agente._id} value={agente._id}>
                        {agente.codigo} - {agente.nombre} {agente.apellidos || ''}
                      </option>
                    ))
                  }
                </select>
                <p className="text-xs text-muted-foreground">
                  Un cliente puede tener varios agentes comerciales asignados
                </p>
              </div>

              {/* Lista de agentes asignados */}
              {formData.agentesComerciales && formData.agentesComerciales.length > 0 && (
                <div className="space-y-2">
                  <Label>Agentes Asignados</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.agentesComerciales.map(agenteId => {
                      const agente = agentesDisponibles.find(a => a._id === agenteId)
                      return (
                        <Badge key={agenteId} variant="secondary" className="flex items-center gap-1 pr-1">
                          <span>
                            {agente
                              ? `${agente.codigo} - ${agente.nombre}`
                              : agenteId
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                agentesComerciales: prev.agentesComerciales?.filter(id => id !== agenteId)
                              }))
                            }}
                            className="ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Persona de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Persona de Contacto Principal</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.personaContacto?.nombre || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personaContacto: {
                      ...prev.personaContacto,
                      nombre: e.target.value,
                    }
                  }))}
                  placeholder="Nombre del contacto"
                />
              </div>

              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={formData.personaContacto?.cargo || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personaContacto: {
                      ...prev.personaContacto,
                      nombre: prev.personaContacto?.nombre || '',
                      cargo: e.target.value,
                    }
                  }))}
                  placeholder="Director, Gerente..."
                />
              </div>

              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input
                  value={formData.personaContacto?.telefono || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personaContacto: {
                      ...prev.personaContacto,
                      nombre: prev.personaContacto?.nombre || '',
                      telefono: e.target.value,
                    }
                  }))}
                  placeholder="Telefono directo"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.personaContacto?.email || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personaContacto: {
                      ...prev.personaContacto,
                      nombre: prev.personaContacto?.nombre || '',
                      email: e.target.value,
                    }
                  }))}
                  placeholder="Email directo"
                />
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="observaciones"
                value={formData.observaciones || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Observaciones adicionales sobre el cliente..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* BOTONES DE ACCION */}
      {/* ============================================ */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  )
}

// Exportar como default para compatibilidad
export default ClienteForm
