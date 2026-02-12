/**
 * Script para crear datos de prueba E2E
 * Crea usuario admin, empresa, licencia, UsuarioEmpresa,
 * y datos de negocio (clientes, productos) en la BD del tenant.
 *
 * Uso: npx tsx src/scripts/seed-e2e.ts
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env') })

import Usuario from '../modules/usuarios/Usuario'
import UsuarioEmpresa from '../modules/usuarios/UsuarioEmpresa'
import Empresa from '../modules/empresa/Empresa'
import Licencia from '../modules/licencias/Licencia'
import Plan from '../modules/licencias/Plan'
import { DatabaseManagerService } from '../services/database-manager.service'

// ============================================
// CONFIGURACIÓN DE DATOS E2E
// ============================================
const E2E_ADMIN = {
  email: 'admin@test.com',
  password: 'Test123456',
  nombre: 'Admin',
  apellidos: 'Test E2E',
}

const E2E_EMPRESA = {
  nombre: 'Empresa E2E Test SL',
  nif: 'B99999901',
  email: 'e2e@empresa-test.com',
  tipoNegocio: 'servicios' as const,
}

const E2E_CLIENTES = [
  {
    codigo: 'CLI00001',
    nombre: 'Cliente E2E Test',
    nombreComercial: 'Cliente E2E',
    nif: 'B99999999',
    email: 'cliente-e2e@test.com',
    telefono: '+34 600111222',
    tipoCliente: 'empresa',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    codigo: 'CLI00002',
    nombre: 'Segundo Cliente Test',
    nombreComercial: 'Segundo Test',
    nif: 'A88888888',
    email: 'cliente2@test.com',
    telefono: '+34 600333444',
    tipoCliente: 'empresa',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const E2E_PRODUCTOS = [
  {
    codigo: 'PROD00001',
    sku: 'E2E-001',
    nombre: 'Producto E2E Test',
    descripcion: 'Producto creado por test E2E',
    tipo: 'simple',
    precios: { compra: 10, venta: 25.50, pvp: 25.50 },
    unidadMedida: 'ud',
    stock: { cantidad: 100, minimo: 5 },
    activo: true,
    disponible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    codigo: 'PROD00002',
    sku: 'E2E-002',
    nombre: 'Servicio E2E Test',
    descripcion: 'Servicio de prueba E2E',
    tipo: 'servicio',
    precios: { compra: 0, venta: 50.00, pvp: 50.00 },
    unidadMedida: 'hora',
    stock: { cantidad: 0, minimo: 0 },
    activo: true,
    disponible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// ============================================
// FUNCIONES
// ============================================
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tralok-dev'
  await mongoose.connect(mongoUri)
  console.log('✅ Conectado a MongoDB:', mongoUri)
}

async function getOrCreatePlan() {
  // Buscar plan Enterprise (o cualquier plan existente)
  let plan = await Plan.findOne({ slug: 'enterprise' })
  if (!plan) {
    plan = await Plan.findOne({ slug: 'profesional' })
  }
  if (!plan) {
    plan = await Plan.findOne({})
  }
  if (!plan) {
    throw new Error('No hay planes en la BD. Ejecuta primero seed-plans.ts')
  }
  console.log(`📋 Plan encontrado: ${plan.nombre} (${(plan as any).slug})`)
  return plan
}

async function getOrCreateEmpresa() {
  let empresa = await Empresa.findOne({ nif: E2E_EMPRESA.nif })

  if (empresa) {
    console.log(`📋 Empresa E2E ya existe: ${empresa.nombre}`)
    return empresa
  }

  const empresaId = new mongoose.Types.ObjectId()
  const databaseConfig = DatabaseManagerService.generateDatabaseConfig(
    String(empresaId),
    {
      host: process.env.MONGODB_HOST || 'localhost',
      port: parseInt(process.env.MONGODB_PORT || '27017'),
    }
  )

  empresa = await Empresa.create({
    _id: empresaId,
    ...E2E_EMPRESA,
    estado: 'activa',
    databaseConfig,
  })

  console.log(`✅ Empresa E2E creada: ${empresa.nombre}`)
  return empresa
}

async function getOrCreateLicencia(empresaId: mongoose.Types.ObjectId, planId: mongoose.Types.ObjectId) {
  let licencia = await Licencia.findOne({ empresaId })

  if (licencia) {
    console.log('📋 Licencia ya existe')
    return licencia
  }

  licencia = await Licencia.create({
    empresaId,
    planId,
    estado: 'activa',
    esTrial: false,
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    addOns: [],
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
  })

  console.log('✅ Licencia creada')
  return licencia
}

async function getOrCreateAdmin(empresaId: mongoose.Types.ObjectId) {
  let usuario = await Usuario.findOne({ email: E2E_ADMIN.email })

  if (usuario) {
    console.log(`📋 Usuario E2E ya existe: ${usuario.email}`)
    // Actualizar password por si ha cambiado
    usuario.password = E2E_ADMIN.password
    usuario.empresaId = empresaId
    usuario.activo = true
    usuario.emailVerificado = true
    await usuario.save()
    return usuario
  }

  usuario = await Usuario.create({
    empresaId,
    email: E2E_ADMIN.email,
    password: E2E_ADMIN.password,
    nombre: E2E_ADMIN.nombre,
    apellidos: E2E_ADMIN.apellidos,
    rol: 'admin',
    activo: true,
    emailVerificado: true,
    twoFactorEnabled: false,
    permisos: {},
    preferencias: {
      idioma: 'es',
      tema: 'light',
      notificaciones: { email: true, push: true },
    },
  })

  console.log(`✅ Usuario E2E creado: ${usuario.email}`)
  return usuario
}

async function getOrCreateUsuarioEmpresa(
  usuarioId: mongoose.Types.ObjectId,
  empresaId: mongoose.Types.ObjectId,
) {
  let ue = await UsuarioEmpresa.findOne({ usuarioId, empresaId })

  if (ue) {
    console.log('📋 UsuarioEmpresa ya existe')
    return ue
  }

  ue = await UsuarioEmpresa.create({
    usuarioId,
    empresaId,
    rol: 'admin',
    activo: true,
    esPrincipal: true,
    fechaAsignacion: new Date(),
  })

  console.log('✅ UsuarioEmpresa creado')
  return ue
}

async function seedTenantData(empresa: any) {
  const tenantDbName = empresa.databaseConfig?.dbName
    || empresa.databaseConfig?.name
    || `omerix_${empresa._id}`
  console.log(`📋 Base de datos tenant: ${tenantDbName}`)

  const tenantDb = mongoose.connection.useDb(tenantDbName)
  const empresaId = empresa._id

  // Clientes
  const clientesCount = await tenantDb.collection('clientes').countDocuments()
  if (clientesCount === 0) {
    const clientes = E2E_CLIENTES.map(c => ({ ...c, empresaId }))
    await tenantDb.collection('clientes').insertMany(clientes)
    console.log(`✅ ${clientes.length} clientes E2E creados`)
  } else {
    console.log(`📋 Ya hay ${clientesCount} clientes en la BD`)
  }

  // Productos
  const productosCount = await tenantDb.collection('productos').countDocuments()
  if (productosCount === 0) {
    const productos = E2E_PRODUCTOS.map(p => ({ ...p, empresaId }))
    await tenantDb.collection('productos').insertMany(productos)
    console.log(`✅ ${productos.length} productos E2E creados`)
  } else {
    // Si ya existen, verificar que tengan empresaId y actualizar
    const sinEmpresa = await tenantDb.collection('productos').countDocuments({ empresaId: { $exists: false } })
    if (sinEmpresa > 0) {
      await tenantDb.collection('productos').updateMany(
        { empresaId: { $exists: false } },
        { $set: { empresaId } },
      )
      console.log(`✅ ${sinEmpresa} productos actualizados con empresaId`)
    }
    // Mismo para clientes
    const clientesSinEmpresa = await tenantDb.collection('clientes').countDocuments({ empresaId: { $exists: false } })
    if (clientesSinEmpresa > 0) {
      await tenantDb.collection('clientes').updateMany(
        { empresaId: { $exists: false } },
        { $set: { empresaId } },
      )
      console.log(`✅ ${clientesSinEmpresa} clientes actualizados con empresaId`)
    }
    console.log(`📋 Ya hay ${productosCount} productos en la BD`)
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log('  TRALOK ERP - SEED DATOS E2E')
  console.log('═══════════════════════════════════════════════════')
  console.log('')

  try {
    await connectDB()

    const plan = await getOrCreatePlan()
    const empresa = await getOrCreateEmpresa()
    await getOrCreateLicencia(empresa._id, plan._id)
    const admin = await getOrCreateAdmin(empresa._id)
    await getOrCreateUsuarioEmpresa(admin._id, empresa._id)
    await seedTenantData(empresa)

    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('  CREDENCIALES E2E')
    console.log('═══════════════════════════════════════════════════')
    console.log('')
    console.log(`  📧 Email:    ${E2E_ADMIN.email}`)
    console.log(`  🔑 Password: ${E2E_ADMIN.password}`)
    console.log(`  🏢 Empresa:  ${E2E_EMPRESA.nombre}`)
    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('✅ Desconectado de MongoDB')
  }
}

main()
