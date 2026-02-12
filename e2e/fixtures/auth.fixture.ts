import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import { WEB_ADMIN, WEB_SUPERADMIN } from './test-data'

/**
 * Fixture de autenticación para Web ERP
 * Proporciona páginas ya autenticadas como admin o superadmin
 *
 * Estrategia:
 * 1. Intenta login via API (más rápido y fiable que UI)
 * 2. Si la API falla, usa tokens JWT mock + intercepta API calls
 * 3. Usa addInitScript para que localStorage se configure ANTES de que Next.js hidrate
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Crear JWT mock en Node.js (base64url compatible con decodeJWT del frontend)
function createMockJWT(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 horas
  })).toString('base64url')
  return `${header}.${body}.e2e-mock-signature`
}

// Datos de usuario mock
const MOCK_ADMIN_USER = {
  id: 'e2e-admin-id',
  nombre: 'Admin',
  apellidos: 'Test',
  email: WEB_ADMIN.email,
  rol: 'admin',
  empresaId: 'e2e-empresa-id',
  twoFactorEnabled: false,
}

const MOCK_SUPERADMIN_USER = {
  id: 'e2e-superadmin-id',
  nombre: 'Super',
  apellidos: 'Admin',
  email: WEB_SUPERADMIN.email,
  rol: 'superadmin',
  empresaId: 'e2e-empresa-id',
  twoFactorEnabled: false,
}

// Respuesta mock de licencia Enterprise (todos los módulos)
const MOCK_LICENSE_RESPONSE = {
  success: true,
  data: {
    licencia: {
      _id: 'e2e-licencia-id',
      empresaId: 'e2e-empresa-id',
      estado: 'activa',
      esTrial: false,
      addOns: [
        { slug: 'rrhh', activo: true },
        { slug: 'contabilidad', activo: true },
        { slug: 'tpv', activo: true },
        { slug: 'proyectos', activo: true },
        { slug: 'crm', activo: true },
        { slug: 'restauracion', activo: true },
        { slug: 'ecommerce', activo: true },
        { slug: 'firmas-digitales', activo: true },
      ],
      usoActual: {
        usuariosActuales: 1,
        facturasEsteMes: 0,
        productosActuales: 0,
        almacenesActuales: 1,
        clientesActuales: 0,
        tpvsActuales: 0,
        almacenamientoUsadoGB: 0,
        llamadasAPIHoy: 0,
        emailsEsteMes: 0,
        smsEsteMes: 0,
        whatsappEsteMes: 0,
      },
    },
    plan: {
      _id: 'e2e-plan-id',
      nombre: 'Enterprise',
      slug: 'enterprise',
      modulosIncluidos: ['*'],
      limites: {
        usuariosTotales: -1,
        facturasMes: -1,
        productosCatalogo: -1,
        almacenes: -1,
        clientes: -1,
        tpvsActivos: -1,
        almacenamientoGB: -1,
        llamadasAPIDia: -1,
        emailsMes: -1,
        smsMes: -1,
        whatsappMes: -1,
      },
    },
    diasRestantes: 365,
    advertencias: [],
  },
}

// Respuesta mock genérica para listados vacíos
const MOCK_EMPTY_LIST = { success: true, data: [], total: 0, page: 1, limit: 20 }

// Mock de clientes para tests de detalle/edición
const MOCK_CLIENTES = [
  {
    _id: 'e2e-cliente-1',
    codigo: 'CLI00001',
    nombre: 'Cliente E2E Test',
    nombreComercial: 'Cliente E2E',
    nif: 'B99999999',
    email: 'cliente-e2e@test.com',
    telefono: '+34 600111222',
    tipoCliente: 'empresa',
    activo: true,
    direccion: { calle: 'Calle E2E 1', codigoPostal: '28001', ciudad: 'Madrid' },
    riesgoActual: 0,
    limiteCredito: 10000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'e2e-cliente-2',
    codigo: 'CLI00002',
    nombre: 'Segundo Cliente Test',
    nombreComercial: 'Segundo Test',
    nif: 'A88888888',
    email: 'cliente2@test.com',
    telefono: '+34 600333444',
    tipoCliente: 'empresa',
    activo: true,
    riesgoActual: 0,
    limiteCredito: 5000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Mock de productos para tests de detalle
const MOCK_PRODUCTOS = [
  {
    _id: 'e2e-producto-1',
    codigo: 'PROD00001',
    sku: 'E2E-001',
    nombre: 'Producto E2E Test',
    descripcion: 'Producto creado por test E2E',
    tipo: 'simple',
    precios: { compra: 10, venta: 25.50, pvp: 25.50, margen: 60 },
    unidadMedida: 'ud',
    stock: { cantidad: 100, minimo: 5 },
    activo: true,
    disponible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'e2e-producto-2',
    codigo: 'PROD00002',
    sku: 'E2E-002',
    nombre: 'Servicio E2E Test',
    descripcion: 'Servicio de prueba E2E',
    tipo: 'servicio',
    precios: { compra: 0, venta: 50.00, pvp: 50.00, margen: 100 },
    unidadMedida: 'hora',
    stock: { cantidad: 0, minimo: 0 },
    activo: true,
    disponible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Respuesta mock del dashboard
const MOCK_DASHBOARD = {
  success: true,
  data: {
    _id: 'e2e-dashboard-id',
    nombre: 'Dashboard Principal',
    esPlantilla: false,
    esPorDefecto: true,
    widgets: [],
    config: {
      columnas: 12,
      filaAltura: 80,
      compacto: true,
    },
  },
}

// Respuesta mock de datos de widgets
const MOCK_WIDGET_DATA = {
  success: true,
  data: {},
}

// Intentar login via API
async function tryApiLogin(
  email: string,
  password: string,
): Promise<{ user: any; accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const body = await response.json()
      if (body.data?.accessToken) {
        return {
          user: body.data.usuario,
          accessToken: body.data.accessToken,
          refreshToken: body.data.refreshToken,
        }
      }
    }
  } catch {
    // API no disponible
  }
  return null
}

// Configurar auth en el contexto del navegador usando addInitScript
async function setupAuthContext(
  context: BrowserContext,
  user: any,
  accessToken: string,
  refreshToken: string,
) {
  await context.addInitScript(
    ({ user, accessToken, refreshToken }) => {
      if (window.location.hostname === 'localhost') {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isHydrated: false,
          },
          version: 0,
        }))
      }
    },
    { user, accessToken, refreshToken },
  )
}

// Configurar interceptores de API cuando usamos tokens mock.
// Interceptamos TODAS las llamadas API para evitar que el backend real
// devuelva 401 (el mock JWT no es válido para el backend), lo que provocaría
// que el interceptor de axios llame a handleAuthFailure() → redirect loop infinito.
async function setupApiMocks(context: BrowserContext) {
  // 1. Catch-all PRIMERO = prioridad MÁS BAJA en Playwright
  //    Devuelve respuesta segura para cualquier endpoint no mockeado específicamente.
  //    Usamos data: null para GETs para que hooks como useModuleConfig caigan
  //    a sus defaults (null es falsy, mientras que [] es truthy y causa crashes).
  await context.route('**/api/**', route => {
    const method = route.request().method()
    const url = route.request().url()
    let body: any

    if (method === 'GET') {
      // Endpoints de listado: devolver array vacío con paginación
      if (url.match(/\?(.*&)?page=/) || url.match(/\/api\/(clientes|productos|facturas|presupuestos|pedidos|albaranes|proveedores|personal|proyectos|ofertas|partes-trabajo|familias|clasificaciones|tarifas|almacenes|formas-pago|terminos-pago|estados|departamentos|turnos|calendarios|tipos-impuesto|tipos-gasto|series-documentos|agentes-comerciales|impresoras|modificadores|grupos-modificadores|variantes|alergenos|terminales|situaciones|zonas-preparacion|leads|oportunidades|actividades|maquinaria|recordatorios|tareas|logs|vistas-guardadas|favoritos)(\?|$)/)) {
        body = { success: true, data: [], total: 0, page: 1, limit: 20 }
      } else {
        // Otros GETs (config, detalle, etc.): null para que hooks usen defaults
        body = { success: true, data: null }
      }
    } else if (method === 'DELETE') {
      body = { success: true }
    } else {
      body = { success: true, data: {} }
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })

  // 2. Mocks específicos DESPUÉS = prioridad MÁS ALTA (sobreescriben el catch-all)

  // Licencia: crítica para que useLicense() devuelva módulos y el sidebar se renderice completo
  await context.route('**/api/licencias/mi-licencia', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LICENSE_RESPONSE) }),
  )

  // Dashboard: para que el grid no crashee
  await context.route('**/api/dashboard', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) }),
  )
  await context.route('**/api/dashboard/*/data', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WIDGET_DATA) }),
  )

  // Clientes: listado con datos mock para que haya filas en la tabla
  await context.route('**/api/clientes', route => {
    const url = route.request().url()
    // Solo interceptar listados (sin ID específico en la URL)
    if (url.match(/\/api\/clientes(\?|$)/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_CLIENTES,
          pagination: { page: 1, limit: 20, total: MOCK_CLIENTES.length, totalPages: 1 },
        }),
      })
    }
    return route.continue()
  })

  // Clientes: detalle individual
  await context.route('**/api/clientes/e2e-cliente-*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_CLIENTES[0] }),
    }),
  )

  // Productos: listado con datos mock
  await context.route('**/api/productos', route => {
    const url = route.request().url()
    if (url.match(/\/api\/productos(\?|$)/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_PRODUCTOS,
          pagination: { page: 1, limit: 20, total: MOCK_PRODUCTOS.length, totalPages: 1 },
        }),
      })
    }
    return route.continue()
  })

  // Productos: detalle individual
  await context.route('**/api/productos/e2e-producto-*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_PRODUCTOS[0] }),
    }),
  )

  // Auth refresh: devolver tokens mock para que el interceptor no llame handleAuthFailure
  await context.route('**/api/auth/refresh', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-refreshed-token',
        refreshToken: 'mock-refreshed-refresh',
      }),
    }),
  )
}

// Fixture con sesión de admin
export const adminTest = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()

    // Obtener auth real o mock
    const apiResult = await tryApiLogin(WEB_ADMIN.email, WEB_ADMIN.password)

    const user = apiResult?.user ?? MOCK_ADMIN_USER
    const accessToken = apiResult?.accessToken ?? createMockJWT({
      sub: MOCK_ADMIN_USER.id,
      rol: MOCK_ADMIN_USER.rol,
      empresaId: MOCK_ADMIN_USER.empresaId,
    })
    const refreshToken = apiResult?.refreshToken ?? createMockJWT({
      sub: MOCK_ADMIN_USER.id,
      type: 'refresh',
    })

    await setupAuthContext(context, user, accessToken, refreshToken)

    // Si no hay backend, mockear las APIs
    if (!apiResult) {
      await setupApiMocks(context)
    }

    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

// Fixture con sesión de superadmin
export const superadminTest = base.extend<{ superadminPage: Page }>({
  superadminPage: async ({ browser }, use) => {
    const context = await browser.newContext()

    const apiResult = await tryApiLogin(WEB_SUPERADMIN.email, WEB_SUPERADMIN.password)

    const user = apiResult?.user ?? MOCK_SUPERADMIN_USER
    const accessToken = apiResult?.accessToken ?? createMockJWT({
      sub: MOCK_SUPERADMIN_USER.id,
      rol: MOCK_SUPERADMIN_USER.rol,
      empresaId: MOCK_SUPERADMIN_USER.empresaId,
    })
    const refreshToken = apiResult?.refreshToken ?? createMockJWT({
      sub: MOCK_SUPERADMIN_USER.id,
      type: 'refresh',
    })

    await setupAuthContext(context, user, accessToken, refreshToken)

    if (!apiResult) {
      await setupApiMocks(context)
    }

    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect }
