'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, Calendar, Percent, Loader2, ExternalLink, Tag } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Importar servicios
import { terminosPagoService } from '@/services/terminos-pago.service'
import { formasPagoService } from '@/services/formas-pago.service'
import { tarifasService } from '@/services/tarifas.service'
import { TerminoPago } from '@/types/termino-pago.types'
import { FormaPago } from '@/types/forma-pago.types'
import { ITarifa } from '@/types/tarifa.types'

// Tipo para tarifas activas (subset de ITarifa devuelto por getActivas)
type TarifaActiva = Pick<ITarifa, '_id' | 'codigo' | 'nombre' | 'tipo'>

interface CondicionesPago {
  formaPagoId?: string
  terminoPagoId?: string
  tarifaId?: string
  descuentoGeneral?: number
  limiteCredito?: number
}

interface TabCondicionesPagoProps {
  condiciones: CondicionesPago
  onChange: (condiciones: CondicionesPago) => void
  readOnly?: boolean
}

export function TabCondicionesPago({
  condiciones,
  onChange,
  readOnly = false,
}: TabCondicionesPagoProps) {
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [terminosPago, setTerminosPago] = useState<TerminoPago[]>([])
  const [tarifas, setTarifas] = useState<TarifaActiva[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos de formas, terminos de pago y tarifas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)
        const [formasRes, terminosRes, tarifasRes] = await Promise.all([
          formasPagoService.getActivas(),
          terminosPagoService.getActivos(),
          tarifasService.getActivas(),
        ])

        if (formasRes.success) {
          setFormasPago(formasRes.data)
        }
        if (terminosRes.success) {
          setTerminosPago(terminosRes.data)
        }
        if (tarifasRes.success) {
          setTarifas(tarifasRes.data || [])
        }
      } catch (error) {
        console.error('Error al cargar condiciones de pago:', error)
        toast.error('Error al cargar las opciones de pago')
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const handleChange = (field: keyof CondicionesPago, value: string | number | undefined) => {
    onChange({
      ...condiciones,
      [field]: value,
    })
  }

  // Obtener forma de pago seleccionada
  const formaPagoSeleccionada = formasPago.find(f => f._id === condiciones.formaPagoId)
  const terminoPagoSeleccionado = terminosPago.find(t => t._id === condiciones.terminoPagoId)
  const tarifaSeleccionada = tarifas.find(t => t._id === condiciones.tarifaId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Forma de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Forma de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Forma de pago preferida</Label>
            <Select
              value={condiciones.formaPagoId || ''}
              onValueChange={(value) => handleChange('formaPagoId', value || undefined)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una forma de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin especificar</SelectItem>
                {formasPago.map((forma) => (
                  <SelectItem key={forma._id} value={forma._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: forma.color || '#3B82F6' }}
                      />
                      {forma.nombre}
                      {forma.comision && forma.comision > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({forma.comision}% comision)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview de forma de pago seleccionada */}
          {formaPagoSeleccionada && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: formaPagoSeleccionada.color || '#3B82F6' }}
                  >
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{formaPagoSeleccionada.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formaPagoSeleccionada.tipoLabel || formaPagoSeleccionada.tipo}
                    </p>
                  </div>
                </div>
                <Link href={`/formas-pago/${formaPagoSeleccionada._id}`} target="_blank">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {formaPagoSeleccionada.descripcion && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formaPagoSeleccionada.descripcion}
                </p>
              )}
              {formaPagoSeleccionada.requiereDatosBancarios && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Requiere datos bancarios
                </Badge>
              )}
            </div>
          )}

          {formasPago.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No hay formas de pago configuradas</p>
              <Link href="/formas-pago/nuevo">
                <Button type="button" variant="link" size="sm">
                  Crear forma de pago
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Termino de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5" />
            Termino de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Condiciones de vencimiento</Label>
            <Select
              value={condiciones.terminoPagoId || ''}
              onValueChange={(value) => handleChange('terminoPagoId', value || undefined)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un termino de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin especificar</SelectItem>
                {terminosPago.map((termino) => (
                  <SelectItem key={termino._id} value={termino._id}>
                    <div className="flex items-center gap-2">
                      {termino.nombre}
                      <span className="text-xs text-muted-foreground">
                        ({termino.vencimientos.length} vencimiento{termino.vencimientos.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview de termino de pago seleccionado */}
          {terminoPagoSeleccionado && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{terminoPagoSeleccionado.nombre}</p>
                  {terminoPagoSeleccionado.descripcion && (
                    <p className="text-xs text-muted-foreground">
                      {terminoPagoSeleccionado.descripcion}
                    </p>
                  )}
                </div>
                <Link href={`/terminos-pago/${terminoPagoSeleccionado._id}`} target="_blank">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {terminoPagoSeleccionado.vencimientos.map((v, idx) => (
                  <Badge key={idx} variant="outline" className="font-mono text-xs">
                    {v.porcentaje}% a {v.dias === 0 ? 'contado' : `${v.dias} dias`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {terminosPago.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No hay terminos de pago configurados</p>
              <Link href="/terminos-pago/nuevo">
                <Button type="button" variant="link" size="sm">
                  Crear termino de pago
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarifa de Precios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-5 w-5" />
            Tarifa de Precios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tarifa asignada al cliente</Label>
            <Select
              value={condiciones.tarifaId || ''}
              onValueChange={(value) => handleChange('tarifaId', value || undefined)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin tarifa (precio de producto)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin tarifa (usar precio del producto)</SelectItem>
                {tarifas.map((tarifa) => (
                  <SelectItem key={tarifa._id} value={tarifa._id}>
                    <div className="flex items-center gap-2">
                      {tarifa.nombre}
                      <span className="text-xs text-muted-foreground">
                        ({tarifa.tipo === 'porcentaje' ? 'descuento %' : 'precios fijos'})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              La tarifa define precios especiales para este cliente en presupuestos, pedidos y facturas
            </p>
          </div>

          {/* Preview de tarifa seleccionada */}
          {tarifaSeleccionada && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{tarifaSeleccionada.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {tarifaSeleccionada.tipo === 'porcentaje'
                        ? 'Tarifa con descuento porcentual'
                        : 'Tarifa con precios fijos'}
                    </p>
                  </div>
                </div>
                <Link href={`/tarifas/${tarifaSeleccionada._id}`} target="_blank">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ver detalle de la tarifa para más información
              </p>
            </div>
          )}

          {tarifas.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No hay tarifas configuradas</p>
              <Link href="/tarifas/nuevo">
                <Button type="button" variant="link" size="sm">
                  Crear tarifa
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descuento y Credito */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-5 w-5" />
            Descuento y Credito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Descuento general (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="0.00"
                value={condiciones.descuentoGeneral || ''}
                onChange={(e) => handleChange(
                  'descuentoGeneral',
                  e.target.value ? Number(e.target.value) : undefined
                )}
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground">
                Descuento aplicado automaticamente en facturas
              </p>
            </div>

            <div className="space-y-2">
              <Label>Limite de credito</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Sin limite"
                  value={condiciones.limiteCredito || ''}
                  onChange={(e) => handleChange(
                    'limiteCredito',
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  disabled={readOnly}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  EUR
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Importe maximo de credito permitido
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {(formaPagoSeleccionada || terminoPagoSeleccionado || tarifaSeleccionada || condiciones.descuentoGeneral || condiciones.limiteCredito) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Resumen de condiciones:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {formaPagoSeleccionada && (
                <li>Forma de pago: <span className="font-medium text-foreground">{formaPagoSeleccionada.nombre}</span></li>
              )}
              {terminoPagoSeleccionado && (
                <li>Termino: <span className="font-medium text-foreground">{terminoPagoSeleccionado.nombre}</span></li>
              )}
              {tarifaSeleccionada && (
                <li>Tarifa: <span className="font-medium text-foreground">{tarifaSeleccionada.nombre}</span></li>
              )}
              {condiciones.descuentoGeneral && condiciones.descuentoGeneral > 0 && (
                <li>Descuento: <span className="font-medium text-foreground">{condiciones.descuentoGeneral}%</span></li>
              )}
              {condiciones.limiteCredito && condiciones.limiteCredito > 0 && (
                <li>Limite credito: <span className="font-medium text-foreground">{condiciones.limiteCredito.toLocaleString('es-ES')} EUR</span></li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
