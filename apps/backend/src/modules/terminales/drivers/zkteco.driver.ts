import {
  BaseTerminalDriver,
  DeviceInfo,
  TerminalEmployee,
  EmployeeData,
  AttendanceRecord,
  TerminalConnectionOptions,
} from './base.driver';

// Importar node-zklib dinámicamente para evitar errores si no está instalado
let ZKLib: any = null;

async function loadZKLib() {
  if (!ZKLib) {
    try {
      const module = await import('node-zklib');
      ZKLib = module.default || module;
    } catch (error) {
      throw new Error(
        'node-zklib no está instalado. Ejecute: npm install node-zklib'
      );
    }
  }
  return ZKLib;
}

// ============================================
// DRIVER ZKTECO
// ============================================

export class ZKTecoDriver extends BaseTerminalDriver {
  private zkInstance: any = null;

  constructor(options: TerminalConnectionOptions) {
    super({
      ...options,
      port: options.port || 4370,
    });
  }

  async connect(): Promise<boolean> {
    try {
      const ZK = await loadZKLib();

      this.zkInstance = new ZK(
        this.options.ip,
        this.options.port,
        this.options.timeout,
        this.options.inactivityTimeout
      );

      await this.zkInstance.createSocket();
      this.connected = true;
      return true;
    } catch (error: any) {
      this.connected = false;
      throw new Error(`Error conectando a ZKTeco: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.zkInstance) {
      try {
        await this.zkInstance.disconnect();
      } catch (error) {
        // Ignorar errores de desconexión
      }
      this.zkInstance = null;
    }
    this.connected = false;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      const info = await this.zkInstance.getInfo();
      return {
        serialNumber: info.serialNumber,
        firmware: info.firmwareVersion,
        platform: info.platform,
        deviceName: info.deviceName,
        mac: info.MAC,
        usersCount: info.userCounts,
        logsCount: info.logCounts,
        fingerprintsCount: info.fpCounts,
        facesCount: info.faceCounts,
      };
    } catch (error: any) {
      throw new Error(`Error obteniendo info del dispositivo: ${error.message}`);
    }
  }

  async getEmployees(): Promise<TerminalEmployee[]> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      const users = await this.zkInstance.getUsers();
      return users.data.map((user: any) => ({
        id: parseInt(user.uid) || user.userId,
        name: user.name,
        privilege: user.role,
        password: user.password,
        cardNumber: user.cardno,
      }));
    } catch (error: any) {
      throw new Error(`Error obteniendo empleados: ${error.message}`);
    }
  }

  async setEmployee(employee: EmployeeData): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.setUser(
        employee.id,
        employee.name,
        employee.password || '',
        employee.privilege || 0,
        employee.cardNumber || ''
      );
      return true;
    } catch (error: any) {
      throw new Error(`Error creando empleado: ${error.message}`);
    }
  }

  async deleteEmployee(id: number): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.deleteUser(id);
      return true;
    } catch (error: any) {
      throw new Error(`Error eliminando empleado: ${error.message}`);
    }
  }

  async getAttendances(callback?: (record: AttendanceRecord) => void): Promise<AttendanceRecord[]> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      const attendances = await this.zkInstance.getAttendances(callback);

      return attendances.data.map((att: any) => ({
        id: parseInt(att.deviceUserId) || att.id,
        timestamp: new Date(att.recordTime),
        state: att.inOutState,
        verified: att.verifyState,
        workCode: att.workCode,
      }));
    } catch (error: any) {
      throw new Error(`Error obteniendo asistencias: ${error.message}`);
    }
  }

  async clearAttendances(): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.clearAttendanceLog();
      return true;
    } catch (error: any) {
      throw new Error(`Error limpiando asistencias: ${error.message}`);
    }
  }

  async getTime(): Promise<Date> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      const time = await this.zkInstance.getTime();
      return new Date(time);
    } catch (error: any) {
      throw new Error(`Error obteniendo hora: ${error.message}`);
    }
  }

  async setTime(time: Date): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.setTime(time);
      return true;
    } catch (error: any) {
      throw new Error(`Error configurando hora: ${error.message}`);
    }
  }

  async enableDevice(): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.enableDevice();
      return true;
    } catch (error: any) {
      throw new Error(`Error habilitando dispositivo: ${error.message}`);
    }
  }

  async disableDevice(): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.disableDevice();
      return true;
    } catch (error: any) {
      throw new Error(`Error deshabilitando dispositivo: ${error.message}`);
    }
  }

  // Métodos específicos de ZKTeco

  /**
   * Obtener todos los registros de asistencia en tiempo real
   */
  async startRealtimeLog(callback: (record: AttendanceRecord) => void): Promise<void> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      await this.zkInstance.getRealTimeLogs((log: any) => {
        callback({
          id: parseInt(log.deviceUserId) || log.userId,
          timestamp: new Date(log.recordTime || log.attTime),
          state: log.inOutState || log.attState,
          verified: log.verifyState || log.verifyType,
        });
      });
    } catch (error: any) {
      throw new Error(`Error iniciando logs en tiempo real: ${error.message}`);
    }
  }

  /**
   * Obtener la foto de un empleado del terminal
   */
  async getEmployeePhoto(id: number): Promise<Buffer | null> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      // Nota: no todos los modelos ZKTeco soportan fotos
      // Esta funcionalidad puede variar según el modelo
      const photo = await this.zkInstance.getUserPhoto?.(id);
      return photo || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Establecer la foto de un empleado en el terminal
   */
  async setEmployeePhoto(id: number, photo: Buffer): Promise<boolean> {
    if (!this.zkInstance) throw new Error('No conectado al terminal');

    try {
      // Nota: no todos los modelos ZKTeco soportan fotos
      if (this.zkInstance.setUserPhoto) {
        await this.zkInstance.setUserPhoto(id, photo);
        return true;
      }
      return false;
    } catch (error: any) {
      throw new Error(`Error estableciendo foto: ${error.message}`);
    }
  }
}
