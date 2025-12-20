export * from './base.driver';
export * from './zkteco.driver';

import { ITerminalDriver, TerminalConnectionOptions } from './base.driver';
import { ZKTecoDriver } from './zkteco.driver';
import { MarcaTerminal } from '../Terminal';

/**
 * Factory para crear el driver correcto según la marca del terminal
 */
export function createTerminalDriver(
  marca: MarcaTerminal,
  options: TerminalConnectionOptions
): ITerminalDriver {
  switch (marca) {
    case 'ZKTeco':
      return new ZKTecoDriver(options);
    case 'ANVIZ':
      throw new Error('Driver ANVIZ no implementado todavía');
    case 'Hikvision':
      throw new Error('Driver Hikvision no implementado todavía');
    default:
      throw new Error(`Marca de terminal no soportada: ${marca}`);
  }
}
