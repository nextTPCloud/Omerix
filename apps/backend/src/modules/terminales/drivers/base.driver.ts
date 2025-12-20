// ============================================
// INTERFAZ BASE PARA DRIVERS DE TERMINALES
// ============================================

export interface DeviceInfo {
  serialNumber?: string;
  firmware?: string;
  platform?: string;
  deviceName?: string;
  mac?: string;
  ip?: string;
  usersCount?: number;
  logsCount?: number;
  fingerprintsCount?: number;
  facesCount?: number;
}

export interface TerminalEmployee {
  id: number;           // ID en el terminal
  name: string;
  privilege?: number;   // Nivel de privilegio en el terminal
  password?: string;
  cardNumber?: string;
}

export interface EmployeeData {
  id: number;           // ID único para el terminal
  name: string;
  privilege?: number;
  password?: string;
  cardNumber?: string;
  photo?: Buffer;       // Foto en formato compatible con el terminal
}

export interface AttendanceRecord {
  id: number;           // ID del empleado en el terminal
  timestamp: Date;
  state?: number;       // 0=check-in, 1=check-out (depende del terminal)
  verified?: number;    // Método de verificación
  workCode?: number;
}

export interface TerminalConnectionOptions {
  ip: string;
  port: number;
  timeout?: number;     // Timeout de conexión en ms
  inactivityTimeout?: number;  // Timeout de inactividad
}

export interface ITerminalDriver {
  // Conexión
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Información del dispositivo
  getDeviceInfo(): Promise<DeviceInfo>;

  // Gestión de empleados
  getEmployees(): Promise<TerminalEmployee[]>;
  setEmployee(employee: EmployeeData): Promise<boolean>;
  deleteEmployee(id: number): Promise<boolean>;
  clearAllEmployees(): Promise<boolean>;

  // Gestión de asistencia/fichajes
  getAttendances(callback?: (record: AttendanceRecord) => void): Promise<AttendanceRecord[]>;
  getAttendancesSince(since: Date): Promise<AttendanceRecord[]>;
  clearAttendances(): Promise<boolean>;

  // Tiempo
  getTime(): Promise<Date>;
  setTime(time: Date): Promise<boolean>;

  // Utilidades
  enableDevice(): Promise<boolean>;
  disableDevice(): Promise<boolean>;
}

// Clase abstracta base con implementaciones comunes
export abstract class BaseTerminalDriver implements ITerminalDriver {
  protected options: TerminalConnectionOptions;
  protected connected: boolean = false;

  constructor(options: TerminalConnectionOptions) {
    this.options = {
      timeout: 10000,
      inactivityTimeout: 30000,
      ...options,
    };
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract getDeviceInfo(): Promise<DeviceInfo>;
  abstract getEmployees(): Promise<TerminalEmployee[]>;
  abstract setEmployee(employee: EmployeeData): Promise<boolean>;
  abstract deleteEmployee(id: number): Promise<boolean>;
  abstract getAttendances(callback?: (record: AttendanceRecord) => void): Promise<AttendanceRecord[]>;
  abstract clearAttendances(): Promise<boolean>;
  abstract getTime(): Promise<Date>;
  abstract setTime(time: Date): Promise<boolean>;
  abstract enableDevice(): Promise<boolean>;
  abstract disableDevice(): Promise<boolean>;

  isConnected(): boolean {
    return this.connected;
  }

  async clearAllEmployees(): Promise<boolean> {
    const employees = await this.getEmployees();
    for (const emp of employees) {
      await this.deleteEmployee(emp.id);
    }
    return true;
  }

  async getAttendancesSince(since: Date): Promise<AttendanceRecord[]> {
    const all = await this.getAttendances();
    return all.filter(record => record.timestamp >= since);
  }
}
