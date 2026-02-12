import { tpvApi } from './api';

class ComanderoService {
  async login(pin: string): Promise<any> {
    const creds = tpvApi.getCredentials();
    if (!creds) throw new Error('TPV no activado');
    return tpvApi.post('/tpv/comandero/login', {
      empresaId: creds.empresaId,
      tpvId: creds.tpvId,
      tpvSecret: creds.tpvSecret,
      pin,
    }, { useLocal: false });
  }

  async logout(sesionId: string): Promise<any> {
    const creds = tpvApi.getCredentials();
    if (!creds) throw new Error('TPV no activado');
    return tpvApi.post('/tpv/comandero/logout', {
      empresaId: creds.empresaId,
      tpvId: creds.tpvId,
      sesionId,
    }, { useLocal: false });
  }

  async getMesas(salonId?: string): Promise<any> {
    const creds = tpvApi.getCredentials();
    if (!creds) throw new Error('TPV no activado');
    return tpvApi.post('/tpv/restauracion/mesas', {
      empresaId: creds.empresaId,
      tpvId: creds.tpvId,
      tpvSecret: creds.tpvSecret,
      salonId,
    }, { useLocal: false });
  }

  async getSalones(): Promise<any> {
    const creds = tpvApi.getCredentials();
    if (!creds) throw new Error('TPV no activado');
    return tpvApi.post('/tpv/restauracion/salones', {
      empresaId: creds.empresaId,
      tpvId: creds.tpvId,
      tpvSecret: creds.tpvSecret,
    }, { useLocal: false });
  }

  async enviarComanda(comanda: any): Promise<any> {
    const creds = tpvApi.getCredentials();
    if (!creds) throw new Error('TPV no activado');
    return tpvApi.post('/tpv/restauracion/comandas', {
      empresaId: creds.empresaId,
      tpvId: creds.tpvId,
      tpvSecret: creds.tpvSecret,
      comanda,
    }, { useLocal: false });
  }
}

export const comanderoService = new ComanderoService();
