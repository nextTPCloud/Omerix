// backend/src/modules/certificados/certificados.service.ts

import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import forge from 'node-forge';
import {
  CertificadoElectronico,
  ICertificadoElectronico,
  TipoCertificado,
  EstadoCertificado,
  UsosCertificado,
  OrigenCertificado,
} from './certificados.schema';
import { logError, logInfo, logWarn } from '@/utils/logger/winston.config';
import windowsStoreService, { WindowsCertificateInfo } from './windows-store.service';

// Importar modelo Usuario para que Mongoose lo registre antes del populate
import '@/modules/usuarios/Usuario';

// ============================================
// INTERFACES
// ============================================

export interface SubirCertificadoDTO {
  nombre: string;
  descripcion?: string;
  tipo?: TipoCertificado;
  usos?: UsosCertificado[];
  predeterminado?: boolean;
  archivoBase64: string; // Contenido del .p12/.pfx en Base64
  nombreArchivo: string;
  password: string;
}

export interface ActualizarCertificadoDTO {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoCertificado;
  usos?: UsosCertificado[];
  predeterminado?: boolean;
  activo?: boolean;
}

// DTO para registrar un certificado del almacén de Windows
export interface RegistrarCertificadoWindowsDTO {
  nombre: string;
  descripcion?: string;
  tipo?: TipoCertificado;
  usos?: UsosCertificado[];
  predeterminado?: boolean;
  thumbprint: string;         // Huella SHA1 del certificado en Windows
  storeLocation?: string;     // CurrentUser o LocalMachine
  storeName?: string;         // Almacén (MY por defecto)
}

export interface InfoCertificado {
  titular: {
    nombre: string;
    nif: string;
    organizacion?: string;
  };
  emisor: {
    nombre: string;
    organizacion?: string;
  };
  fechaEmision: Date;
  fechaExpiracion: Date;
  numeroSerie: string;
  huella: {
    sha1: string;
    sha256: string;
  };
}

// ============================================
// SERVICIO DE CERTIFICADOS
// ============================================

class CertificadosService {
  /**
   * Parsear y validar un certificado .p12/.pfx
   */
  async parsearCertificado(
    archivoBase64: string,
    password: string
  ): Promise<InfoCertificado> {
    try {
      // Decodificar base64
      const p12Der = forge.util.decode64(archivoBase64);

      // Parsear el PKCS#12
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Obtener los bags del certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0) {
        throw new Error('No se encontró certificado en el archivo');
      }

      // Obtener el certificado principal
      const cert = certBag[0].cert;
      if (!cert) {
        throw new Error('Certificado inválido');
      }

      // Extraer información del sujeto (titular)
      const subject = cert.subject.attributes;
      const issuer = cert.issuer.attributes;

      const getAttr = (attrs: any[], name: string): string => {
        const attr = attrs.find(a =>
          a.shortName === name ||
          a.name === name ||
          a.type === name
        );
        return attr?.value || '';
      };

      // Extraer NIF del certificado (puede estar en varios campos)
      let nif = getAttr(subject, 'serialNumber') ||
                getAttr(subject, 'UID') ||
                getAttr(subject, '2.5.4.5'); // OID para serialNumber

      // Limpiar NIF (quitar prefijos como "IDCES-")
      if (nif.includes('-')) {
        nif = nif.split('-').pop() || nif;
      }

      // Calcular huellas digitales
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      const sha1 = forge.md.sha1.create().update(certDer).digest().toHex().toUpperCase();
      const sha256 = forge.md.sha256.create().update(certDer).digest().toHex().toUpperCase();

      // Número de serie
      const serialNumber = cert.serialNumber;

      return {
        titular: {
          nombre: getAttr(subject, 'CN') || getAttr(subject, 'commonName'),
          nif: nif.toUpperCase(),
          organizacion: getAttr(subject, 'O') || getAttr(subject, 'organizationName'),
        },
        emisor: {
          nombre: getAttr(issuer, 'CN') || getAttr(issuer, 'commonName'),
          organizacion: getAttr(issuer, 'O') || getAttr(issuer, 'organizationName'),
        },
        fechaEmision: cert.validity.notBefore,
        fechaExpiracion: cert.validity.notAfter,
        numeroSerie: serialNumber,
        huella: {
          sha1,
          sha256,
        },
      };
    } catch (error: any) {
      if (error.message?.includes('Invalid password') ||
          error.message?.includes('PKCS#12 MAC could not be verified')) {
        throw new Error('Contraseña del certificado incorrecta');
      }
      logError('Error parseando certificado', error);
      throw new Error(`Error al procesar el certificado: ${error.message}`);
    }
  }

  /**
   * Subir y registrar un nuevo certificado
   */
  async subir(
    dto: SubirCertificadoDTO,
    empresaId: string,
    usuarioId: string
  ): Promise<ICertificadoElectronico> {
    try {
      // 1. Parsear y validar el certificado
      const infoCert = await this.parsearCertificado(dto.archivoBase64, dto.password);

      // 2. Verificar que no esté caducado
      if (new Date() > infoCert.fechaExpiracion) {
        throw new Error('El certificado está caducado');
      }

      // 3. Verificar que no exista ya este certificado
      const existente = await CertificadoElectronico.findOne({
        empresaId,
        'huella.sha256': infoCert.huella.sha256,
      });

      if (existente) {
        throw new Error('Este certificado ya está registrado');
      }

      // 4. Si es predeterminado, quitar flag de otros
      if (dto.predeterminado) {
        await CertificadoElectronico.updateMany(
          { empresaId, predeterminado: true },
          { $set: { predeterminado: false } }
        );
      }

      // 5. Determinar tipo de archivo
      const tipoArchivo = dto.nombreArchivo.toLowerCase().endsWith('.pfx') ? 'pfx' : 'p12';

      // 6. Calcular tamaño del archivo
      const tamaño = Buffer.from(dto.archivoBase64, 'base64').length;

      // 7. Crear el certificado
      const certificado = new CertificadoElectronico({
        _id: new mongoose.Types.ObjectId(),
        empresaId: new Types.ObjectId(empresaId),
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipo: dto.tipo || TipoCertificado.PERSONA_JURIDICA,
        estado: EstadoCertificado.ACTIVO,
        titular: infoCert.titular,
        emisor: infoCert.emisor,
        fechaEmision: infoCert.fechaEmision,
        fechaExpiracion: infoCert.fechaExpiracion,
        numeroSerie: infoCert.numeroSerie,
        archivo: {
          nombre: dto.nombreArchivo,
          contenido: dto.archivoBase64, // Se encripta en el middleware pre-save
          tipo: tipoArchivo,
          tamaño,
        },
        password: dto.password, // Se encripta en el middleware pre-save
        huella: infoCert.huella,
        usos: dto.usos || [UsosCertificado.TODOS],
        predeterminado: dto.predeterminado || false,
        activo: true,
        contadorUsos: 0,
        creadoPor: new Types.ObjectId(usuarioId),
        fechaCreacion: new Date(),
      });

      await certificado.save();

      logInfo('Certificado subido correctamente', {
        empresaId,
        nombre: dto.nombre,
        titular: infoCert.titular.nif,
        expira: infoCert.fechaExpiracion,
      });

      return certificado;
    } catch (error: any) {
      logError('Error subiendo certificado', error);
      throw error;
    }
  }

  /**
   * Obtener certificados de una empresa
   */
  async listar(empresaId: string): Promise<ICertificadoElectronico[]> {
    return CertificadoElectronico.find({ empresaId })
      .sort({ predeterminado: -1, fechaCreacion: -1 })
      .populate('creadoPor', 'nombre apellidos email');
  }

  /**
   * Obtener un certificado por ID
   */
  async obtenerPorId(
    id: string,
    empresaId: string
  ): Promise<ICertificadoElectronico | null> {
    return CertificadoElectronico.findOne({ _id: id, empresaId })
      .populate('creadoPor', 'nombre apellidos email');
  }

  /**
   * Obtener certificado predeterminado de una empresa
   */
  async obtenerPredeterminado(
    empresaId: string
  ): Promise<ICertificadoElectronico | null> {
    return CertificadoElectronico.findOne({
      empresaId,
      predeterminado: true,
      activo: true,
      estado: EstadoCertificado.ACTIVO,
    }).select('+archivo.contenido +password');
  }

  /**
   * Obtener certificado con contenido para firmar
   */
  async obtenerParaFirmar(
    id: string,
    empresaId: string
  ): Promise<ICertificadoElectronico | null> {
    const cert = await CertificadoElectronico.findOne({
      _id: id,
      empresaId,
      activo: true,
      estado: EstadoCertificado.ACTIVO,
    }).select('+archivo.contenido +password');

    if (cert) {
      // Actualizar estadísticas de uso
      await CertificadoElectronico.updateOne(
        { _id: id },
        {
          $set: { ultimoUso: new Date() },
          $inc: { contadorUsos: 1 },
        }
      );
    }

    return cert;
  }

  /**
   * Actualizar un certificado
   */
  async actualizar(
    id: string,
    dto: ActualizarCertificadoDTO,
    empresaId: string,
    usuarioId: string
  ): Promise<ICertificadoElectronico | null> {
    const certificado = await CertificadoElectronico.findOne({ _id: id, empresaId });

    if (!certificado) {
      throw new Error('Certificado no encontrado');
    }

    // Si se marca como predeterminado, quitar flag de otros
    if (dto.predeterminado && !certificado.predeterminado) {
      await CertificadoElectronico.updateMany(
        { empresaId, predeterminado: true, _id: { $ne: id } },
        { $set: { predeterminado: false } }
      );
    }

    // Actualizar campos
    if (dto.nombre !== undefined) certificado.nombre = dto.nombre;
    if (dto.descripcion !== undefined) certificado.descripcion = dto.descripcion;
    if (dto.tipo !== undefined) certificado.tipo = dto.tipo;
    if (dto.usos !== undefined) certificado.usos = dto.usos;
    if (dto.predeterminado !== undefined) certificado.predeterminado = dto.predeterminado;
    if (dto.activo !== undefined) certificado.activo = dto.activo;

    certificado.modificadoPor = new Types.ObjectId(usuarioId);
    certificado.fechaModificacion = new Date();

    await certificado.save();

    return certificado;
  }

  /**
   * Eliminar un certificado
   */
  async eliminar(id: string, empresaId: string): Promise<boolean> {
    const result = await CertificadoElectronico.deleteOne({ _id: id, empresaId });
    return result.deletedCount > 0;
  }

  /**
   * Validar que un certificado puede usarse para un fin específico
   */
  async validarParaUso(
    id: string,
    empresaId: string,
    uso: UsosCertificado
  ): Promise<{ valido: boolean; mensaje: string }> {
    const cert = await CertificadoElectronico.findOne({ _id: id, empresaId });

    if (!cert) {
      return { valido: false, mensaje: 'Certificado no encontrado' };
    }

    if (!cert.activo) {
      return { valido: false, mensaje: 'El certificado está desactivado' };
    }

    if (cert.estado === EstadoCertificado.CADUCADO) {
      return { valido: false, mensaje: 'El certificado está caducado' };
    }

    if (cert.estado === EstadoCertificado.REVOCADO) {
      return { valido: false, mensaje: 'El certificado está revocado' };
    }

    if (new Date() > cert.fechaExpiracion) {
      // Actualizar estado
      await CertificadoElectronico.updateOne(
        { _id: id },
        { $set: { estado: EstadoCertificado.CADUCADO } }
      );
      return { valido: false, mensaje: 'El certificado ha caducado' };
    }

    // Verificar si el uso está permitido
    if (!cert.usos.includes(UsosCertificado.TODOS) && !cert.usos.includes(uso)) {
      return { valido: false, mensaje: `El certificado no está autorizado para ${uso}` };
    }

    return { valido: true, mensaje: 'Certificado válido' };
  }

  /**
   * Obtener certificados próximos a caducar
   */
  async obtenerProximosACaducar(diasAntes: number = 30): Promise<ICertificadoElectronico[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAntes);

    return CertificadoElectronico.find({
      activo: true,
      estado: EstadoCertificado.ACTIVO,
      fechaExpiracion: { $lte: fechaLimite },
    }).populate('empresaId', 'nombre nif email');
  }

  /**
   * Verificar y actualizar estados de certificados caducados
   */
  async actualizarEstadosCaducados(): Promise<number> {
    const result = await CertificadoElectronico.updateMany(
      {
        estado: EstadoCertificado.ACTIVO,
        fechaExpiracion: { $lt: new Date() },
      },
      { $set: { estado: EstadoCertificado.CADUCADO } }
    );

    if (result.modifiedCount > 0) {
      logWarn(`${result.modifiedCount} certificados marcados como caducados`);
    }

    return result.modifiedCount;
  }

  /**
   * Firmar datos con el certificado
   */
  async firmarDatos(
    certificadoId: string,
    empresaId: string,
    datos: string | Buffer
  ): Promise<{ firma: string; algoritmo: string }> {
    const cert = await this.obtenerParaFirmar(certificadoId, empresaId);

    if (!cert) {
      throw new Error('Certificado no encontrado o no disponible');
    }

    try {
      // Desencriptar contenido y password
      const contenidoBase64 = cert.obtenerContenidoDesencriptado();
      const password = cert.obtenerPasswordDesencriptado();

      // Parsear el certificado
      const p12Der = forge.util.decode64(contenidoBase64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Obtener la clave privada
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new Error('No se encontró clave privada en el certificado');
      }

      const privateKey = keyBag[0].key;

      // Crear firma SHA-256 con RSA
      const md = forge.md.sha256.create();
      md.update(typeof datos === 'string' ? datos : datos.toString('binary'), 'raw');

      const signature = (privateKey as forge.pki.rsa.PrivateKey).sign(md);

      return {
        firma: forge.util.encode64(signature),
        algoritmo: 'SHA256withRSA',
      };
    } catch (error: any) {
      logError('Error firmando datos', error);
      throw new Error(`Error al firmar: ${error.message}`);
    }
  }

  // ============================================
  // MÉTODOS PARA WINDOWS STORE
  // ============================================

  /**
   * Verificar si el almacén de Windows está disponible
   */
  async windowsStoreDisponible(): Promise<boolean> {
    return await windowsStoreService.isAvailable();
  }

  /**
   * Listar certificados disponibles en el almacén de Windows
   */
  async listarCertificadosWindows(storeName: string = 'MY'): Promise<WindowsCertificateInfo[]> {
    return await windowsStoreService.listarCertificados(storeName);
  }

  /**
   * Registrar un certificado del almacén de Windows
   */
  async registrarCertificadoWindows(
    dto: RegistrarCertificadoWindowsDTO,
    empresaId: string,
    usuarioId: string
  ): Promise<ICertificadoElectronico> {
    try {
      const storeName = dto.storeName || 'MY';
      const storeLocation = dto.storeLocation || 'LocalMachine';

      // 1. Obtener info del certificado desde Windows Store
      const infoCert = await windowsStoreService.obtenerInfoCertificado(dto.thumbprint, storeName);

      if (!infoCert) {
        throw new Error('Certificado no encontrado en el almacén de Windows');
      }

      // 2. Verificar que no esté caducado
      if (new Date() > infoCert.notAfter) {
        throw new Error('El certificado está caducado');
      }

      // 3. Calcular huella SHA256
      const sha256 = await windowsStoreService.calcularHuellaSha256(dto.thumbprint, storeLocation, storeName);

      if (!sha256) {
        throw new Error('No se pudo calcular la huella SHA256 del certificado');
      }

      // 4. Verificar que no exista ya este certificado
      const existente = await CertificadoElectronico.findOne({
        empresaId,
        'huella.sha256': sha256,
      });

      if (existente) {
        throw new Error('Este certificado ya está registrado');
      }

      // 5. Si es predeterminado, quitar flag de otros
      if (dto.predeterminado) {
        await CertificadoElectronico.updateMany(
          { empresaId, predeterminado: true },
          { $set: { predeterminado: false } }
        );
      }

      // 6. Crear el registro del certificado
      const certificado = new CertificadoElectronico({
        _id: new mongoose.Types.ObjectId(),
        empresaId: new Types.ObjectId(empresaId),
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipo: dto.tipo || TipoCertificado.PERSONA_JURIDICA,
        estado: EstadoCertificado.ACTIVO,
        origen: OrigenCertificado.WINDOWS_STORE,
        titular: infoCert.titular,
        emisor: infoCert.emisor,
        fechaEmision: infoCert.notBefore,
        fechaExpiracion: infoCert.notAfter,
        numeroSerie: infoCert.serialNumber,
        windowsStore: {
          storeName,
          storeLocation,
          thumbprint: dto.thumbprint,
          friendlyName: infoCert.friendlyName,
        },
        huella: {
          sha1: dto.thumbprint.toUpperCase(),
          sha256,
        },
        usos: dto.usos || [UsosCertificado.TODOS],
        predeterminado: dto.predeterminado || false,
        activo: true,
        contadorUsos: 0,
        creadoPor: new Types.ObjectId(usuarioId),
        fechaCreacion: new Date(),
      });

      await certificado.save();

      logInfo('Certificado de Windows Store registrado', {
        empresaId,
        nombre: dto.nombre,
        titular: infoCert.titular.nif,
        thumbprint: dto.thumbprint.substring(0, 8) + '...',
      });

      return certificado;
    } catch (error: any) {
      logError('Error registrando certificado de Windows Store', error);
      throw error;
    }
  }

  /**
   * Firmar datos con un certificado (soporta ambos orígenes)
   */
  async firmarDatosUnificado(
    certificadoId: string,
    empresaId: string,
    datos: string | Buffer
  ): Promise<{ firma: string; algoritmo: string }> {
    // Obtener el certificado con su información completa
    const cert = await CertificadoElectronico.findOne({
      _id: certificadoId,
      empresaId,
      activo: true,
      estado: EstadoCertificado.ACTIVO,
    }).select('+archivo.contenido +password');

    if (!cert) {
      throw new Error('Certificado no encontrado o no disponible');
    }

    // Actualizar estadísticas de uso
    await CertificadoElectronico.updateOne(
      { _id: certificadoId },
      {
        $set: { ultimoUso: new Date() },
        $inc: { contadorUsos: 1 },
      }
    );

    // Según el origen, firmar de forma diferente
    if (cert.origen === OrigenCertificado.WINDOWS_STORE) {
      // Firmar usando Windows Store
      if (!cert.windowsStore?.thumbprint) {
        throw new Error('Información de Windows Store no disponible');
      }

      return await windowsStoreService.firmarDatos(
        cert.windowsStore.thumbprint,
        datos,
        cert.windowsStore.storeName || 'MY'
      );
    } else {
      // Firmar usando archivo (método original)
      return await this.firmarDatos(certificadoId, empresaId, datos);
    }
  }
}

export default new CertificadosService();
