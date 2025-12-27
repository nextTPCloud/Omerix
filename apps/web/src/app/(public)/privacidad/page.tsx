'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacidadPage() {
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
          Politica de Privacidad
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Ultima actualizacion: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Informacion que Recopilamos</h2>
            <p className="text-slate-600 mb-4">
              En Tralok recopilamos informacion que usted nos proporciona directamente, incluyendo:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Datos de registro: nombre, email, telefono, datos fiscales de la empresa</li>
              <li>Datos de facturacion: direccion, NIF/CIF, informacion de pago</li>
              <li>Datos de uso: registros de actividad, preferencias de usuario</li>
              <li>Comunicaciones: emails, tickets de soporte, feedback</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Uso de la Informacion</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos la informacion recopilada para:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Proporcionar, mantener y mejorar nuestros servicios</li>
              <li>Procesar transacciones y enviar notificaciones relacionadas</li>
              <li>Enviar comunicaciones tecnicas, actualizaciones y alertas de seguridad</li>
              <li>Responder a comentarios, preguntas y solicitudes de soporte</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Comparticion de Datos</h2>
            <p className="text-slate-600 mb-4">
              No vendemos ni alquilamos su informacion personal. Solo compartimos datos con:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Proveedores de servicios que nos ayudan a operar (pasarelas de pago, hosting)</li>
              <li>Autoridades fiscales cuando sea legalmente requerido</li>
              <li>En caso de fusion, adquisicion o venta de activos de la empresa</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Seguridad de los Datos</h2>
            <p className="text-slate-600">
              Implementamos medidas de seguridad tecnicas y organizativas para proteger sus datos,
              incluyendo encriptacion SSL/TLS, acceso restringido, copias de seguridad regulares
              y monitorizacion de seguridad continua.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Sus Derechos (RGPD)</h2>
            <p className="text-slate-600 mb-4">
              Bajo el Reglamento General de Proteccion de Datos (RGPD), usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Acceder a sus datos personales</li>
              <li>Rectificar datos inexactos</li>
              <li>Solicitar la eliminacion de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Solicitar la portabilidad de sus datos</li>
              <li>Retirar su consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Retencion de Datos</h2>
            <p className="text-slate-600">
              Conservamos sus datos personales mientras su cuenta este activa o segun sea necesario
              para proporcionarle servicios. Tambien conservamos y utilizamos su informacion
              segun sea necesario para cumplir con obligaciones legales (por ejemplo, requisitos
              fiscales de 4-6 anos).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Cookies</h2>
            <p className="text-slate-600">
              Utilizamos cookies esenciales para el funcionamiento del servicio y cookies
              de preferencias para recordar su configuracion. Puede gestionar sus preferencias
              de cookies desde la configuracion de su navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Contacto</h2>
            <p className="text-slate-600">
              Para ejercer sus derechos o realizar consultas sobre esta politica, contacte con
              nuestro Delegado de Proteccion de Datos:
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">
                <strong>Email:</strong> privacidad@tralok.com<br />
                <strong>Direccion:</strong> Calle Ejemplo 123, 28001 Madrid, Espana<br />
                <strong>Telefono:</strong> +34 912 345 678
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Cambios en esta Politica</h2>
            <p className="text-slate-600">
              Podemos actualizar esta politica periodicamente. Le notificaremos cualquier cambio
              material publicando la nueva politica en esta pagina y, si es necesario,
              enviandole un email.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
