/**
 * ================================================
 * SCRIPT DE SEED - 40 CLIENTES DE PRUEBA
 * ================================================
 *
 * Arquitectura Multi-DB: Inserta clientes en la base de datos
 * específica de la empresa seleccionada.
 *
 * Ejecutar con: npm run seed:clientes
 */

import mongoose from 'mongoose';
import { TipoCliente, FormaPago } from '../modules/clientes/Cliente';
import Empresa from '../models/Empresa';
import { databaseManager } from '../services/database-manager.service';
import { getClienteModel } from '../utils/dynamic-models.helper';
import { config } from '../config/env';
import { logger } from '../config/logger';

// ⚠️ IMPORTANTE: Cambia este ID por el de tu empresa
const EMPRESA_ID = '691786dac5b0552464fb6392'; // ← CAMBIAR POR TU EMPRESA_ID
const USUARIO_ID = '691786dac5b0552464fb6395'; // ← CAMBIAR POR TU USUARIO_ID

const NOMBRES_EMPRESAS = [
  'Tecnologías Avanzadas S.L.',
  'Distribuciones García y Asociados',
  'Construcciones Martínez',
  'Informática del Sur',
  'Transportes Rápidos Express',
  'Consultoría Digital Pro',
  'Manufacturas Iberia',
  'Energías Renovables del Este',
  'Alimentación Gourmet Premium',
  'Servicios Logísticos Integrales',
  'Ingeniería y Proyectos',
  'Comercial Internacional Trade',
  'Sistemas de Seguridad Avanzada',
  'Desarrollos Inmobiliarios',
  'Marketing Digital 360',
  'Hostelería y Restauración Premium',
  'Textil Fashion Group',
  'Automoción y Recambios',
  'Farmacéutica Mediterránea',
  'Electrodomésticos del Norte',
  'Asesoría Fiscal y Contable',
  'Instalaciones Térmicas',
  'Carpintería Artesanal',
  'Pinturas y Revestimientos',
  'Jardinería y Paisajismo',
  'Limpieza Industrial Pro',
  'Mantenimiento Integral',
  'Publicidad Creativa',
  'Eventos y Protocolo',
  'Seguros y Finanzas',
];

const NOMBRES = [
  'Juan', 'María', 'Carlos', 'Ana', 'David', 'Laura', 'Miguel', 'Carmen',
  'Pedro', 'Isabel', 'Francisco', 'Dolores', 'Antonio', 'Pilar', 'Manuel',
  'Rosa', 'José', 'Teresa', 'Jesús', 'Mercedes'
];

const APELLIDOS = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez',
  'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández',
  'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
  'Serrano', 'Blanco', 'Suárez'
];

const CALLES = [
  'Calle Mayor', 'Avenida de la Constitución', 'Calle Gran Vía',
  'Paseo de la Castellana', 'Calle Real', 'Avenida del Mediterráneo',
  'Calle del Carmen', 'Plaza España', 'Calle de Alcalá', 'Avenida Diagonal',
  'Calle Serrano', 'Paseo de Gracia', 'Calle Goya', 'Avenida América',
  'Calle Bailén', 'Plaza Mayor', 'Calle Toledo', 'Avenida Andalucía'
];

const CIUDADES = [
  { nombre: 'Madrid', cp: '28013' },
  { nombre: 'Barcelona', cp: '08001' },
  { nombre: 'Valencia', cp: '46001' },
  { nombre: 'Sevilla', cp: '41001' },
  { nombre: 'Zaragoza', cp: '50001' },
  { nombre: 'Málaga', cp: '29001' },
  { nombre: 'Murcia', cp: '30001' },
  { nombre: 'Bilbao', cp: '48001' },
  { nombre: 'Alicante', cp: '03001' },
  { nombre: 'Córdoba', cp: '14001' },
  { nombre: 'Valladolid', cp: '47001' },
  { nombre: 'Vigo', cp: '36201' },
  { nombre: 'Gijón', cp: '33201' },
  { nombre: 'Granada', cp: '18001' },
  { nombre: 'Santander', cp: '39001' },
];

function generarNIF(): string {
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const numero = Math.floor(Math.random() * 100000000);
  const letra = letras[numero % 23];
  return `${numero.toString().padStart(8, '0')}${letra}`;
}

function generarCIF(): string {
  const letras = 'ABCDEFGHJNPQRSUVW';
  const letra = letras[Math.floor(Math.random() * letras.length)];
  const numero = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${letra}${numero}0`;
}

function generarTelefono(): string {
  const prefijos = ['91', '93', '96', '95', '976', '951', '968', '94', '965'];
  const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
  const resto = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+34 ${prefijo} ${resto.slice(0, 3)} ${resto.slice(3)}`;
}

function generarEmail(nombre: string, tipo: 'empresa' | 'particular'): string {
  if (tipo === 'empresa') {
    const dominios = ['techadvance.com', 'distribuciones.es', 'consulting.com', 'logistics.es'];
    const domain = dominios[Math.floor(Math.random() * dominios.length)];
    return `info@${nombre.toLowerCase().replace(/\s+/g, '').slice(0, 10)}.${domain}`;
  } else {
    const dominios = ['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com'];
    const domain = dominios[Math.floor(Math.random() * dominios.length)];
    return `${nombre.toLowerCase().replace(/\s+/g, '.')}@${domain}`;
  }
}

function randomEntre(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarClientes(creadoPorId: mongoose.Types.ObjectId) {
  const clientes: any[] = [];

  // 20 empresas
  for (let i = 0; i < 20; i++) {
    const nombreEmpresa = NOMBRES_EMPRESAS[i];
    const ciudad = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
    const calle = CALLES[Math.floor(Math.random() * CALLES.length)];
    const numero = randomEntre(1, 250);
    const limiteCredito = [5000, 10000, 15000, 20000, 25000, 50000][Math.floor(Math.random() * 6)];
    const riesgoActual = Math.random() > 0.7 ? randomEntre(0, limiteCredito * 0.8) : 0;

    const formasPago = [
      FormaPago.CONTADO,
      FormaPago.TRANSFERENCIA,
      FormaPago.DOMICILIACION,
      FormaPago.CONFIRMING,
      FormaPago.PAGARE
    ];

    clientes.push({
      codigo: `CLI-${(i + 1).toString().padStart(3, '0')}`,
      nombre: nombreEmpresa,
      nombreComercial: Math.random() > 0.5 ? nombreEmpresa.split(' ')[0] : undefined,
      nif: generarCIF(),
      tipoCliente: TipoCliente.EMPRESA,
      email: generarEmail(nombreEmpresa, 'empresa'),
      telefono: generarTelefono(),
      direccion: {
        calle: `${calle}, ${numero}`,
        ciudad: ciudad.nombre,
        provincia: ciudad.nombre,
        codigoPostal: ciudad.cp,
        pais: 'España',
      },
      formaPago: formasPago[Math.floor(Math.random() * formasPago.length)],
      diasPago: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
      limiteCredito,
      riesgoActual,
      descuentoGeneral: Math.random() > 0.5 ? randomEntre(5, 15) : 0,
      observaciones: Math.random() > 0.7 ? 'Cliente preferente con descuento especial' : undefined,
      activo: Math.random() > 0.1, // 90% activos
      creadoPor: creadoPorId,
    });
  }

  // 20 particulares
  for (let i = 0; i < 20; i++) {
    const nombre = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]} ${APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]}`;
    const ciudad = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
    const calle = CALLES[Math.floor(Math.random() * CALLES.length)];
    const numero = randomEntre(1, 250);
    const limiteCredito = [1000, 2000, 3000, 5000][Math.floor(Math.random() * 4)];
    const riesgoActual = Math.random() > 0.8 ? randomEntre(0, limiteCredito * 0.5) : 0;

    clientes.push({
      codigo: `CLI-${(i + 21).toString().padStart(3, '0')}`,
      nombre,
      nif: generarNIF(),
      tipoCliente: TipoCliente.PARTICULAR,
      email: generarEmail(nombre, 'particular'),
      telefono: generarTelefono(),
      direccion: {
        calle: `${calle}, ${numero}`,
        ciudad: ciudad.nombre,
        provincia: ciudad.nombre,
        codigoPostal: ciudad.cp,
        pais: 'España',
      },
      formaPago: [FormaPago.CONTADO, FormaPago.TRANSFERENCIA][Math.floor(Math.random() * 2)],
      diasPago: 30,
      limiteCredito,
      riesgoActual,
      descuentoGeneral: 0,
      activo: Math.random() > 0.05, // 95% activos
      creadoPor: creadoPorId,
    });
  }

  return clientes;
}

async function seed() {
  try {
    logger.info('🌱 Iniciando seed de clientes (Multi-DB)...\n');

    // 1. Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal');

    // Registrar conexión principal
    databaseManager.setMainConnection(mongoose.connection);

    // 2. Obtener empresa y su configuración de DB
    logger.info(`\n🔍 Buscando empresa con ID: ${EMPRESA_ID}`);

    const empresa = await Empresa.findById(EMPRESA_ID)
      .select('+databaseConfig.password +databaseConfig.uri')
      .lean();

    if (!empresa) {
      throw new Error(`❌ Empresa con ID ${EMPRESA_ID} no encontrada`);
    }

    if (!empresa.databaseConfig) {
      throw new Error(`❌ Empresa ${empresa.nombre} no tiene configuración de base de datos`);
    }

    logger.info(`✅ Empresa encontrada: ${empresa.nombre}`);
    logger.info(`📊 Base de datos: ${empresa.databaseConfig.name}\n`);

    logger.info(`⚠️  ATENCIÓN:`);
    logger.info(`   Empresa: ${empresa.nombre}`);
    logger.info(`   ID: ${EMPRESA_ID}`);
    logger.info(`   Usuario (creadoPor): ${USUARIO_ID}`);
    logger.info(`   Base de datos: ${empresa.databaseConfig.name}`);
    logger.info(`\n   Si estos datos NO son correctos, cancela ahora (Ctrl+C)\n`);

    // Esperar 3 segundos para que el usuario pueda cancelar
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Obtener modelo de Cliente de la BD de la empresa
    logger.info('🔧 Conectando a base de datos de la empresa...');
    const ClienteModel = await getClienteModel(EMPRESA_ID, empresa.databaseConfig);
    logger.info('✅ Conexión establecida');

    // 4. Limpiar clientes de prueba anteriores
    logger.info('\n🗑️  Eliminando clientes de prueba anteriores...');
    const deleteResult = await ClienteModel.deleteMany({
      codigo: { $regex: /^CLI-\d{3}$/ } // Solo eliminar los que tienen formato CLI-XXX
    });
    logger.info(`   Eliminados: ${deleteResult.deletedCount} clientes`);

    // 5. Generar clientes
    logger.info('\n🎲 Generando 40 clientes de prueba...');
    const usuarioObjectId = new mongoose.Types.ObjectId(USUARIO_ID);
    const clientes = generarClientes(usuarioObjectId);

    // 6. Insertar en la DB de la empresa
    logger.info('💾 Insertando clientes en la base de datos de la empresa...');
    const insertResult = await ClienteModel.insertMany(clientes);

    logger.info(`\n✅ ¡${insertResult.length} clientes creados correctamente!`);
    logger.info('\n📊 Resumen:');
    logger.info(`   - Empresas: ${clientes.filter(c => c.tipoCliente === TipoCliente.EMPRESA).length}`);
    logger.info(`   - Particulares: ${clientes.filter(c => c.tipoCliente === TipoCliente.PARTICULAR).length}`);
    logger.info(`   - Activos: ${clientes.filter(c => c.activo).length}`);
    logger.info(`   - Inactivos: ${clientes.filter(c => !c.activo).length}`);
    logger.info(`   - Con riesgo: ${clientes.filter(c => c.riesgoActual > 0).length}`);

    logger.info(`\n📍 Ubicación: ${empresa.databaseConfig.name}`);
    logger.info(`\n✅ Los clientes están en la base de datos de la empresa "${empresa.nombre}"`);

  } catch (error: any) {
    logger.error('\n❌ Error en el seed:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    // Cerrar todas las conexiones
    logger.info('\n🔌 Cerrando conexiones...');
    await mongoose.connection.close();
    await databaseManager.closeAllEmpresaConnections();
    logger.info('✅ Todas las conexiones cerradas');
  }
}

// Ejecutar el seed
if (require.main === module) {
  seed()
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

export default seed;