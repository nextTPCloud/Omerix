/**
 * Datos de prueba compartidos entre todos los tests E2E
 * Ajustar según el entorno de test (staging, desarrollo, etc.)
 */

// ─── Credenciales Web ERP ───
export const WEB_ADMIN = {
  email: 'admin@test.com',
  password: 'Test123456',
}

export const WEB_USER = {
  email: 'usuario@test.com',
  password: 'Test123456',
}

export const WEB_SUPERADMIN = {
  email: 'superadmin@test.com',
  password: 'Test123456',
}

// ─── Datos de registro ───
export const REGISTRO_EMPRESA = {
  nombreEmpresa: 'Empresa Test E2E SL',
  nifEmpresa: 'B12345678',
  emailEmpresa: 'test-e2e@empresa.com',
  telefonoEmpresa: '+34 912345678',
  direccion: 'Calle Test 123',
  codigoPostal: '28001',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  pais: 'España',
  nombre: 'Test',
  apellidos: 'E2E Playwright',
  email: `e2e-${Date.now()}@test.com`,
  telefono: '+34 666777888',
  password: 'Test123456',
  plan: 'profesional',
}

// ─── TPV ───
export const TPV_TOKEN = 'TESTTKN1'
export const TPV_PIN = '1234'
export const TPV_NOMBRE = 'TPV Test E2E'

// ─── Kiosk ───
export const KIOSK_TOKEN = 'TESTKSK1'
export const KIOSK_SECRET = 'test-secret'

// ─── Datos CRUD ───
export const CLIENTE_TEST = {
  nombre: 'Cliente E2E Test',
  nif: 'B99999999',
  email: 'cliente-e2e@test.com',
  telefono: '+34 600111222',
  direccion: 'Calle E2E 1',
  codigoPostal: '28001',
  ciudad: 'Madrid',
  provincia: 'Madrid',
}

export const PRODUCTO_TEST = {
  nombre: 'Producto E2E Test',
  sku: 'E2E-001',
  precio: '25.50',
  descripcion: 'Producto creado por test E2E',
}

export const PROVEEDOR_TEST = {
  nombre: 'Proveedor E2E Test',
  nif: 'A88888888',
  email: 'proveedor-e2e@test.com',
  telefono: '+34 600333444',
}
