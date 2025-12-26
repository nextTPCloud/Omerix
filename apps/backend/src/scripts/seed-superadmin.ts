/**
 * Script para crear el usuario SuperAdmin inicial
 *
 * Uso:
 *   npx tsx src/scripts/seed-superadmin.ts
 *
 * O con npm script:
 *   npm run seed:superadmin
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Usuario from '../modules/usuarios/Usuario';
import Empresa from '../modules/empresa/Empresa';
import { DatabaseManagerService } from '../services/database-manager.service';

// ============================================
// CONFIGURACIÓN DEL SUPERADMIN
// ============================================
const SUPERADMIN_CONFIG = {
  email: 'admin@tralok.com',
  password: 'Admin123!',  // Cambiar después del primer login
  nombre: 'Super',
  apellidos: 'Administrador',
};

const SYSTEM_EMPRESA_CONFIG = {
  nombre: 'Tralok System',
  nif: 'B00000000',
  email: 'system@tralok.com',
  tipoNegocio: 'servicios' as const,
};

// ============================================
// CONEXIÓN A MONGODB
// ============================================
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tralok-dev';

  await mongoose.connect(mongoUri);
  console.log('✓ Conectado a MongoDB:', mongoUri);
}

// ============================================
// CREAR EMPRESA SISTEMA (para el superadmin)
// ============================================
async function getOrCreateSystemEmpresa() {
  // Buscar si ya existe
  let empresa = await Empresa.findOne({ nif: SYSTEM_EMPRESA_CONFIG.nif });

  if (empresa) {
    console.log('✓ Empresa sistema ya existe:', empresa.nombre);
    return empresa;
  }

  // Crear empresa sistema
  const empresaId = new mongoose.Types.ObjectId();

  const databaseConfig = DatabaseManagerService.generateDatabaseConfig(
    String(empresaId),
    {
      host: process.env.MONGODB_HOST || 'localhost',
      port: parseInt(process.env.MONGODB_PORT || '27017'),
    }
  );

  empresa = await Empresa.create({
    _id: empresaId,
    ...SYSTEM_EMPRESA_CONFIG,
    estado: 'activa',
    databaseConfig,
  });

  console.log('✓ Empresa sistema creada:', empresa.nombre);
  return empresa;
}

// ============================================
// CREAR SUPERADMIN
// ============================================
async function createSuperAdmin(empresaId: mongoose.Types.ObjectId) {
  // Verificar si ya existe
  const existente = await Usuario.findOne({ email: SUPERADMIN_CONFIG.email });

  if (existente) {
    console.log('⚠ El superadmin ya existe:', existente.email);
    console.log('  Si necesitas resetear la contraseña, usa el endpoint de recuperación.');
    return existente;
  }

  // Crear superadmin
  const superadmin = await Usuario.create({
    empresaId,
    email: SUPERADMIN_CONFIG.email,
    password: SUPERADMIN_CONFIG.password,
    nombre: SUPERADMIN_CONFIG.nombre,
    apellidos: SUPERADMIN_CONFIG.apellidos,
    rol: 'superadmin',
    activo: true,
    emailVerificado: true,
    twoFactorEnabled: false,
    permisos: {},
    preferencias: {
      idioma: 'es',
      tema: 'light',
      notificaciones: {
        email: true,
        push: true,
      },
    },
  });

  console.log('✓ SuperAdmin creado exitosamente');
  return superadmin;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  TRALOK ERP - CREACIÓN DE SUPERADMIN');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    await connectDB();

    // Crear empresa sistema
    const empresa = await getOrCreateSystemEmpresa();

    // Crear superadmin
    const superadmin = await createSuperAdmin(empresa._id);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  CREDENCIALES DEL SUPERADMIN');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`  📧 Email:    ${SUPERADMIN_CONFIG.email}`);
    console.log(`  🔑 Password: ${SUPERADMIN_CONFIG.password}`);
    console.log('');
    console.log('  ⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB');
  }
}

// Ejecutar
main();
