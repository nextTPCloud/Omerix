import mongoose from 'mongoose';
import Empresa from '../modules/empresa/Empresa';
import Usuario from '../modules/usuarios/Usuario';
import UsuarioEmpresa from '../modules/usuarios/UsuarioEmpresa';
import { config } from '../config/env';
import { logger } from '../config/logger';

/**
 * Datos de la empresa Tralok para facturación de suscripciones
 * Esta empresa es especial - es la proveedora del servicio SaaS
 */
export const TRALOK_EMPRESA_DATA = {
  nombre: 'Tralok Software SL',
  nombreComercial: 'Tralok',
  nif: 'B12345678', // TODO: Cambiar por NIF real
  email: 'facturacion@tralok.com',
  telefono: '+34 900 123 456',
  web: 'https://tralok.com',

  // Dirección fiscal
  direccion: {
    calle: 'Calle Principal 1',
    numero: '1',
    codigoPostal: '28001',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
  },

  // Datos bancarios para facturación
  datosBancarios: {
    banco: 'Banco Ejemplo',
    iban: 'ES00 0000 0000 0000 0000 0000',
    swift: 'EXAMPLEXX',
  },

  // Configuración fiscal
  configuracionFiscal: {
    tipoIVA: 21,
    regimenIVA: 'general',
    retencion: 0,
  },

  tipoNegocio: 'servicios',
  estado: 'activa',

  // Flag especial para identificar la empresa de la plataforma
  esPlatforma: true,
};

/**
 * Script para crear la empresa Tralok SL
 * Esta empresa se usa para emitir facturas de suscripción
 */
async function seedTralokEmpresa() {
  try {
    logger.info('🏢 Creando empresa Tralok SL para facturación...\n');

    // Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal\n');

    // Verificar si ya existe
    const existente = await Empresa.findOne({
      $or: [
        { nif: TRALOK_EMPRESA_DATA.nif },
        { esPlatforma: true }
      ]
    });

    if (existente) {
      logger.warn('⚠️  La empresa Tralok ya existe en la base de datos');
      logger.info(`   ID: ${existente._id}`);
      logger.info(`   Nombre: ${existente.nombre}`);
      logger.info(`   NIF: ${existente.nif}`);

      // Asignar superadmin si no lo está
      await asignarSuperadmin(existente._id);

      return existente;
    }

    // Crear empresa (sin base de datos propia, solo para facturación)
    const empresa = await Empresa.create({
      ...TRALOK_EMPRESA_DATA,
      // No genera base de datos propia
      databaseConfig: null,
    });

    logger.info('✅ Empresa Tralok creada exitosamente');
    logger.info(`   ID: ${empresa._id}`);
    logger.info(`   Nombre: ${empresa.nombre}`);
    logger.info(`   NIF: ${empresa.nif}`);
    logger.info(`   Email: ${empresa.email}`);

    // Asignar superadmin a la empresa
    await asignarSuperadmin(empresa._id);

    return empresa;

  } catch (error: any) {
    logger.error('❌ Error creando empresa Tralok:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('\n🔌 Conexión cerrada');
  }
}

/**
 * Asignar el superadmin a la empresa Tralok
 */
async function asignarSuperadmin(empresaId: mongoose.Types.ObjectId) {
  // Buscar superadmin
  const superadmin = await Usuario.findOne({ rol: 'superadmin' });

  if (!superadmin) {
    logger.warn('⚠️  No se encontró usuario superadmin para asignar');
    return;
  }

  // Verificar si ya está asignado
  const yaAsignado = await UsuarioEmpresa.findOne({
    usuarioId: superadmin._id,
    empresaId: empresaId,
  });

  if (yaAsignado) {
    logger.info('ℹ️  El superadmin ya está asignado a Tralok');
    return;
  }

  // Asignar superadmin a la empresa
  await UsuarioEmpresa.create({
    usuarioId: superadmin._id,
    empresaId: empresaId,
    rol: 'admin',
    activo: true,
    esPrincipal: true,
    fechaAsignacion: new Date(),
  });

  // Actualizar empresaId del superadmin
  superadmin.empresaId = empresaId;
  await superadmin.save();

  logger.info('✅ Superadmin asignado a Tralok');
  logger.info(`   Usuario: ${superadmin.email}`);
  logger.info(`   Empresa: Tralok Software SL`);
}

// Ejecutar
if (require.main === module) {
  seedTralokEmpresa()
    .then(() => {
      logger.info('\n✅ Script finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

export default seedTralokEmpresa;
