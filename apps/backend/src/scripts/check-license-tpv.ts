/**
 * Script para verificar licencia TPV y tokens de activacion
 * Ejecutar: npx ts-node src/scripts/check-license-tpv.ts
 */

import mongoose from 'mongoose';
import config from '../config/env';
// Importar modelos para registrarlos en mongoose
import '../modules/licencias/Plan';
import '../modules/almacenes/Almacen';
import Licencia from '../modules/licencias/Licencia';
import TPVActivationToken from '../modules/tpv/TPVActivationToken';
import TPVRegistrado from '../modules/tpv/TPVRegistrado';

const EMPRESA_ID = '694db2ca3c1fc2d96100f8b0';

async function main() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Conectado a MongoDB');

    // Buscar licencia
    const licencia = await Licencia.findOne({ empresaId: EMPRESA_ID }).populate('planId');

    if (!licencia) {
      console.log('No se encontro licencia para la empresa:', EMPRESA_ID);
      return;
    }

    console.log('\n=== LICENCIA ===');
    console.log('Estado:', licencia.estado);
    console.log('Es Trial:', licencia.esTrial);
    console.log('Tipo Suscripcion:', licencia.tipoSuscripcion);

    const plan = licencia.planId as any;
    console.log('\n=== PLAN ===');
    console.log('Nombre:', plan?.nombre);
    console.log('Slug:', plan?.slug);
    console.log('Modulos Incluidos:', JSON.stringify(plan?.modulosIncluidos, null, 2));
    console.log('Limites:', JSON.stringify(plan?.limites, null, 2));
    console.log('TPVs Activos (del plan):', plan?.limites?.tpvsActivos);

    console.log('\n=== ADD-ONS ===');
    if (licencia.addOns && licencia.addOns.length > 0) {
      licencia.addOns.forEach((addon: any) => {
        console.log(`- ${addon.nombre} (${addon.slug}): activo=${addon.activo}, cantidad=${addon.cantidad}`);
      });
    } else {
      console.log('Sin add-ons');
    }

    // Calcular limite total
    let limiteTPVs = plan?.limites?.tpvsActivos || 0;
    const addonTPV = licencia.addOns.find(
      (a: any) => (a.slug === 'tpv' || a.slug === 'restauracion' || a.slug === 'tpv-extra') && a.activo
    );
    if (addonTPV) {
      limiteTPVs += (addonTPV as any).cantidad || 1;
    }

    console.log('\n=== RESUMEN ===');
    console.log('Limite TPVs del plan:', plan?.limites?.tpvsActivos || 0);
    console.log('TPVs extra por add-on:', addonTPV ? ((addonTPV as any).cantidad || 1) : 0);
    console.log('TOTAL TPVs disponibles:', limiteTPVs);

    // Verificar tokens de activacion
    console.log('\n=== TOKENS DE ACTIVACION ===');
    const tokens = await TPVActivationToken.find({ empresaId: EMPRESA_ID }).sort({ createdAt: -1 }).limit(5);
    if (tokens.length > 0) {
      tokens.forEach((t: any) => {
        console.log(`- Token: ${t.token}, Usado: ${t.usado}, Expira: ${t.expiraEn}, Creado: ${t.createdAt}`);
      });
    } else {
      console.log('No hay tokens de activacion');
    }

    // Verificar TPVs registrados
    console.log('\n=== TPVs REGISTRADOS ===');
    const tpvs = await TPVRegistrado.find({ empresaId: EMPRESA_ID });
    if (tpvs.length > 0) {
      tpvs.forEach((tpv: any) => {
        console.log(`- ${tpv.nombre} (${tpv.codigo}): estado=${tpv.estado}, almacenId=${tpv.almacenId}`);
      });
    } else {
      console.log('No hay TPVs registrados');
    }
    console.log('TPVs activos:', tpvs.filter((t: any) => t.estado !== 'desactivado').length);

    // Verificar almacenes de la empresa
    console.log('\n=== ALMACENES ===');
    const Almacen = mongoose.model('Almacen');
    const almacenes = await Almacen.find({ empresaId: EMPRESA_ID });
    if (almacenes.length > 0) {
      almacenes.forEach((a: any) => {
        console.log(`- ID: ${a._id}, Nombre: ${a.nombre}, Codigo: ${a.codigo}`);
      });
    } else {
      console.log('No hay almacenes');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

main();
