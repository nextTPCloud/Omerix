import mongoose, { Connection, Model } from 'mongoose';
import { logger } from '../config/logger';
import { IEmpresa, IDatabaseConfig } from '../modules/empresa/Empresa';

/**
 * Servicio para gestionar conexiones dinámicas a múltiples bases de datos
 * Cada empresa tiene su propia base de datos
 */
class DatabaseManagerService {
  // Cache de conexiones por empresaId
  private connections: Map<string, Connection> = new Map();

  // Promesas pendientes de conexión (para evitar race conditions)
  private pendingConnections: Map<string, Promise<Connection>> = new Map();

  // Conexión principal (usuarios, empresas, licencias, planes, pagos)
  private mainConnection: Connection | null = null;

  /**
   * Establecer la conexión principal
   */
  setMainConnection(connection: Connection): void {
    this.mainConnection = connection;
    logger.info('✅ Conexión principal establecida');
  }

  /**
   * Obtener la conexión principal
   */
  getMainConnection(): Connection {
    if (!this.mainConnection) {
      throw new Error('Conexión principal no establecida');
    }
    return this.mainConnection;
  }

  /**
   * Obtener o crear conexión para una empresa específica
   * Usa un mecanismo de bloqueo para evitar race conditions cuando
   * múltiples llamadas intentan crear la conexión simultáneamente
   */
  async getEmpresaConnection(empresaId: string, dbConfig: IDatabaseConfig): Promise<Connection> {
    // Si ya existe la conexión en cache, retornarla
    if (this.connections.has(empresaId)) {
      const conn = this.connections.get(empresaId)!;

      // Verificar que la conexión está activa
      if (conn.readyState === 1) {
        return conn;
      } else {
        // Si no está activa, eliminarla del cache
        this.connections.delete(empresaId);
        logger.warn(`🔄 Conexión para empresa ${empresaId} no activa, reconectando...`);
      }
    }

    // Si ya hay una conexión pendiente para esta empresa, esperar a que termine
    // Esto evita que múltiples llamadas paralelas creen conexiones duplicadas
    if (this.pendingConnections.has(empresaId)) {
      logger.info(`⏳ Esperando conexión pendiente para empresa ${empresaId}`);
      return this.pendingConnections.get(empresaId)!;
    }

    // Crear promesa de conexión y guardarla para que otras llamadas la esperen
    const connectionPromise = this.createEmpresaConnection(empresaId, dbConfig);
    this.pendingConnections.set(empresaId, connectionPromise);

    try {
      const connection = await connectionPromise;
      this.connections.set(empresaId, connection);
      return connection;
    } finally {
      // Limpiar la promesa pendiente una vez resuelta (éxito o error)
      this.pendingConnections.delete(empresaId);
    }
  }

  /**
   * Crear nueva conexión para una empresa
   */
  private async createEmpresaConnection(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Connection> {
    try {
      // Construir URI de conexión
      const uri = this.buildConnectionUri(dbConfig);

      // Crear conexión
      const connection = mongoose.createConnection(uri, {
        maxPoolSize: 10, // Máximo 10 conexiones en el pool
        minPoolSize: 2,  // Mínimo 2 conexiones en el pool
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // Esperar a que la conexión esté completamente establecida
      await connection.asPromise();

      logger.info(`✅ Conexión creada para empresa ${empresaId}`, {
        database: dbConfig.name,
        host: dbConfig.host,
      });

      // Eventos de la conexión
      connection.on('disconnected', () => {
        logger.warn(`⚠️  DB de empresa ${empresaId} desconectada`);
        this.connections.delete(empresaId);
      });

      connection.on('error', (error) => {
        logger.error(`❌ Error en DB de empresa ${empresaId}:`, error);
      });

      connection.on('reconnected', () => {
        logger.info(`🔄 DB de empresa ${empresaId} reconectada`);
      });

      return connection;
    } catch (error) {
      logger.error(`❌ Error creando conexión para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Construir URI de conexión a partir de la configuración
   */
  private buildConnectionUri(dbConfig: IDatabaseConfig): string {
    // Si ya tiene URI completa, usarla
    if (dbConfig.uri) {
      return dbConfig.uri;
    }

    // Construir URI manualmente
    const auth = dbConfig.user && dbConfig.password
      ? `${dbConfig.user}:${encodeURIComponent(dbConfig.password)}@`
      : '';

    return `mongodb://${auth}${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`;
  }

  /**
   * Obtener modelo para una empresa específica
   */
  async getModel<T extends mongoose.Document>(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    modelName: string,
    schema: mongoose.Schema
  ): Promise<Model<T>> {
    const connection = await this.getEmpresaConnection(empresaId, dbConfig);

    // Verificar si el modelo ya existe en esta conexión
    if (connection.models[modelName]) {
      return connection.models[modelName] as Model<T>;
    }

    // Crear el modelo en esta conexión
    return connection.model<T>(modelName, schema);
  }

  /**
   * Cerrar conexión de una empresa específica
   */
  async closeEmpresaConnection(empresaId: string): Promise<void> {
    const connection = this.connections.get(empresaId);

    if (connection) {
      await connection.close();
      this.connections.delete(empresaId);
      logger.info(`✅ Conexión cerrada para empresa ${empresaId}`);
    }
  }

  /**
   * Cerrar todas las conexiones de empresas
   */
  async closeAllEmpresaConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map(
      empresaId => this.closeEmpresaConnection(empresaId)
    );

    await Promise.all(closePromises);
    logger.info('✅ Todas las conexiones de empresas cerradas');
  }

  /**
   * Obtener información sobre las conexiones activas
   */
  getConnectionsInfo(): {
    total: number;
    empresas: Array<{ empresaId: string; state: string; database: string }>;
  } {
    const empresas = Array.from(this.connections.entries()).map(
      ([empresaId, connection]) => ({
        empresaId,
        state: this.getConnectionState(connection.readyState),
        database: connection.name,
      })
    );

    return {
      total: empresas.length,
      empresas,
    };
  }

  /**
   * Convertir estado numérico a texto
   */
  private getConnectionState(state: number): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }

  /**
   * Generar configuración de DB para una nueva empresa
   */
  static generateDatabaseConfig(empresaId: string, baseConfig?: Partial<IDatabaseConfig>): IDatabaseConfig {
    const host = baseConfig?.host || process.env.MONGODB_HOST || 'localhost';
    const port = baseConfig?.port || parseInt(process.env.MONGODB_PORT || '27017');
    const user = baseConfig?.user || process.env.MONGODB_USER;
    const password = baseConfig?.password || process.env.MONGODB_PASSWORD;

    // Nombre de la DB: omerix_empresa_{empresaId}
    const dbName = `omerix_empresa_${empresaId}`;

    const config: IDatabaseConfig = {
      host,
      port,
      name: dbName,
      user,
      password,
    };

    // Si hay usuario y contraseña, generar URI completa
    if (user && password) {
      const auth = `${user}:${encodeURIComponent(password)}@`;
      config.uri = `mongodb://${auth}${host}:${port}/${dbName}`;
    }

    return config;
  }

  /**
   * Inicializar base de datos de una nueva empresa
   * Crea índices y colecciones necesarias
   */
  async initializeEmpresaDatabase(empresaId: string, dbConfig: IDatabaseConfig): Promise<void> {
    try {
      const connection = await this.getEmpresaConnection(empresaId, dbConfig);

      logger.info(`🔧 Inicializando base de datos para empresa ${empresaId}...`);

      // Aquí se podrían crear colecciones, índices iniciales, datos seed, etc.
      // Por ahora, solo verificamos que la conexión funciona

      const collections = await connection.db.listCollections().toArray();
      logger.info(`✅ Base de datos inicializada para empresa ${empresaId}`, {
        database: dbConfig.name,
        collections: collections.length,
      });
    } catch (error) {
      logger.error(`❌ Error inicializando base de datos para empresa ${empresaId}:`, error);
      throw error;
    }
  }
}

// Exportar clase y instancia singleton
export { DatabaseManagerService };
export const databaseManager = new DatabaseManagerService();