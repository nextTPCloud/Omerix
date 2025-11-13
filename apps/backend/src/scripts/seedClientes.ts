/**
 * ================================================
 * SCRIPT DE SEED - 40 CLIENTES DE PRUEBA
 * ================================================
 * 
 * Ejecutar con: npx tsx scripts/seed-clientes.ts
 */

import mongoose from 'mongoose';
import { Cliente, TipoCliente, FormaPago } from '../modules/clientes/Cliente';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix-dev';

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

function generarClientes(empresaId: mongoose.Types.ObjectId, creadoPorId: mongoose.Types.ObjectId) {
  const clientes: any[] = [];
      
  // 20 empresas
  for (let i = 0; i < 20; i++) {
    const nombreEmpresa = NOMBRES_EMPRESAS[i];
    const ciudad = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
    const calle = CALLES[Math.floor(Math.random() * CALLES.length)];
    const numero = randomEntre(1, 250);
    const limiteCredito = [5000, 10000, 15000, 20000, 25000, 50000][Math.floor(Math.random() * 6)];
    const riesgoActual = Math.random() > 0.7 ? randomEntre(0, limiteCredito * 0.8) : 0;
    
    // ✅ Array de formas de pago usando el enum
    const formasPago = [
      FormaPago.CONTADO,
      FormaPago.TRANSFERENCIA,
      FormaPago.DOMICILIACION,
      FormaPago.CONFIRMING,
      FormaPago.PAGARE
    ];
    
    clientes.push({
      empresaId: empresaId, // ✅ Ya es ObjectId
      codigo: `CLI-${(i + 1).toString().padStart(3, '0')}`,
      nombre: nombreEmpresa,
      nombreComercial: Math.random() > 0.5 ? nombreEmpresa.split(' ')[0] : undefined,
      nif: generarCIF(),
      tipoCliente: TipoCliente.EMPRESA, // ✅ Usar el enum
      email: generarEmail(nombreEmpresa, 'empresa'),
      telefono: generarTelefono(),
      direccion: {
        calle: `${calle}, ${numero}`,
        ciudad: ciudad.nombre,
        provincia: ciudad.nombre,
        codigoPostal: ciudad.cp,
        pais: 'España',
      },
      formaPago: formasPago[Math.floor(Math.random() * formasPago.length)], // ✅ Usar el enum
      diasPago: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
      limiteCredito,
      riesgoActual,
      descuentoGeneral: Math.random() > 0.5 ? randomEntre(5, 15) : 0, // ✅ Campo correcto
      observaciones: Math.random() > 0.7 ? 'Cliente preferente con descuento especial' : undefined,
      activo: Math.random() > 0.1, // 90% activos
      creadoPor: creadoPorId, // ✅ Campo requerido
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
      empresaId: empresaId, // ✅ Ya es ObjectId
      codigo: `CLI-${(i + 21).toString().padStart(3, '0')}`,
      nombre,
      nif: generarNIF(),
      tipoCliente: TipoCliente.PARTICULAR, // ✅ Usar el enum
      email: generarEmail(nombre, 'particular'),
      telefono: generarTelefono(),
      direccion: {
        calle: `${calle}, ${numero}`,
        ciudad: ciudad.nombre,
        provincia: ciudad.nombre,
        codigoPostal: ciudad.cp,
        pais: 'España',
      },
      formaPago: [FormaPago.CONTADO, FormaPago.TRANSFERENCIA][Math.floor(Math.random() * 2)], // ✅ Usar el enum
      diasPago: 30,
      limiteCredito,
      riesgoActual,
      descuentoGeneral: 0, // ✅ Campo correcto
      activo: Math.random() > 0.05, // 95% activos
      creadoPor: creadoPorId, // ✅ Campo requerido
    });
  }
  
  return clientes;
}

async function seed() {
  try {
    console.log('🌱 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // ⚠️ IMPORTANTE: Cambia estos IDs por los de tu sistema
    const EMPRESA_ID = new mongoose.Types.ObjectId('6902a19686f1b9b9fddee388'); // ← CAMBIAR
    const USUARIO_ID = new mongoose.Types.ObjectId('6902a19686f1b9b9fddee38a'); // ← CAMBIAR
    
    console.log(`\n⚠️  USANDO EMPRESA ID: ${EMPRESA_ID}`);
    console.log(`⚠️  USANDO USUARIO ID (creadoPor): ${USUARIO_ID}`);
    console.log('   Si estos IDs no son correctos, cancela (Ctrl+C) y cámbialos en el script\n');
    
    // Esperar 3 segundos para que el usuario pueda cancelar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🗑️  Eliminando clientes anteriores de prueba...');
    const deleteResult = await Cliente.deleteMany({ 
      empresaId: EMPRESA_ID,
      codigo: { $regex: /^CLI-\d{3}$/ } // Solo eliminar los que tienen formato CLI-XXX
    });
    console.log(`   Eliminados: ${deleteResult.deletedCount} clientes`);
    
    console.log('🎲 Generando 40 clientes de prueba...');
    const clientes = generarClientes(EMPRESA_ID, USUARIO_ID);
    
    console.log('💾 Insertando clientes en la base de datos...');
    const insertResult = await Cliente.insertMany(clientes);
    
    console.log(`\n✅ ¡${insertResult.length} clientes creados correctamente!`);
    console.log('\n📊 Resumen:');
    console.log(`   - Empresas: ${clientes.filter(c => c.tipoCliente === TipoCliente.EMPRESA).length}`);
    console.log(`   - Particulares: ${clientes.filter(c => c.tipoCliente === TipoCliente.PARTICULAR).length}`);
    console.log(`   - Activos: ${clientes.filter(c => c.activo).length}`);
    console.log(`   - Inactivos: ${clientes.filter(c => !c.activo).length}`);
    console.log(`   - Con riesgo: ${clientes.filter(c => c.riesgoActual > 0).length}`);
    
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar el seed
seed();