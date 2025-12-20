/**
 * ================================================
 * SCRIPT DE SEED - TEXTOS LEGALES DEMOSTRATIVOS
 * ================================================
 *
 * Rellena todos los campos de textos legales, LOPD, RGPD,
 * condiciones de venta, etc. con datos demostrativos
 * profesionales para visualizar cómo quedarían impresos.
 *
 * Ejecutar con: npm run seed:textos-legales
 */

import mongoose from 'mongoose';
import Empresa from '../modules/empresa/Empresa';
import { config } from '../config/env';
import { logger } from '../config/logger';

// ⚠️ IMPORTANTE: Cambia este ID por el de tu empresa
const EMPRESA_ID = '691786dac5b0552464fb6392'; // ← CAMBIAR POR TU EMPRESA_ID

/**
 * Textos legales demostrativos profesionales
 * Basados en plantillas reales de empresas españolas
 */
const TEXTOS_LEGALES_DEMO = {
  // =====================================
  // TEXTOS PARA PRESUPUESTOS
  // =====================================
  presupuestoIntroduccion: `Estimado/a cliente,

Agradecemos sinceramente su confianza al solicitar nuestros servicios. A continuación, le presentamos el presupuesto detallado correspondiente a su solicitud.

Este documento incluye una descripción pormenorizada de los trabajos a realizar, materiales necesarios, plazos de ejecución estimados y condiciones económicas aplicables.

Quedamos a su entera disposición para resolver cualquier duda o realizar las modificaciones que considere oportunas.`,

  presupuestoCondiciones: `CONDICIONES GENERALES DEL PRESUPUESTO

1. VALIDEZ
Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión. Transcurrido este plazo, los precios podrán ser revisados.

2. FORMA DE PAGO
- 50% a la aceptación del presupuesto
- 50% restante a la finalización de los trabajos
- Pagos mediante transferencia bancaria o domiciliación

3. PLAZO DE EJECUCIÓN
El plazo estimado de ejecución comenzará a contar desde la recepción del primer pago y confirmación por escrito de la aceptación.

4. MODIFICACIONES
Cualquier modificación sobre el presente presupuesto deberá ser acordada por escrito y podrá suponer una variación en el precio y plazo de entrega.

5. GARANTÍA
Todos nuestros trabajos incluyen una garantía de 2 años conforme a la legislación vigente, salvo indicación expresa en contrario.

6. IVA
Los precios indicados NO incluyen IVA, que será aplicado según el tipo vigente en el momento de la facturación.

7. ACEPTACIÓN
La aceptación de este presupuesto implica la conformidad con todas las condiciones aquí expuestas.`,

  presupuestoPiePagina: `Este presupuesto ha sido elaborado de acuerdo con nuestras tarifas vigentes y las especificaciones proporcionadas por el cliente.
Para cualquier aclaración, no dude en contactarnos. ¡Gracias por confiar en nosotros!`,

  // =====================================
  // TEXTOS PARA FACTURAS
  // =====================================
  facturaIntroduccion: `Factura correspondiente a los servicios/productos detallados a continuación.
Agradecemos su confianza y esperamos seguir colaborando con usted.`,

  facturaCondiciones: `CONDICIONES DE PAGO Y TÉRMINOS LEGALES

FORMA DE PAGO: Según lo acordado en el presupuesto aceptado.

VENCIMIENTO: El pago deberá efectuarse en el plazo indicado. El impago en el plazo establecido devengará intereses de demora conforme al tipo de interés legal del dinero incrementado en dos puntos, sin necesidad de requerimiento previo.

RECLAMACIONES: Cualquier reclamación sobre esta factura deberá realizarse en un plazo máximo de 7 días desde su recepción.

PROPIEDAD: Hasta el completo pago de esta factura, los bienes suministrados permanecerán en propiedad del vendedor conforme al artículo 1.922 del Código Civil.

JURISDICCIÓN: Para cualquier controversia derivada de esta factura, las partes se someten a los Juzgados y Tribunales de la localidad del vendedor, con renuncia expresa a cualquier otro fuero.`,

  facturaPiePagina: `Factura emitida conforme a la normativa de facturación vigente (RD 1619/2012).
Conserve este documento como justificante de la operación realizada.`,

  // =====================================
  // TEXTOS PARA EMAILS
  // =====================================
  emailFirma: `Atentamente,

El equipo de EMPRESA DEMO S.L.

--
EMPRESA DEMO S.L.
📍 Calle Principal, 123 - 28001 Madrid
📞 +34 912 345 678
📧 info@empresademo.com
🌐 www.empresademo.com

Horario de atención: Lunes a Viernes de 9:00 a 18:00`,

  emailDisclaimer: `═══════════════════════════════════════════════════════════════
AVISO LEGAL Y DE CONFIDENCIALIDAD

Este mensaje y sus archivos adjuntos van dirigidos exclusivamente a su destinatario. Contiene información CONFIDENCIAL sometida a secreto profesional o cuya divulgación está prohibida por ley.

Si ha recibido este mensaje por error, le rogamos que nos lo comunique inmediatamente por esta misma vía y proceda a su destrucción. Queda prohibida la copia, uso o divulgación del contenido de este mensaje sin autorización.

De conformidad con el RGPD (Reglamento UE 2016/679) y la LOPDGDD (LO 3/2018), le informamos que sus datos serán tratados con la finalidad de gestionar la comunicación comercial. Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en: privacidad@empresademo.com

Este correo ha sido analizado por sistemas antivirus, pero no garantizamos la ausencia de virus. El destinatario debe verificar la seguridad del mensaje y sus adjuntos.
═══════════════════════════════════════════════════════════════`,

  // =====================================
  // TEXTOS LOPD / RGPD
  // =====================================
  textoLOPD: `INFORMACIÓN SOBRE PROTECCIÓN DE DATOS (LOPD-GDD)

De conformidad con lo establecido en la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos que:

RESPONSABLE DEL TRATAMIENTO:
• Identidad: EMPRESA DEMO S.L.
• NIF: B12345678
• Dirección: Calle Principal, 123 - 28001 Madrid
• Teléfono: +34 912 345 678
• Email DPD: protecciondatos@empresademo.com

FINALIDAD DEL TRATAMIENTO:
Sus datos personales serán tratados con las siguientes finalidades:
• Gestión de la relación comercial y contractual
• Facturación y cobro de servicios
• Envío de comunicaciones comerciales (con consentimiento previo)
• Cumplimiento de obligaciones legales

BASE LEGAL:
• Ejecución de contrato
• Consentimiento del interesado
• Cumplimiento de obligación legal
• Interés legítimo del responsable

CONSERVACIÓN:
Los datos se conservarán mientras se mantenga la relación comercial y durante los plazos legalmente establecidos para atender responsabilidades.

DESTINATARIOS:
• Administraciones Públicas para cumplimiento legal
• Entidades bancarias para gestión de cobros
• Empresas del grupo (si procede)
No se realizan transferencias internacionales de datos.

DERECHOS:
Puede ejercer sus derechos de ACCESO, RECTIFICACIÓN, SUPRESIÓN, OPOSICIÓN, LIMITACIÓN DEL TRATAMIENTO y PORTABILIDAD dirigiéndose a: protecciondatos@empresademo.com

Asimismo, tiene derecho a presentar reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).`,

  textoRGPD: `CLÁUSULA INFORMATIVA RGPD (Reglamento UE 2016/679)

En cumplimiento del Reglamento General de Protección de Datos (RGPD), le facilitamos la siguiente información:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. RESPONSABLE DEL TRATAMIENTO
Denominación: EMPRESA DEMO S.L.
CIF: B12345678
Domicilio: Calle Principal, 123 - 28001 Madrid
Delegado de Protección de Datos: dpd@empresademo.com

2. FINALIDADES DEL TRATAMIENTO
✓ Gestión administrativa, contable y fiscal
✓ Prestación de servicios contratados
✓ Gestión de consultas y solicitudes
✓ Envío de información comercial (con consentimiento)

3. LEGITIMACIÓN
• Art. 6.1.a) RGPD: Consentimiento del interesado
• Art. 6.1.b) RGPD: Ejecución de contrato
• Art. 6.1.c) RGPD: Cumplimiento obligación legal
• Art. 6.1.f) RGPD: Interés legítimo

4. DESTINATARIOS
Sus datos podrán comunicarse a:
• Administración Tributaria
• Entidades financieras
• Proveedores de servicios tecnológicos
No se realizan transferencias a terceros países.

5. PLAZO DE CONSERVACIÓN
Los datos se conservarán durante la vigencia de la relación contractual y, posteriormente, durante los plazos de prescripción legal aplicables.

6. DERECHOS DEL INTERESADO
Puede ejercitar los derechos de:
□ Acceso a sus datos personales
□ Rectificación de datos inexactos
□ Supresión de sus datos
□ Limitación del tratamiento
□ Portabilidad de datos
□ Oposición al tratamiento

Para ejercer estos derechos: privacidad@empresademo.com
Reclamaciones: Agencia Española de Protección de Datos (www.aepd.es)

7. PROCEDENCIA DE LOS DATOS
Los datos han sido facilitados por el propio interesado o su representante legal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Al mantener relación comercial con nosotros, confirma haber sido informado sobre el tratamiento de sus datos personales.`,

  // =====================================
  // POLÍTICA DE PRIVACIDAD
  // =====================================
  politicaPrivacidad: `POLÍTICA DE PRIVACIDAD

Última actualización: ${new Date().toLocaleDateString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. INFORMACIÓN AL USUARIO

EMPRESA DEMO S.L., como Responsable del Tratamiento, le informa que, según lo dispuesto en el Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD 3/2018, trataremos sus datos según se describe en esta Política de Privacidad.

2. ¿PARA QUÉ TRATAMOS SUS DATOS?

Tratamos la información que nos facilitan las personas interesadas con los siguientes fines:

• Gestionar el envío de la información que nos soliciten
• Prestar los servicios contratados
• Gestionar la facturación y cobro de servicios
• Realizar análisis de perfiles con fines comerciales
• Enviar comunicaciones comerciales personalizadas
• Gestionar las redes sociales y la participación en sorteos

3. ¿CUÁNTO TIEMPO CONSERVAMOS SUS DATOS?

Se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se recabaron y para determinar las posibles responsabilidades que se pudieran derivar de dicha finalidad y del tratamiento de los datos.

4. ¿CUÁL ES LA LEGITIMACIÓN PARA EL TRATAMIENTO?

La base legal para el tratamiento de sus datos es:
• El consentimiento del usuario
• La ejecución de un contrato
• El cumplimiento de obligaciones legales
• El interés legítimo de la empresa

5. ¿A QUÉ DESTINATARIOS SE COMUNICARÁN SUS DATOS?

Los datos podrán comunicarse a:
• Administración Tributaria
• Fuerzas y Cuerpos de Seguridad del Estado
• Juzgados y Tribunales
• Entidades bancarias (gestión de cobros)
• Proveedores de servicios (bajo contrato de encargo)

6. TRANSFERENCIAS INTERNACIONALES

No se realizan transferencias internacionales de datos.

7. ¿CUÁLES SON SUS DERECHOS?

• Derecho de acceso
• Derecho de rectificación
• Derecho de supresión
• Derecho de oposición
• Derecho de limitación del tratamiento
• Derecho a la portabilidad

Puede ejercer estos derechos enviando un email a: privacidad@empresademo.com

También puede presentar una reclamación ante la AEPD (www.aepd.es).

8. MEDIDAS DE SEGURIDAD

Hemos adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad de sus datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

  // =====================================
  // CONDICIONES DE VENTA
  // =====================================
  condicionesVenta: `CONDICIONES GENERALES DE VENTA

Última actualización: ${new Date().toLocaleDateString('es-ES')}

═══════════════════════════════════════════════════════════════

1. OBJETO Y ÁMBITO DE APLICACIÓN

Las presentes Condiciones Generales regulan la relación comercial entre EMPRESA DEMO S.L. (en adelante, "el VENDEDOR") y el CLIENTE. Al realizar un pedido, el cliente acepta íntegramente estas condiciones.

2. PEDIDOS Y ACEPTACIÓN

• Los pedidos se considerarán en firme tras la confirmación por escrito del VENDEDOR.
• El VENDEDOR se reserva el derecho de rechazar pedidos sin necesidad de justificación.
• Los errores tipográficos en catálogos o presupuestos no vinculan al VENDEDOR.

3. PRECIOS

• Los precios indicados NO incluyen IVA salvo indicación expresa.
• Los precios pueden ser modificados sin previo aviso.
• El precio aplicable será el vigente en el momento de la confirmación del pedido.
• Gastos de envío: Según tarifas vigentes comunicadas al cliente.

4. FORMA DE PAGO

• Contado: Pago previo a la entrega
• Transferencia bancaria: A la recepción de factura
• Domiciliación bancaria: Para clientes autorizados
• El impago devengará intereses de demora del 8% anual

5. ENTREGA

• Plazos orientativos, no vinculantes salvo pacto expreso
• El riesgo se transfiere con la entrega de la mercancía
• Reclamaciones por daños: 24 horas desde la recepción
• La falta de reclamación implica conformidad

6. RESERVA DE DOMINIO

La mercancía permanecerá en propiedad del VENDEDOR hasta el completo pago del precio, conforme al art. 1.922 del Código Civil.

7. GARANTÍA

• Garantía legal de 2 años para consumidores
• Garantía comercial de 1 año para empresas
• Exclusiones: Uso indebido, desgaste normal, manipulación
• Procedimiento: Comunicación por escrito con prueba de compra

8. DEVOLUCIONES

• Plazo: 14 días naturales desde la recepción
• Producto: Sin usar, en embalaje original
• Gastos de devolución: A cargo del cliente
• Reembolso: En 14 días desde la recepción del producto

9. RESPONSABILIDAD

El VENDEDOR no será responsable de:
• Daños indirectos o consecuenciales
• Pérdida de beneficios o datos
• Retrasos por causas ajenas a su control
• Fuerza mayor

10. PROTECCIÓN DE DATOS

Los datos personales serán tratados conforme a nuestra Política de Privacidad y la normativa vigente en materia de protección de datos (RGPD y LOPDGDD).

11. LEY APLICABLE Y JURISDICCIÓN

• Ley aplicable: Legislación española
• Jurisdicción: Juzgados y Tribunales de Madrid
• Las partes renuncian expresamente a cualquier otro fuero

12. MODIFICACIONES

El VENDEDOR se reserva el derecho de modificar estas condiciones en cualquier momento, siendo aplicables las vigentes en el momento del pedido.

═══════════════════════════════════════════════════════════════

Al realizar un pedido, el CLIENTE declara haber leído y aceptado íntegramente las presentes Condiciones Generales de Venta.

EMPRESA DEMO S.L.
CIF: B12345678
Calle Principal, 123 - 28001 Madrid
info@empresademo.com | www.empresademo.com`
};

/**
 * Datos de Registro Mercantil demostrativos
 */
const DATOS_REGISTRO_DEMO = {
  registroMercantil: 'Registro Mercantil de Madrid',
  tomo: '45.678',
  libro: '0',
  folio: '123',
  seccion: '8',
  hoja: 'M-987654',
  inscripcion: '1ª'
};

/**
 * Cuenta bancaria demostrativa
 */
const CUENTA_BANCARIA_DEMO = {
  alias: 'Cuenta Principal',
  titular: 'EMPRESA DEMO S.L.',
  iban: 'ES91 2100 0418 4502 0005 1332',
  swift: 'CAIXESBBXXX',
  banco: 'CaixaBank',
  sucursal: 'Oficina Principal Madrid',
  predeterminada: true,
  activa: true
};

async function seed() {
  try {
    logger.info('🌱 Iniciando seed de textos legales demostrativos...\n');

    // 1. Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a la base de datos principal');

    // 2. Obtener empresa
    logger.info(`\n🔍 Buscando empresa con ID: ${EMPRESA_ID}`);

    const empresa = await Empresa.findById(EMPRESA_ID);

    if (!empresa) {
      throw new Error(`❌ Empresa con ID ${EMPRESA_ID} no encontrada`);
    }

    logger.info(`✅ Empresa encontrada: ${empresa.nombre}`);
    logger.info(`📊 NIF: ${empresa.nif}`);

    // 3. Mostrar resumen de lo que se va a actualizar
    logger.info('\n' + '═'.repeat(60));
    logger.info('📝 TEXTOS LEGALES A ACTUALIZAR:');
    logger.info('═'.repeat(60));

    const campos = Object.keys(TEXTOS_LEGALES_DEMO);
    campos.forEach((campo, index) => {
      const valor = TEXTOS_LEGALES_DEMO[campo as keyof typeof TEXTOS_LEGALES_DEMO];
      const preview = valor.substring(0, 50).replace(/\n/g, ' ') + '...';
      logger.info(`${index + 1}. ${campo}`);
      logger.info(`   Preview: "${preview}"`);
    });

    logger.info('\n📋 DATOS DE REGISTRO MERCANTIL:');
    Object.entries(DATOS_REGISTRO_DEMO).forEach(([key, value]) => {
      logger.info(`   ${key}: ${value}`);
    });

    logger.info('\n' + '═'.repeat(60));
    logger.info(`⚠️  ATENCIÓN: Se actualizarán los textos legales de:`);
    logger.info(`   Empresa: ${empresa.nombre}`);
    logger.info(`   ID: ${EMPRESA_ID}`);
    logger.info(`\n   Si estos datos NO son correctos, cancela ahora (Ctrl+C)`);
    logger.info('═'.repeat(60) + '\n');

    // Esperar 3 segundos para que el usuario pueda cancelar
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Actualizar textos legales
    logger.info('💾 Actualizando textos legales...');

    // Verificar si ya tiene cuentas bancarias
    const tieneCuentas = empresa.cuentasBancarias && empresa.cuentasBancarias.length > 0;

    const updateData: any = {
      textosLegales: TEXTOS_LEGALES_DEMO,
      datosRegistro: DATOS_REGISTRO_DEMO
    };

    // Solo añadir cuenta bancaria si no tiene ninguna
    if (!tieneCuentas) {
      updateData.cuentasBancarias = [CUENTA_BANCARIA_DEMO];
      logger.info('   📎 Añadiendo cuenta bancaria demostrativa');
    } else {
      logger.info('   ℹ️  Ya tiene cuentas bancarias configuradas, no se añadirán nuevas');
    }

    const updateResult = await Empresa.findByIdAndUpdate(
      EMPRESA_ID,
      { $set: updateData },
      { new: true }
    );

    if (!updateResult) {
      throw new Error('❌ Error al actualizar la empresa');
    }

    // 5. Mostrar resumen
    logger.info('\n' + '═'.repeat(60));
    logger.info('✅ ACTUALIZACIÓN COMPLETADA CON ÉXITO');
    logger.info('═'.repeat(60));

    logger.info('\n📊 Resumen de campos actualizados:');
    logger.info('   Textos Legales:');
    logger.info('   ├── Presupuestos: Introducción, Condiciones, Pie de página');
    logger.info('   ├── Facturas: Introducción, Condiciones, Pie de página');
    logger.info('   ├── Emails: Firma, Disclaimer');
    logger.info('   ├── LOPD: Texto completo');
    logger.info('   ├── RGPD: Cláusula informativa');
    logger.info('   ├── Política de Privacidad');
    logger.info('   └── Condiciones de Venta');

    logger.info('\n   Datos de Registro Mercantil:');
    logger.info(`   ├── Registro: ${DATOS_REGISTRO_DEMO.registroMercantil}`);
    logger.info(`   ├── Tomo: ${DATOS_REGISTRO_DEMO.tomo}`);
    logger.info(`   ├── Folio: ${DATOS_REGISTRO_DEMO.folio}`);
    logger.info(`   └── Hoja: ${DATOS_REGISTRO_DEMO.hoja}`);

    logger.info('\n💡 Para ver los textos actualizados:');
    logger.info('   1. Accede a Configuración > Textos Legales');
    logger.info('   2. Crea un presupuesto o factura para ver la vista previa');
    logger.info('   3. Genera un PDF para comprobar el resultado final');

  } catch (error: any) {
    logger.error('\n❌ Error en el seed:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    // Cerrar conexión
    logger.info('\n🔌 Cerrando conexión...');
    await mongoose.connection.close();
    logger.info('✅ Conexión cerrada');
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
