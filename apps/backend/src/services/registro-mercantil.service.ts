/**
 * Servicio de Verificación del Registro Mercantil
 *
 * Verifica la existencia y validez de empresas españolas consultando
 * fuentes oficiales y servicios de verificación.
 *
 * En desarrollo: Permite continuar con advertencia si no se puede verificar
 * En producción: Requiere verificación exitosa para proceder
 */

import axios from 'axios';

// Resultado de la verificación
export interface VerificacionResult {
  verificado: boolean;
  encontrado: boolean;
  datosOficiales?: {
    nombreFiscal?: string;
    nombreComercial?: string;
    nif?: string;
    fechaConstitucion?: Date;
    domicilioSocial?: string;
    objetoSocial?: string;
    capitalSocial?: number;
    estado?: 'activa' | 'inactiva' | 'disuelta' | 'concurso';
    registroMercantil?: string;
    tomo?: string;
    folio?: string;
    hoja?: string;
  };
  advertencias: string[];
  errores: string[];
  fuenteVerificacion?: string;
}

// Datos de entrada para verificar
export interface DatosVerificacion {
  nif: string;
  nombre: string;
  nombreComercial?: string;
}

class RegistroMercantilService {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Verifica una empresa en el Registro Mercantil
   */
  async verificarEmpresa(datos: DatosVerificacion): Promise<VerificacionResult> {
    const resultado: VerificacionResult = {
      verificado: false,
      encontrado: false,
      advertencias: [],
      errores: [],
    };

    // 1. Validar formato del NIF/CIF
    const validacionNIF = this.validarNIF(datos.nif);
    if (!validacionNIF.valido) {
      resultado.errores.push(validacionNIF.mensaje || 'NIF/CIF no válido');
      return this.finalizarVerificacion(resultado);
    }

    // 2. Determinar tipo de entidad por el NIF
    const tipoEntidad = this.determinarTipoEntidad(datos.nif);
    resultado.fuenteVerificacion = `Validación de formato ${tipoEntidad}`;

    // 3. Intentar verificar en fuentes oficiales
    try {
      // Intentar consulta al servicio de la AEAT (verificación de NIF)
      const verificacionAEAT = await this.verificarNIFAEAT(datos.nif);
      if (verificacionAEAT.encontrado) {
        resultado.encontrado = true;
        resultado.datosOficiales = {
          ...resultado.datosOficiales,
          ...verificacionAEAT.datos,
        };
        resultado.fuenteVerificacion = 'AEAT - Verificación NIF';
      }
    } catch (error: any) {
      resultado.advertencias.push(`No se pudo verificar en AEAT: ${error.message}`);
    }

    // 4. Si es una sociedad, intentar verificar en el Registro Mercantil
    if (this.esSociedad(datos.nif)) {
      try {
        const verificacionRM = await this.consultarRegistroMercantil(datos.nif, datos.nombre);
        if (verificacionRM.encontrado) {
          resultado.encontrado = true;
          resultado.datosOficiales = {
            ...resultado.datosOficiales,
            ...verificacionRM.datos,
          };
          resultado.fuenteVerificacion = 'Registro Mercantil Central';
        }
      } catch (error: any) {
        resultado.advertencias.push(`No se pudo consultar Registro Mercantil: ${error.message}`);
      }
    }

    // 5. Verificar coincidencia de nombre si se encontró
    if (resultado.encontrado && resultado.datosOficiales?.nombreFiscal) {
      const nombreNormalizado = this.normalizarNombre(datos.nombre);
      const nombreOficialNormalizado = this.normalizarNombre(resultado.datosOficiales.nombreFiscal);

      if (nombreNormalizado !== nombreOficialNormalizado) {
        resultado.advertencias.push(
          `El nombre proporcionado "${datos.nombre}" no coincide exactamente con el nombre oficial "${resultado.datosOficiales.nombreFiscal}"`
        );
      }
    }

    return this.finalizarVerificacion(resultado);
  }

  /**
   * Valida el formato de un NIF/CIF español
   */
  validarNIF(nif: string): { valido: boolean; mensaje?: string; tipo?: string } {
    if (!nif || nif.length < 8 || nif.length > 9) {
      return { valido: false, mensaje: 'El NIF/CIF debe tener entre 8 y 9 caracteres' };
    }

    const nifLimpio = nif.toUpperCase().replace(/[\s-]/g, '');

    // DNI: 8 dígitos + letra
    const regexDNI = /^[0-9]{8}[A-Z]$/;
    if (regexDNI.test(nifLimpio)) {
      const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const numero = parseInt(nifLimpio.substring(0, 8), 10);
      const letraCalculada = letras[numero % 23];
      const letraProporcionada = nifLimpio.charAt(8);

      if (letraCalculada === letraProporcionada) {
        return { valido: true, tipo: 'DNI' };
      } else {
        return { valido: false, mensaje: 'La letra del DNI no es correcta' };
      }
    }

    // NIE: X, Y, Z + 7 dígitos + letra
    const regexNIE = /^[XYZ][0-9]{7}[A-Z]$/;
    if (regexNIE.test(nifLimpio)) {
      let nieConvertido = nifLimpio;
      nieConvertido = nieConvertido.replace('X', '0');
      nieConvertido = nieConvertido.replace('Y', '1');
      nieConvertido = nieConvertido.replace('Z', '2');

      const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const numero = parseInt(nieConvertido.substring(0, 8), 10);
      const letraCalculada = letras[numero % 23];
      const letraProporcionada = nifLimpio.charAt(8);

      if (letraCalculada === letraProporcionada) {
        return { valido: true, tipo: 'NIE' };
      } else {
        return { valido: false, mensaje: 'La letra del NIE no es correcta' };
      }
    }

    // CIF: Letra + 7 dígitos + dígito/letra de control
    const regexCIF = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/;
    if (regexCIF.test(nifLimpio)) {
      const validacionCIF = this.validarCIF(nifLimpio);
      if (validacionCIF) {
        return { valido: true, tipo: 'CIF' };
      } else {
        return { valido: false, mensaje: 'El dígito de control del CIF no es correcto' };
      }
    }

    return { valido: false, mensaje: 'El formato del NIF/CIF no es válido' };
  }

  /**
   * Valida el dígito de control de un CIF
   */
  private validarCIF(cif: string): boolean {
    const letrasControl = 'JABCDEFGHI';
    const letrasNumero = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const letrasLetra = ['K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'W'];

    const primeraLetra = cif.charAt(0);
    const ultimoCaracter = cif.charAt(8);
    const digitos = cif.substring(1, 8);

    // Calcular dígito de control
    let sumaPares = 0;
    let sumaImpares = 0;

    for (let i = 0; i < digitos.length; i++) {
      const digito = parseInt(digitos.charAt(i), 10);
      if (i % 2 === 0) {
        // Posiciones impares (1, 3, 5, 7): multiplicar por 2
        const doble = digito * 2;
        sumaImpares += Math.floor(doble / 10) + (doble % 10);
      } else {
        // Posiciones pares (2, 4, 6): sumar directamente
        sumaPares += digito;
      }
    }

    const sumaTotal = sumaPares + sumaImpares;
    const digitoControl = (10 - (sumaTotal % 10)) % 10;

    // Verificar según tipo de entidad
    if (letrasNumero.includes(primeraLetra)) {
      // El control debe ser un dígito
      return ultimoCaracter === digitoControl.toString();
    } else if (letrasLetra.includes(primeraLetra)) {
      // El control debe ser una letra
      return ultimoCaracter === letrasControl.charAt(digitoControl);
    } else {
      // Puede ser dígito o letra
      return ultimoCaracter === digitoControl.toString() ||
             ultimoCaracter === letrasControl.charAt(digitoControl);
    }
  }

  /**
   * Determina el tipo de entidad por la primera letra del CIF
   */
  private determinarTipoEntidad(nif: string): string {
    const primeraLetra = nif.charAt(0).toUpperCase();

    const tipos: Record<string, string> = {
      'A': 'Sociedad Anónima',
      'B': 'Sociedad de Responsabilidad Limitada',
      'C': 'Sociedad Colectiva',
      'D': 'Sociedad Comanditaria',
      'E': 'Comunidad de Bienes',
      'F': 'Sociedad Cooperativa',
      'G': 'Asociación',
      'H': 'Comunidad de Propietarios',
      'J': 'Sociedad Civil',
      'K': 'Persona Física Residente (menor de 14 años)',
      'L': 'Persona Física Residente (mayor de 14 años sin DNI)',
      'M': 'Persona Física Residente (extranjero sin NIE)',
      'N': 'Entidad Extranjera',
      'P': 'Corporación Local',
      'Q': 'Organismo Público',
      'R': 'Congregación o Institución Religiosa',
      'S': 'Órgano de la Administración del Estado',
      'U': 'Unión Temporal de Empresas',
      'V': 'Otros tipos de entidad',
      'W': 'Establecimiento permanente de entidad no residente',
      'X': 'Extranjero identificado por la policía (NIE)',
      'Y': 'Extranjero identificado por la policía (NIE)',
      'Z': 'Extranjero identificado por la policía (NIE)',
    };

    return tipos[primeraLetra] || 'Persona Física';
  }

  /**
   * Determina si el NIF corresponde a una sociedad mercantil
   */
  private esSociedad(nif: string): boolean {
    const primeraLetra = nif.charAt(0).toUpperCase();
    // A, B, C, D, E, F son sociedades que deben estar en el Registro Mercantil
    return ['A', 'B', 'C', 'D', 'E', 'F', 'U'].includes(primeraLetra);
  }

  /**
   * Intenta verificar el NIF en el servicio de la AEAT
   * Nota: Este es un servicio simulado. En producción se usaría el servicio real de la AEAT
   */
  private async verificarNIFAEAT(nif: string): Promise<{ encontrado: boolean; datos?: any }> {
    // En un entorno real, aquí se haría la llamada al servicio web de la AEAT
    // Por ahora, solo validamos el formato y simulamos la respuesta

    if (this.isDevelopment) {
      // En desarrollo, simulamos que el NIF existe si el formato es válido
      const validacion = this.validarNIF(nif);
      return {
        encontrado: validacion.valido,
        datos: validacion.valido ? { nif: nif.toUpperCase() } : undefined,
      };
    }

    // En producción, intentar consultar el servicio real
    // TODO: Implementar integración real con AEAT
    // Por ahora lanzamos error para que se registre como advertencia
    throw new Error('Servicio AEAT no disponible - implementación pendiente');
  }

  /**
   * Consulta el Registro Mercantil Central
   * Nota: Requiere integración con el servicio real del Registro Mercantil
   */
  private async consultarRegistroMercantil(nif: string, nombre: string): Promise<{ encontrado: boolean; datos?: any }> {
    if (this.isDevelopment) {
      // En desarrollo, simulamos que la empresa existe si el formato del NIF es válido
      const validacion = this.validarNIF(nif);
      return {
        encontrado: validacion.valido && this.esSociedad(nif),
        datos: validacion.valido ? {
          nombreFiscal: nombre,
          nif: nif.toUpperCase(),
          estado: 'activa',
        } : undefined,
      };
    }

    // En producción, consultar el servicio real
    // Opciones:
    // 1. API del Registro Mercantil Central (requiere suscripción)
    // 2. Servicios como Axesor, Informa D&B
    // 3. Consulta al BORME

    // TODO: Implementar integración real
    throw new Error('Servicio Registro Mercantil no disponible - implementación pendiente');
  }

  /**
   * Normaliza un nombre de empresa para comparación
   */
  private normalizarNombre(nombre: string): string {
    return nombre
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[.,;:'"!?¿¡()[\]{}<>]/g, '') // Eliminar puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/\bS\.?L\.?U?\.?\b/gi, 'SL') // Normalizar S.L., S.L.U., etc.
      .replace(/\bS\.?A\.?\b/gi, 'SA') // Normalizar S.A.
      .replace(/\bSOCIEDAD LIMITADA\b/gi, 'SL')
      .replace(/\bSOCIEDAD ANONIMA\b/gi, 'SA')
      .trim();
  }

  /**
   * Finaliza la verificación determinando el estado final
   */
  private finalizarVerificacion(resultado: VerificacionResult): VerificacionResult {
    // Si hay errores, la verificación falla
    if (resultado.errores.length > 0) {
      resultado.verificado = false;
      return resultado;
    }

    // Si encontramos la empresa, la verificación es exitosa
    if (resultado.encontrado) {
      resultado.verificado = true;
      return resultado;
    }

    // Si no encontramos pero estamos en desarrollo, permitir con advertencia
    if (this.isDevelopment) {
      resultado.verificado = true;
      resultado.advertencias.push(
        'No se pudo verificar la empresa en fuentes oficiales. ' +
        'En producción, este registro no sería permitido.'
      );
      return resultado;
    }

    // En producción, si no se encuentra, la verificación falla
    resultado.verificado = false;
    resultado.errores.push(
      'No se pudo verificar la empresa en el Registro Mercantil. ' +
      'Por favor, verifique que los datos sean correctos.'
    );

    return resultado;
  }

  /**
   * Verifica solo el NIF sin consultar fuentes externas
   * Útil para validación rápida en formularios
   */
  validarSoloNIF(nif: string): { valido: boolean; tipo?: string; mensaje?: string } {
    return this.validarNIF(nif);
  }
}

export const registroMercantilService = new RegistroMercantilService();
export default registroMercantilService;
