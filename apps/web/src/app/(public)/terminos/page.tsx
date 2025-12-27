'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegacion */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Terminos y Condiciones de Uso
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Ultima actualizacion: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Aceptacion de los Terminos</h2>
            <p className="text-slate-600">
              Al acceder y utilizar Tralok ERP (el &quot;Servicio&quot;), usted acepta estar vinculado por estos
              Terminos y Condiciones. Si no esta de acuerdo con alguna parte de estos terminos,
              no podra acceder al Servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Descripcion del Servicio</h2>
            <p className="text-slate-600 mb-4">
              Tralok es una plataforma de software como servicio (SaaS) que proporciona herramientas
              de gestion empresarial, incluyendo pero no limitado a:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Gestion de ventas y facturacion</li>
              <li>Control de inventario y almacenes</li>
              <li>Gestion de compras y proveedores</li>
              <li>Contabilidad y tesoreria</li>
              <li>Gestion de recursos humanos</li>
              <li>Informes y estadisticas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Registro y Cuenta</h2>
            <p className="text-slate-600 mb-4">
              Para usar el Servicio debe:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Proporcionar informacion veraz, precisa y completa durante el registro</li>
              <li>Mantener la seguridad de su contrasena y cuenta</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              <li>Ser mayor de 18 anos o tener capacidad legal para contratar</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Planes y Facturacion</h2>
            <p className="text-slate-600 mb-4">
              <strong>4.1 Periodo de Prueba:</strong> Ofrecemos 30 dias de prueba gratuita.
              No se requiere tarjeta de credito para el periodo de prueba.
            </p>
            <p className="text-slate-600 mb-4">
              <strong>4.2 Suscripcion:</strong> Al finalizar el periodo de prueba, debera seleccionar
              un plan de pago para continuar usando el Servicio.
            </p>
            <p className="text-slate-600 mb-4">
              <strong>4.3 Renovacion:</strong> Las suscripciones se renuevan automaticamente.
              Puede cancelar en cualquier momento desde su panel de configuracion.
            </p>
            <p className="text-slate-600">
              <strong>4.4 Reembolsos:</strong> Ofrecemos garantia de devolucion de 14 dias
              desde la primera compra. Contacte con soporte para solicitar un reembolso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Uso Aceptable</h2>
            <p className="text-slate-600 mb-4">
              Usted se compromete a NO utilizar el Servicio para:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Violar cualquier ley aplicable</li>
              <li>Transmitir virus u otro codigo danino</li>
              <li>Intentar acceder sin autorizacion a otros sistemas</li>
              <li>Interferir con el funcionamiento del Servicio</li>
              <li>Suplantar la identidad de otra persona o empresa</li>
              <li>Almacenar o transmitir contenido ilegal</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Propiedad Intelectual</h2>
            <p className="text-slate-600">
              El Servicio y su contenido original, caracteristicas y funcionalidad son propiedad
              de Tralok y estan protegidos por leyes de propiedad intelectual. No puede copiar,
              modificar, distribuir o crear obras derivadas sin nuestro consentimiento previo por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Datos del Usuario</h2>
            <p className="text-slate-600 mb-4">
              <strong>7.1 Propiedad:</strong> Usted conserva todos los derechos sobre los datos
              que introduce en el Servicio.
            </p>
            <p className="text-slate-600 mb-4">
              <strong>7.2 Licencia:</strong> Nos otorga una licencia limitada para usar sus datos
              unicamente para proporcionarle el Servicio.
            </p>
            <p className="text-slate-600">
              <strong>7.3 Copias de Seguridad:</strong> Realizamos copias de seguridad periodicas,
              pero recomendamos que mantenga sus propias copias de datos importantes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Disponibilidad del Servicio</h2>
            <p className="text-slate-600">
              Nos esforzamos por mantener una disponibilidad del 99.9%. Sin embargo, el Servicio
              puede no estar disponible temporalmente debido a mantenimiento programado,
              actualizaciones o circunstancias fuera de nuestro control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Limitacion de Responsabilidad</h2>
            <p className="text-slate-600">
              En la maxima medida permitida por la ley, Tralok no sera responsable de danos
              indirectos, incidentales, especiales o consecuentes, incluyendo perdida de beneficios,
              datos, uso u otras perdidas intangibles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">10. Cancelacion</h2>
            <p className="text-slate-600 mb-4">
              <strong>10.1 Por el Usuario:</strong> Puede cancelar su cuenta en cualquier momento.
              Al cancelar, perdera acceso al Servicio al final del periodo de facturacion.
            </p>
            <p className="text-slate-600">
              <strong>10.2 Por Tralok:</strong> Podemos suspender o terminar su cuenta si viola
              estos Terminos o por falta de pago.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">11. Ley Aplicable</h2>
            <p className="text-slate-600">
              Estos Terminos se regiran por las leyes de Espana. Cualquier disputa sera resuelta
              en los tribunales de Madrid, Espana.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">12. Contacto</h2>
            <p className="text-slate-600">
              Si tiene preguntas sobre estos Terminos, contactenos:
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">
                <strong>Email:</strong> legal@tralok.com<br />
                <strong>Direccion:</strong> Calle Ejemplo 123, 28001 Madrid, Espana<br />
                <strong>Telefono:</strong> +34 912 345 678
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">13. Modificaciones</h2>
            <p className="text-slate-600">
              Nos reservamos el derecho de modificar estos Terminos en cualquier momento.
              Le notificaremos cambios significativos por email o mediante un aviso prominente
              en el Servicio.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
