// backend/src/modules/certificados/windows-store.service.ts

import { logError, logInfo, logWarn } from '../../utils/logger/winston.config';
import forge from 'node-forge';

// Información de un certificado del almacén de Windows
export interface WindowsCertificateInfo {
  thumbprint: string;           // Huella SHA1
  thumbprintSha256?: string;    // Huella SHA256
  subject: string;              // Subject completo
  issuer: string;               // Issuer completo
  notBefore: Date;              // Fecha inicio validez
  notAfter: Date;               // Fecha fin validez
  serialNumber: string;         // Número de serie
  friendlyName?: string;        // Nombre amigable
  hasPrivateKey: boolean;       // Si tiene clave privada asociada
  storeLocation: string;        // CurrentUser o LocalMachine
  // Información parseada
  titular: {
    nombre: string;
    nif: string;
    organizacion?: string;
  };
  emisor: {
    nombre: string;
    organizacion?: string;
  };
}

// Resultado de exportar un certificado
export interface ExportedCertificate {
  pfx: Buffer;                  // Archivo PFX en buffer
  password: string;             // Password generado para el PFX
}

class WindowsStoreService {
  private isWindows: boolean;
  private winExport: any = null;

  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Cargar la librería de Windows de forma lazy
   */
  private async loadWindowsLib(): Promise<boolean> {
    if (!this.isWindows) {
      logWarn('Windows Store: No disponible en esta plataforma');
      return false;
    }

    if (this.winExport) {
      return true;
    }

    try {
      // Importación dinámica solo en Windows
      this.winExport = await import('win-export-certificate-and-key');
      logInfo('Windows Store: Librería cargada correctamente');
      return true;
    } catch (error: any) {
      logError('Windows Store: Error cargando librería', error);
      return false;
    }
  }

  /**
   * Verificar si el almacén de Windows está disponible
   */
  async isAvailable(): Promise<boolean> {
    // Solo verificar que estamos en Windows, no necesitamos la librería para listar
    if (!this.isWindows) {
      return false;
    }

    // Verificar que PowerShell está disponible
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      await execAsync('powershell -Command "echo test"', { timeout: 5000 });
      return true;
    } catch (error) {
      logError('Windows Store: PowerShell no disponible', error);
      return false;
    }
  }

  /**
   * Parsear el subject/issuer de un certificado X509
   */
  private parseX509Name(name: string): { nombre: string; nif: string; organizacion?: string } {
    const parts: Record<string, string> = {};

    // Parsear formato DN (Distinguished Name)
    // Ejemplo: "CN=NOMBRE APELLIDO - NIF:12345678A, O=AC FNMT Usuarios, C=ES"
    const regex = /([A-Z]+)=([^,]+)/g;
    let match;
    while ((match = regex.exec(name)) !== null) {
      parts[match[1].trim()] = match[2].trim();
    }

    // Extraer NIF del CN si está presente
    let nif = parts['SERIALNUMBER'] || parts['UID'] || '';
    const cn = parts['CN'] || name;

    // Buscar NIF en el CN (formato común: "NOMBRE - NIF:12345678A")
    const nifMatch = cn.match(/NIF[:\s]*([A-Z0-9]+)/i);
    if (nifMatch && !nif) {
      nif = nifMatch[1];
    }

    // Limpiar prefijos como "IDCES-"
    if (nif.includes('-')) {
      nif = nif.split('-').pop() || nif;
    }

    return {
      nombre: cn,
      nif: nif.toUpperCase(),
      organizacion: parts['O'],
    };
  }

  /**
   * Listar certificados del almacén personal de Windows (MY)
   * Busca en CurrentUser y LocalMachine
   */
  async listarCertificados(storeName: string = 'MY'): Promise<WindowsCertificateInfo[]> {
    if (!this.isWindows) {
      return [];
    }

    try {
      // Buscar en ambos almacenes: CurrentUser y LocalMachine
      const [certsCurrentUser, certsLocalMachine] = await Promise.all([
        this.listarCertificadosConPowerShell('CurrentUser', storeName),
        this.listarCertificadosConPowerShell('LocalMachine', storeName),
      ]);

      // Combinar y eliminar duplicados por thumbprint
      const allCerts = [...certsCurrentUser, ...certsLocalMachine];
      const uniqueCerts = allCerts.filter((cert, index, self) =>
        index === self.findIndex(c => c.thumbprint === cert.thumbprint)
      );

      logInfo(`Windows Store: ${uniqueCerts.length} certificados encontrados (CurrentUser: ${certsCurrentUser.length}, LocalMachine: ${certsLocalMachine.length})`);
      return uniqueCerts;
    } catch (error: any) {
      logError('Windows Store: Error listando certificados', error);
      return [];
    }
  }

  /**
   * Listar certificados usando PowerShell
   * @param storeLocation - CurrentUser o LocalMachine
   * @param storeName - MY, ROOT, CA, etc.
   */
  private async listarCertificadosConPowerShell(storeLocation: string, storeName: string): Promise<WindowsCertificateInfo[]> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Script PowerShell en una sola línea (usando ; como separador en hashtable)
      const psScript = `Get-ChildItem -Path Cert:\\${storeLocation}\\${storeName} | Where-Object { $_.HasPrivateKey } | ForEach-Object { [PSCustomObject]@{ Thumbprint = $_.Thumbprint; Subject = $_.Subject; Issuer = $_.Issuer; StoreLocation = '${storeLocation}'; NotBefore = $_.NotBefore.ToString('o'); NotAfter = $_.NotAfter.ToString('o'); SerialNumber = $_.SerialNumber; FriendlyName = $_.FriendlyName; HasPrivateKey = $_.HasPrivateKey } } | ConvertTo-Json -Compress`;

      const { stdout } = await execAsync(`powershell -Command "${psScript}"`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (!stdout.trim()) {
        return [];
      }

      // PowerShell devuelve un objeto si es uno solo, o array si son varios
      let rawCerts = JSON.parse(stdout);
      if (!Array.isArray(rawCerts)) {
        rawCerts = [rawCerts];
      }

      return rawCerts.map((cert: any) => {
        const titular = this.parseX509Name(cert.Subject);
        const emisor = this.parseX509Name(cert.Issuer);

        return {
          thumbprint: cert.Thumbprint,
          subject: cert.Subject,
          issuer: cert.Issuer,
          notBefore: new Date(cert.NotBefore),
          notAfter: new Date(cert.NotAfter),
          serialNumber: cert.SerialNumber,
          friendlyName: cert.FriendlyName || undefined,
          hasPrivateKey: cert.HasPrivateKey,
          storeLocation: cert.StoreLocation || storeLocation,
          titular,
          emisor,
        };
      });
    } catch (error: any) {
      logError('Windows Store: Error ejecutando PowerShell', error);
      return [];
    }
  }

  /**
   * Convertir thumbprint hex string a Uint8Array
   */
  private thumbprintToUint8Array(thumbprint: string): Uint8Array {
    const hex = thumbprint.replace(/[^a-fA-F0-9]/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * Exportar un certificado del almacén de Windows como PFX
   */
  async exportarCertificado(
    thumbprint: string,
    storeLocation: string = 'LocalMachine',
    storeName: string = 'MY'
  ): Promise<ExportedCertificate | null> {
    if (!await this.loadWindowsLib()) {
      return null;
    }

    try {
      const { exportCertificateAndPrivateKeyAsync } = this.winExport;

      // Convertir thumbprint a Uint8Array
      const thumbprintBytes = this.thumbprintToUint8Array(thumbprint);

      // Determinar el tipo de almacén
      const storeType = storeLocation === 'LocalMachine'
        ? 'CERT_SYSTEM_STORE_LOCAL_MACHINE'
        : 'CERT_SYSTEM_STORE_CURRENT_USER';

      // Exportar el certificado con clave privada
      const result = await exportCertificateAndPrivateKeyAsync({
        thumbprint: thumbprintBytes,
        store: storeName,
        storeTypeList: [storeType],
        requirePrivKey: true,
      });

      if (!result || !result.pfx) {
        throw new Error('No se pudo exportar el certificado');
      }

      logInfo(`Windows Store: Certificado ${thumbprint.substring(0, 8)}... exportado`);

      return {
        pfx: result.pfx,
        password: result.passphrase,
      };
    } catch (error: any) {
      logError('Windows Store: Error exportando certificado', error);
      throw new Error(`Error exportando certificado: ${error.message}`);
    }
  }

  /**
   * Obtener información detallada de un certificado específico
   */
  async obtenerInfoCertificado(
    thumbprint: string,
    storeName: string = 'MY'
  ): Promise<WindowsCertificateInfo | null> {
    const certs = await this.listarCertificados(storeName);
    return certs.find(c => c.thumbprint.toLowerCase() === thumbprint.toLowerCase()) || null;
  }

  /**
   * Firmar datos usando un certificado del almacén de Windows
   */
  async firmarDatos(
    thumbprint: string,
    datos: string | Buffer,
    storeLocation: string = 'LocalMachine',
    storeName: string = 'MY'
  ): Promise<{ firma: string; algoritmo: string }> {
    // Exportar temporalmente el certificado para firmar
    const exported = await this.exportarCertificado(thumbprint, storeLocation, storeName);

    if (!exported) {
      throw new Error('No se pudo acceder al certificado para firmar');
    }

    try {
      // Parsear el PFX exportado
      const pfxBase64 = exported.pfx.toString('base64');
      const p12Der = forge.util.decode64(pfxBase64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, exported.password);

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

      logInfo(`Windows Store: Datos firmados con certificado ${thumbprint.substring(0, 8)}...`);

      return {
        firma: forge.util.encode64(signature),
        algoritmo: 'SHA256withRSA',
      };
    } catch (error: any) {
      logError('Windows Store: Error firmando datos', error);
      throw new Error(`Error al firmar: ${error.message}`);
    }
  }

  /**
   * Generar password temporal seguro
   */
  private generarPasswordTemporal(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(32);

    for (let i = 0; i < 32; i++) {
      password += chars[randomBytes[i] % chars.length];
    }

    return password;
  }

  /**
   * Calcular huella SHA256 de un certificado
   */
  async calcularHuellaSha256(thumbprint: string, storeLocation: string = 'LocalMachine', storeName: string = 'MY'): Promise<string | null> {
    const exported = await this.exportarCertificado(thumbprint, storeLocation, storeName);

    if (!exported) {
      return null;
    }

    try {
      const pfxBase64 = exported.pfx.toString('base64');
      const p12Der = forge.util.decode64(pfxBase64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, exported.password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        return null;
      }

      const cert = certBag[0].cert;
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();

      return forge.md.sha256.create().update(certDer).digest().toHex().toUpperCase();
    } catch (error) {
      return null;
    }
  }
}

export default new WindowsStoreService();
