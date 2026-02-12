"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Check, X, Lock, HelpCircle, ArrowRight } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// Datos de planes (precios con IVA incluido)
// Sincronizados con seed-plans.ts
const planes = [
  {
    slug: 'solo-fichaje',
    nombre: 'Solo Fichaje',
    descripcion: 'Control horario y fichajes',
    precioMensual: 15,
    precioAnual: 150,
    destacado: false,
    limites: {
      usuariosSimultaneos: 5,
      usuariosTotales: 10,
      facturasMes: 0,
      productosCatalogo: 0,
      almacenes: 0,
      clientes: 0,
      almacenamientoGB: 1
    },
    modulos: ['rrhh', 'calendarios'],
    soporte: 'Email',
    integraciones: false,
    api: false,
    esFichaje: true
  },
  {
    slug: 'starter',
    nombre: 'Starter',
    descripcion: 'Para autonomos que empiezan',
    precioMensual: 19,
    precioAnual: 190,
    destacado: false,
    limites: {
      usuariosSimultaneos: 1,
      usuariosTotales: 2,
      facturasMes: 100,
      productosCatalogo: 200,
      almacenes: 1,
      clientes: 200,
      almacenamientoGB: 2
    },
    modulos: ['clientes', 'productos', 'ventas', 'informes'],
    soporte: 'Email',
    integraciones: false,
    api: false
  },
  {
    slug: 'basico',
    nombre: 'Basico',
    descripcion: 'Ideal para autonomos y microempresas',
    precioMensual: 35,
    precioAnual: 349,
    destacado: false,
    limites: {
      usuariosSimultaneos: 2,
      usuariosTotales: 10,
      facturasMes: 200,
      productosCatalogo: 500,
      almacenes: 2,
      clientes: 500,
      almacenamientoGB: 5
    },
    modulos: ['clientes', 'productos', 'ventas', 'compras', 'inventario', 'informes'],
    soporte: 'Email',
    integraciones: false,
    api: false,
    nota: 'Puedes anadir usuarios extra por 5€/mes cada uno'
  },
  {
    slug: 'profesional',
    nombre: 'Profesional',
    descripcion: 'Para empresas en crecimiento',
    precioMensual: 99,
    precioAnual: 990,
    destacado: true,
    limites: {
      usuariosSimultaneos: 15,
      usuariosTotales: 30,
      facturasMes: 1000,
      productosCatalogo: 5000,
      almacenes: 5,
      clientes: 5000,
      almacenamientoGB: 20
    },
    modulos: ['clientes', 'productos', 'ventas', 'compras', 'inventario', 'informes', 'contabilidad', 'proyectos', 'crm', 'tpv', 'tesoreria', 'calendarios'],
    soporte: 'Email + Chat',
    integraciones: true,
    api: false
  },
  {
    slug: 'enterprise',
    nombre: 'Enterprise',
    descripcion: 'Para grandes organizaciones',
    precioMensual: 249,
    precioAnual: 2490,
    destacado: false,
    limites: {
      usuariosSimultaneos: -1,
      usuariosTotales: -1,
      facturasMes: -1,
      productosCatalogo: -1,
      almacenes: -1,
      clientes: -1,
      almacenamientoGB: 100
    },
    modulos: ['*'],
    soporte: 'Prioritario 24/7',
    integraciones: true,
    api: true
  }
]

// Lista de modulos para la tabla comparativa
interface ModuloInfo {
  slug: string
  nombre: string
  addon?: boolean
  proximamente?: boolean
}

const modulosInfo: ModuloInfo[] = [
  { slug: 'clientes', nombre: 'Clientes y Proveedores' },
  { slug: 'productos', nombre: 'Productos y Servicios' },
  { slug: 'ventas', nombre: 'Ventas (Facturas, Pedidos, Albaranes)' },
  { slug: 'compras', nombre: 'Compras' },
  { slug: 'inventario', nombre: 'Inventario y Stock' },
  { slug: 'informes', nombre: 'Informes y Estadisticas' },
  { slug: 'tesoreria', nombre: 'Tesoreria' },
  { slug: 'calendarios', nombre: 'Calendarios' },
  { slug: 'rrhh', nombre: 'Recursos Humanos / Fichaje', addon: true },
  { slug: 'tpv', nombre: 'TPV (Punto de Venta)', addon: true },
  { slug: 'proyectos', nombre: 'Proyectos / Servicios', addon: true },
  { slug: 'contabilidad', nombre: 'Contabilidad', addon: true },
  { slug: 'crm', nombre: 'CRM Completo', addon: true },
  { slug: 'restauracion', nombre: 'Restauracion (Salones, Comandas, Reservas)', addon: true },
  { slug: 'ecommerce', nombre: 'E-commerce (PrestaShop, WooCommerce)', addon: true },
  { slug: 'firmas', nombre: 'Firmas Digitales', addon: true },
  { slug: 'redes-sociales', nombre: 'Redes Sociales (Meta)', addon: true },
  { slug: 'google-calendar', nombre: 'Google Calendar', addon: true },
]

// Detalle de add-ons para la seccion informativa
const addonsDetalle = [
  {
    nombre: 'Restauracion',
    precio: '25€/mes',
    features: ['Gestion de salones y mesas', 'Comandas de cocina (KDS)', 'Comandero digital', 'Reservas + Restoo.me', 'Kioskos autoservicio', 'Alergenos y modificadores'],
  },
  {
    nombre: 'E-commerce',
    precio: '15€/mes',
    features: ['Conector PrestaShop', 'Conector WooCommerce', 'Sync productos y stock', 'Importacion de pedidos'],
  },
  {
    nombre: 'Firmas Digitales',
    precio: '8€/mes',
    features: ['Firma digital documentos', 'Solicitudes a terceros', 'Firma desde movil', 'Enlace publico para firmar'],
  },
  {
    nombre: 'CRM',
    precio: '12€/mes',
    features: ['Pipeline de ventas', 'Seguimiento de leads', 'Actividades y tareas', 'Informes comerciales'],
  },
  {
    nombre: 'Contabilidad',
    precio: '15€/mes',
    features: ['Plan General Contable', 'Asientos automaticos', 'Balances y libros', 'Modelo 303/390'],
  },
]

// FAQ
const faqs = [
  {
    pregunta: 'Puedo cambiar de plan en cualquier momento?',
    respuesta: 'Si, puedes cambiar de plan en cualquier momento. Si subes de plan, el cambio es inmediato y se te cobrara la diferencia prorrateada. Si bajas de plan, el cambio se aplicara en tu proxima fecha de renovacion.'
  },
  {
    pregunta: 'Puedo probar antes de comprar?',
    respuesta: 'Si, tenemos un modo sandbox donde puedes explorar todas las funcionalidades con datos de ejemplo. Accede desde la pagina principal para ver como funciona el sistema sin necesidad de registrarte.'
  },
  {
    pregunta: 'Puedo anadir usuarios adicionales?',
    respuesta: 'Si, puedes anadir usuarios adicionales a tu plan por 5€/usuario/mes. Los usuarios adicionales tienen acceso completo a todas las funcionalidades de tu plan.'
  },
  {
    pregunta: 'Que metodos de pago aceptais?',
    respuesta: 'Aceptamos tarjetas de credito/debito (Visa, Mastercard, American Express) y PayPal. Para el plan Enterprise tambien ofrecemos pago por transferencia bancaria.'
  },
  {
    pregunta: 'Ofreceis descuentos para ONGs o educacion?',
    respuesta: 'Si, ofrecemos un 30% de descuento para organizaciones sin animo de lucro y centros educativos. Contacta con nuestro equipo de ventas para mas informacion.'
  },
  {
    pregunta: 'Puedo cancelar en cualquier momento?',
    respuesta: 'Si, puedes cancelar tu suscripcion en cualquier momento. No hay compromisos de permanencia. Si cancelas, tendras acceso hasta el final del periodo de facturacion actual.'
  }
]

function PlanCard({ plan, anual }: { plan: typeof planes[0], anual: boolean }) {
  const precio = anual ? plan.precioAnual : plan.precioMensual
  const precioMensualEquivalente = anual ? Math.round(plan.precioAnual / 12) : plan.precioMensual

  return (
    <Card className={`relative flex flex-col ${plan.destacado ? 'border-blue-500 border-2 shadow-xl' : 'border-slate-200'}`}>
      {plan.destacado && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4">
          Mas popular
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
        <CardDescription className="text-base">{plan.descripcion}</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col">
        {/* Precio */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-slate-900">{precioMensualEquivalente}€</span>
            <span className="text-slate-500">/mes</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">IVA incluido</p>
          {anual && (
            <p className="text-sm text-green-600 mt-1">
              Facturado anualmente ({precio}€/ano)
            </p>
          )}
        </div>

        {/* Limites principales */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Sesiones simultaneas</span>
            <span className="font-medium">
              {plan.limites.usuariosSimultaneos === -1 ? 'Ilimitadas' : plan.limites.usuariosSimultaneos}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Usuarios totales</span>
            <span className="font-medium">
              {plan.limites.usuariosTotales === -1 ? 'Ilimitados' : plan.limites.usuariosTotales}
            </span>
          </div>
          {'esFichaje' in plan && plan.esFichaje ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Control horario</span>
                <span className="font-medium text-green-600">Incluido</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Fichajes</span>
                <span className="font-medium text-green-600">Incluido</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Calendarios</span>
                <span className="font-medium text-green-600">Incluido</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Facturas/mes</span>
                <span className="font-medium">
                  {plan.limites.facturasMes === -1 ? 'Ilimitadas' : plan.limites.facturasMes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Productos</span>
                <span className="font-medium">
                  {plan.limites.productosCatalogo === -1 ? 'Ilimitados' : plan.limites.productosCatalogo.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Almacenes</span>
                <span className="font-medium">
                  {plan.limites.almacenes === -1 ? 'Ilimitados' : plan.limites.almacenes}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Almacenamiento</span>
            <span className="font-medium">{plan.limites.almacenamientoGB} GB</span>
          </div>
          {'nota' in plan && plan.nota && (
            <p className="text-xs text-blue-600 mt-2 italic">{plan.nota}</p>
          )}
        </div>

        {/* Features destacadas */}
        <div className="space-y-2 mb-6 flex-grow">
          <div className="flex items-center gap-2 text-sm">
            {plan.integraciones ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-slate-300" />
            )}
            <span className={plan.integraciones ? 'text-slate-700' : 'text-slate-400'}>
              {plan.integraciones ? 'PrestaShop, WooCommerce, Restoo.me' : 'Integraciones externas'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {plan.api ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-slate-300" />
            )}
            <span className={plan.api ? 'text-slate-700' : 'text-slate-400'}>
              Acceso API
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-slate-700">Soporte {plan.soporte}</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/register?plan=${plan.slug}`} className="mt-auto">
          <Button
            className={`w-full ${plan.destacado ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
            variant={plan.destacado ? 'default' : 'outline'}
            size="lg"
          >
            {plan.slug === 'enterprise' ? 'Contactar ventas' : 'Contratar'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function TablaComparativa() {
  const tieneModulo = (plan: typeof planes[0], modulo: string) => {
    if (plan.modulos.includes('*')) return true
    return plan.modulos.includes(modulo)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-4 px-4 font-semibold text-slate-900">Caracteristica</th>
            {planes.map(plan => (
              <th key={plan.slug} className={`text-center py-4 px-4 font-semibold ${plan.destacado ? 'text-blue-600' : 'text-slate-900'}`}>
                {plan.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Limites */}
          <tr className="bg-slate-50">
            <td colSpan={6} className="py-3 px-4 font-semibold text-slate-700">Limites</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Usuarios simultaneos</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.usuariosSimultaneos === -1 ? 'Ilimitados' : plan.limites.usuariosSimultaneos}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Usuarios totales</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.usuariosTotales === -1 ? 'Ilimitados' : plan.limites.usuariosTotales}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Facturas/mes</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.facturasMes === -1 ? 'Ilimitadas' : plan.limites.facturasMes.toLocaleString()}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Productos en catalogo</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.productosCatalogo === -1 ? 'Ilimitados' : plan.limites.productosCatalogo.toLocaleString()}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Almacenes</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.almacenes === -1 ? 'Ilimitados' : plan.limites.almacenes}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Clientes</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.clientes === -1 ? 'Ilimitados' : plan.limites.clientes.toLocaleString()}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Almacenamiento</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.limites.almacenamientoGB} GB
              </td>
            ))}
          </tr>

          {/* Modulos */}
          <tr className="bg-slate-50">
            <td colSpan={6} className="py-3 px-4 font-semibold text-slate-700">Modulos</td>
          </tr>
          {modulosInfo.map(modulo => (
            <tr key={modulo.slug} className="border-b border-slate-100">
              <td className="py-3 px-4 text-slate-600">
                <div className="flex items-center gap-2">
                  {modulo.nombre}
                  {modulo.proximamente && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Proximamente
                    </Badge>
                  )}
                  {modulo.addon && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      Add-on
                    </Badge>
                  )}
                </div>
              </td>
              {planes.map(plan => (
                <td key={plan.slug} className="text-center py-3 px-4">
                  {modulo.proximamente ? (
                    <Lock className="h-4 w-4 text-slate-300 mx-auto" />
                  ) : tieneModulo(plan, modulo.slug) ? (
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  ) : modulo.addon ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm text-blue-600">+Add-on</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Disponible como add-on por un coste adicional</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <X className="h-5 w-5 text-slate-300 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}

          {/* Soporte y extras */}
          <tr className="bg-slate-50">
            <td colSpan={6} className="py-3 px-4 font-semibold text-slate-700">Soporte y extras</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Tipo de soporte</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.soporte}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Integraciones (PrestaShop, WooCommerce, Restoo)</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.integraciones ? (
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-slate-300 mx-auto" />
                )}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-3 px-4 text-slate-600">Acceso API</td>
            {planes.map(plan => (
              <td key={plan.slug} className="text-center py-3 px-4">
                {plan.api ? (
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-slate-300 mx-auto" />
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function PlanesPage() {
  const [anual, setAnual] = useState(false)

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Planes y precios
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Elige el plan que mejor se adapte a tu negocio. Prueba el sandbox antes de decidir.
          </p>

          {/* Toggle mensual/anual */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!anual ? 'text-slate-900' : 'text-slate-500'}`}>
              Mensual
            </span>
            <Switch
              checked={anual}
              onCheckedChange={setAnual}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className={`text-sm font-medium ${anual ? 'text-slate-900' : 'text-slate-500'}`}>
              Anual
            </span>
            {anual && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Ahorra ~17%
              </Badge>
            )}
          </div>
        </div>

        {/* Cards de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-20">
          {planes.map(plan => (
            <PlanCard key={plan.slug} plan={plan} anual={anual} />
          ))}
        </div>

        {/* Tabla comparativa */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Comparativa detallada
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <TablaComparativa />
          </div>
        </div>

        {/* Add-ons destacados */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
            Amplia tu plan con add-ons
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
            Anade funcionalidades avanzadas a cualquier plan. Activa y desactiva cuando quieras.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {addonsDetalle.map((addon) => (
              <Card key={addon.nombre} className="border-purple-200 bg-purple-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{addon.nombre}</CardTitle>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">{addon.precio}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {addon.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Preguntas frecuentes
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-slate-200 rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-medium text-slate-900 hover:no-underline">
                  {faq.pregunta}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA final */}
        <div className="text-center mt-16">
          <p className="text-slate-600 mb-4">
            Tienes dudas? Contacta con nuestro equipo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Contratar plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contacto">
              <Button size="lg" variant="outline" className="px-8">
                Hablar con ventas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
