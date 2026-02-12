import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import config from '@/config/env';

interface UploadOptions {
  empresaId: string;
  modulo: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  isPublic?: boolean;
  generateThumbnails?: boolean;
  subfolder?: string;
}

interface UploadResult {
  key: string;
  url: string;
  thumbnails?: Record<string, { key: string; url: string }>;
  size: number;
}

interface ThumbnailSize {
  width: number;
  height: number;
}

const THUMBNAIL_SIZES: Record<string, ThumbnailSize> = config.storage.thumbnails;

class StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private cdnEndpoint: string;
  private provider: 'spaces' | 'local';
  private localUploadDir: string;

  constructor() {
    this.provider = config.storage.provider;
    this.bucket = config.storage.bucket;
    this.cdnEndpoint = config.storage.cdnEndpoint;
    this.localUploadDir = path.join(process.cwd(), 'uploads');

    if (this.provider === 'spaces' && config.storage.endpoint) {
      // forcePathStyle: true para MinIO y S3-compatible locales
      // forcePathStyle: false para DO Spaces y AWS S3 en produccion
      const isLocalEndpoint = config.storage.endpoint.includes('localhost') || config.storage.endpoint.includes('127.0.0.1');
      this.s3Client = new S3Client({
        endpoint: config.storage.endpoint,
        region: config.storage.region || 'us-east-1',
        credentials: {
          accessKeyId: config.storage.accessKey,
          secretAccessKey: config.storage.secretKey,
        },
        forcePathStyle: isLocalEndpoint,
      });
    }
  }

  /**
   * Genera una key unica para el archivo
   */
  private generateKey(empresaId: string, modulo: string, originalName: string, subfolder?: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const basePath = subfolder
      ? `${empresaId}/${modulo}/${subfolder}`
      : `${empresaId}/${modulo}`;
    return `${basePath}/${timestamp}-${random}${ext}`;
  }

  /**
   * Sube un archivo al almacenamiento
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { empresaId, modulo, buffer, originalName, mimeType, isPublic = false, generateThumbnails = false, subfolder } = options;
    const key = this.generateKey(empresaId, modulo, originalName, subfolder);

    // Optimizar imagen si es necesario
    let processedBuffer = buffer;
    const isImage = mimeType.startsWith('image/') && !mimeType.includes('svg');
    if (isImage) {
      processedBuffer = await this.optimizeImage(buffer, mimeType);
    }

    if (this.provider === 'spaces' && this.s3Client) {
      return this.uploadToSpaces(key, processedBuffer, mimeType, isPublic, isImage && generateThumbnails);
    }
    return this.uploadToLocal(key, processedBuffer, mimeType, isImage && generateThumbnails);
  }

  /**
   * Sube a DigitalOcean Spaces / MinIO
   */
  private async uploadToSpaces(key: string, buffer: Buffer, mimeType: string, isPublic: boolean, generateThumbnails: boolean): Promise<UploadResult> {
    const isLocal = config.storage.endpoint.includes('localhost') || config.storage.endpoint.includes('127.0.0.1');
    const putParams: any = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    };
    // MinIO con policy anonymous no necesita ACL por objeto
    if (!isLocal) {
      putParams.ACL = isPublic ? 'public-read' : 'private';
    }
    const command = new PutObjectCommand(putParams);

    await this.s3Client!.send(command);

    const result: UploadResult = {
      key,
      url: this.getPublicUrl(key),
      size: buffer.length,
    };

    if (generateThumbnails) {
      result.thumbnails = await this.generateAndUploadThumbnails(key, buffer, isPublic);
    }

    return result;
  }

  /**
   * Sube al sistema de archivos local (fallback)
   */
  private async uploadToLocal(key: string, buffer: Buffer, mimeType: string, generateThumbnails: boolean): Promise<UploadResult> {
    const filePath = path.join(this.localUploadDir, key);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buffer);

    const result: UploadResult = {
      key,
      url: `/uploads/${key.replace(/\\/g, '/')}`,
      size: buffer.length,
    };

    if (generateThumbnails) {
      result.thumbnails = await this.generateLocalThumbnails(key, buffer);
    }

    return result;
  }

  /**
   * Optimiza una imagen con sharp
   */
  private async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      // Limitar dimensiones maximas (2000px)
      if (metadata.width && metadata.width > 2000) {
        sharpInstance = sharpInstance.resize(2000, undefined, { withoutEnlargement: true });
      }

      if (mimeType === 'image/png') {
        return await sharpInstance.png({ quality: 85 }).toBuffer();
      }
      // Convertir a jpeg para todo lo demas
      return await sharpInstance.jpeg({ quality: 80 }).toBuffer();
    } catch {
      // Si sharp falla, devolver buffer original
      return buffer;
    }
  }

  /**
   * Genera thumbnails y los sube a Spaces
   */
  private async generateAndUploadThumbnails(originalKey: string, buffer: Buffer, isPublic: boolean): Promise<Record<string, { key: string; url: string }>> {
    const thumbnails: Record<string, { key: string; url: string }> = {};
    const ext = path.extname(originalKey);
    const baseName = originalKey.slice(0, -ext.length);
    const isLocal = config.storage.endpoint.includes('localhost') || config.storage.endpoint.includes('127.0.0.1');

    for (const [sizeName, dimensions] of Object.entries(THUMBNAIL_SIZES)) {
      try {
        const thumbBuffer = await sharp(buffer)
          .resize(dimensions.width, dimensions.height, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbKey = `${baseName}_${sizeName}.jpg`;

        const putParams: any = {
          Bucket: this.bucket,
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: 'image/jpeg',
        };
        if (!isLocal) {
          putParams.ACL = isPublic ? 'public-read' : 'private';
        }
        const command = new PutObjectCommand(putParams);

        await this.s3Client!.send(command);

        thumbnails[sizeName] = {
          key: thumbKey,
          url: this.getPublicUrl(thumbKey),
        };
      } catch {
        // Si falla un thumbnail, continuar con los demás
      }
    }

    return thumbnails;
  }

  /**
   * Genera thumbnails locales
   */
  private async generateLocalThumbnails(originalKey: string, buffer: Buffer): Promise<Record<string, { key: string; url: string }>> {
    const thumbnails: Record<string, { key: string; url: string }> = {};
    const ext = path.extname(originalKey);
    const baseName = originalKey.slice(0, -ext.length);

    for (const [sizeName, dimensions] of Object.entries(THUMBNAIL_SIZES)) {
      try {
        const thumbBuffer = await sharp(buffer)
          .resize(dimensions.width, dimensions.height, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbKey = `${baseName}_${sizeName}.jpg`;
        const thumbPath = path.join(this.localUploadDir, thumbKey);
        const dir = path.dirname(thumbPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(thumbPath, thumbBuffer);

        thumbnails[sizeName] = {
          key: thumbKey,
          url: `/uploads/${thumbKey.replace(/\\/g, '/')}`,
        };
      } catch {
        // Continuar con los demás
      }
    }

    return thumbnails;
  }

  /**
   * Elimina un archivo del almacenamiento
   */
  async deleteFile(key: string): Promise<void> {
    if (this.provider === 'spaces' && this.s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);

      // Eliminar thumbnails asociados
      const ext = path.extname(key);
      const baseName = key.slice(0, -ext.length);
      for (const sizeName of Object.keys(THUMBNAIL_SIZES)) {
        try {
          const thumbCommand = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: `${baseName}_${sizeName}.jpg`,
          });
          await this.s3Client.send(thumbCommand);
        } catch {
          // Ignorar si no existe
        }
      }
    } else {
      // Local
      const filePath = path.join(this.localUploadDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Eliminar thumbnails
      const ext = path.extname(key);
      const baseName = key.slice(0, -ext.length);
      for (const sizeName of Object.keys(THUMBNAIL_SIZES)) {
        const thumbPath = path.join(this.localUploadDir, `${baseName}_${sizeName}.jpg`);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    }
  }

  /**
   * Genera una URL firmada para acceso temporal a archivos privados
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.provider === 'spaces' && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    }
    // Local: devolver URL directa (en produccion deberia haber autenticacion)
    return `/uploads/${key.replace(/\\/g, '/')}`;
  }

  /**
   * Obtiene la URL publica (CDN si esta disponible)
   * Para MinIO local usa path-style: http://localhost:9000/bucket/key
   * Para DO Spaces usa virtual-hosted: https://bucket.endpoint/key
   */
  getPublicUrl(key: string): string {
    if (this.provider === 'spaces') {
      if (this.cdnEndpoint) {
        return `${this.cdnEndpoint}/${key}`;
      }
      const isLocalEndpoint = config.storage.endpoint.includes('localhost') || config.storage.endpoint.includes('127.0.0.1');
      if (isLocalEndpoint) {
        // MinIO path-style: http://localhost:9000/bucket/key
        return `${config.storage.endpoint}/${this.bucket}/${key}`;
      }
      // DO Spaces virtual-hosted: https://bucket.region.digitaloceanspaces.com/key
      return `${config.storage.endpoint}/${this.bucket}/${key}`;
    }
    return `/uploads/${key.replace(/\\/g, '/')}`;
  }
}

export const storageService = new StorageService();
export default storageService;
