'use client'

import React, { useState, useEffect } from 'react'
import {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  DireccionExtendidaProveedor,
  CuentaBancariaProveedor,
  PersonaContactoProveedor,
  TIPOS_PROVEEDOR,
} from '@/types/proveedor.types'
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
  Star,
  Truck,
  Briefcase,
} from 'lucide-react'

// Importar componentes de tabs reutilizables de clientes
import { TabDirecciones } from '@/components/clientes/tabs/TabDirecciones'
import { TabCuentasBancarias } from '@/components/clientes/tabs/TabCuentasBancarias'
import { TabCondicionesPago } from '@/components/clientes/tabs/TabCondicionesPago'

interface ProveedorFormProps {
  initialData?: Proveedor
  onSubmit: (data: CreateProveedorDTO | UpdateProveedorDTO) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function ProveedorForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: ProveedorFormProps) {
  const [activeTab, setActiveTab] = useState('datos')

  // Estado del formulario
  const [formData, setFormData] = useState<CreateProveedorDTO>({
    tipoProveedor: 'empresa',
    nombre: '',
    nif: '',
    activo: true,
    direcciones: [],
    cuentasBancarias: [],
  })

  // Cargar datos iniciales si existen
  useEffect(() => {
    if (initialData) {
      setFormData({
        tipoProveedor: initialData.tipoProveedor,
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        nombreComercial: initialData.nombreComercial,
        nif: initialData.nif,
        email: initialData.email,
        telefono: initialData.telefono,
        movil: initialData.movil,
        fax: initialData.fax,
        web: initialData.web,
        // Direcciones
        direcciones: initialData.direcciones || [],
        direccion: initialData.direccion,
        // Cuentas bancarias
        cuentasBancarias: initialData.cuentasBancarias || [],
        iban: initialData.iban,
        swift: initialData.swift,
        // Condiciones comerciales
        formaPagoId: initialData.formaPagoId,
        terminoPagoId: initialData.terminoPagoId,
        diasPago: initialData.diasPago,
        descuentoGeneral: initialData.descuentoGeneral,
        portesMinimosPedido: initialData.portesMinimosPedido,
        portesImporte: initialData.portesImporte,
        // Contactos
        personaContacto: initialData.personaContacto,
        personasContacto: initialData.personasContacto,
        // Clasificacion
        categoriaId: initialData.categoriaId,
        zona: initialData.zona,
        // Evaluacion
        calificacion: initialData.calificacion,
        tiempoEntregaPromedio: initialData.tiempoEntregaPromedio,
        fiabilidad: initialData.fiabilidad,
        // Estado
        activo: initialData.activo,
        observaciones: initialData.observaciones,
        certificaciones: initialData.certificaciones,
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

  // Renderizar estrellas de calificacion
  const renderCalificacionSelector = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, calificacion: star }))}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-5 w-5 ${
                (formData.calificacion || 0) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        {formData.calificacion && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, calificacion: undefined }))}
            className="ml-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Quitar
          </button>
        )}
      </div>
    )
  }

  // Icono segun tipo de proveedor
  const getTipoIcon = () => {
    switch (formData.tipoProveedor) {
      case 'empresa':
        return <Building2 className="h-5 w-5" />
      case 'autonomo':
        return <Briefcase className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="datos" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
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
          {/* Tipo de Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTipoIcon()}
                Tipo de Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoProveedor">Tipo *</Label>
                <select
                  id="tipoProveedor"
                  name="tipoProveedor"
                  value={formData.tipoProveedor}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {TIPOS_PROVEEDOR.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="activo" className="cursor-pointer">Proveedor Activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
              </div>

              <div className="space-y-2 p-3 border rounded-lg">
                <Label>Calificacion</Label>
                {renderCalificacionSelector()}
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
                    placeholder={mode === 'create' ? 'Ej: PROV-001 (vacio para autogenerar)' : 'Codigo del proveedor'}
                    disabled={mode === 'edit'}
                    className={mode === 'edit' ? 'bg-muted' : ''}
                  />
                  {mode === 'create' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Se generara automaticamente si se deja vacio
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
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  name="fax"
                  type="tel"
                  value={formData.fax || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
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
            direcciones={formData.direcciones as any || []}
            onChange={(direcciones) => setFormData(prev => ({ ...prev, direcciones: direcciones as any }))}
          />
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: CONDICIONES DE PAGO */}
        {/* ============================================ */}
        <TabsContent value="pagos" className="space-y-6 mt-6">
          <TabCondicionesPago
            condiciones={{
              formaPagoId: formData.formaPagoId,
              terminoPagoId: formData.terminoPagoId,
              descuentoGeneral: formData.descuentoGeneral,
              limiteCredito: undefined, // Los proveedores no tienen limite de credito
            }}
            onChange={(condiciones) => setFormData(prev => ({
              ...prev,
              formaPagoId: condiciones.formaPagoId,
              terminoPagoId: condiciones.terminoPagoId,
              descuentoGeneral: condiciones.descuentoGeneral,
            }))}
          />

          {/* Campos adicionales especificos de proveedores */}
          <Card>
            <CardHeader>
              <CardTitle>Condiciones de Compra</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diasPago">Dias de Pago</Label>
                <Input
                  id="diasPago"
                  name="diasPago"
                  type="number"
                  min="0"
                  value={formData.diasPago || ''}
                  onChange={handleChange}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Dias para realizar el pago
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portesMinimosPedido">Minimo Pedido sin Portes</Label>
                <Input
                  id="portesMinimosPedido"
                  name="portesMinimosPedido"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.portesMinimosPedido || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portesImporte">Importe de Portes</Label>
                <Input
                  id="portesImporte"
                  name="portesImporte"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.portesImporte || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: CUENTAS BANCARIAS */}
        {/* ============================================ */}
        <TabsContent value="bancarios" className="mt-6">
          <TabCuentasBancarias
            cuentas={formData.cuentasBancarias as any || []}
            nombreTitularDefault={formData.nombre}
            onChange={(cuentas) => setFormData(prev => ({ ...prev, cuentasBancarias: cuentas as any }))}
          />
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: OTROS */}
        {/* ============================================ */}
        <TabsContent value="otros" className="space-y-6 mt-6">
          {/* Evaluacion del Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Evaluacion del Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiempoEntregaPromedio">Tiempo Entrega Promedio (dias)</Label>
                <Input
                  id="tiempoEntregaPromedio"
                  name="tiempoEntregaPromedio"
                  type="number"
                  min="0"
                  value={formData.tiempoEntregaPromedio || ''}
                  onChange={handleChange}
                  placeholder="Ej: 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiabilidad">Fiabilidad (%)</Label>
                <Input
                  id="fiabilidad"
                  name="fiabilidad"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fiabilidad || ''}
                  onChange={handleChange}
                  placeholder="Ej: 95"
                />
                <p className="text-xs text-muted-foreground">
                  Porcentaje de pedidos entregados correctamente
                </p>
              </div>

              <div className="space-y-2">
                <Label>Certificaciones</Label>
                <Input
                  value={formData.certificaciones?.join(', ') || ''}
                  onChange={(e) => {
                    const certificaciones = e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    setFormData(prev => ({ ...prev, certificaciones }))
                  }}
                  placeholder="ISO 9001, ISO 14001..."
                />
                <p className="text-xs text-muted-foreground">
                  Separar con comas
                </p>
              </div>
            </CardContent>
          </Card>

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
                  placeholder="Ej: Nacional, Europa, Asia..."
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
                  placeholder="Premium, Urgente, Local..."
                />
                <p className="text-xs text-muted-foreground">
                  Separar con comas
                </p>
              </div>
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
                  placeholder="Director, Comercial..."
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

              <div className="md:col-span-2 space-y-2">
                <Label>Departamento</Label>
                <Input
                  value={formData.personaContacto?.departamento || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personaContacto: {
                      ...prev.personaContacto,
                      nombre: prev.personaContacto?.nombre || '',
                      departamento: e.target.value,
                    }
                  }))}
                  placeholder="Compras, Comercial, Administracion..."
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
                placeholder="Observaciones adicionales sobre el proveedor..."
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
          {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear Proveedor'}
        </Button>
      </div>
    </form>
  )
}

export default ProveedorForm
