'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SignatureCanvas from '@/components/firmas/SignatureCanvas';
import CertificateUpload from '@/components/firmas/CertificateUpload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function FirmarPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [solicitudData, setSolicitudData] = useState<any>(null);

  const [tabActivo, setTabActivo] = useState<'manuscrita' | 'certificado'>('manuscrita');
  const [nombre, setNombre] = useState('');
  const [nif, setNif] = useState('');
  const [imagenFirma, setImagenFirma] = useState('');
  const [certData, setCertData] = useState<{ certificadoBase64: string; password: string } | null>(null);

  const [firmando, setFirmando] = useState(false);
  const [firmado, setFirmado] = useState(false);

  useEffect(() => {
    if (!token) return;
    cargarSolicitud();
  }, [token]);

  const cargarSolicitud = async () => {
    try {
      const res = await fetch(`${API_URL}/firmas/firmar/${token}`);
      const data = await res.json();
      if (data.ok) {
        setSolicitudData(data);
        setNombre(data.firmante.nombre || '');
      } else {
        setError(data.error || 'Enlace no valido');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const handleFirmarManuscrita = async () => {
    if (!imagenFirma || !nombre) return;
    setFirmando(true);
    try {
      const res = await fetch(`${API_URL}/firmas/firmar/${token}/manuscrita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenFirma, nombre, nif }),
      });
      const data = await res.json();
      if (data.ok) {
        setFirmado(true);
      } else {
        setError(data.error || 'Error al firmar');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setFirmando(false);
    }
  };

  const handleFirmarCertificado = async () => {
    if (!certData) return;
    setFirmando(true);
    try {
      const res = await fetch(`${API_URL}/firmas/firmar/${token}/certificado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certData),
      });
      const data = await res.json();
      if (data.ok) {
        setFirmado(true);
      } else {
        setError(data.error || 'Error al firmar');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setFirmando(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (firmado) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Documento firmado</h2>
        <p className="text-gray-500">Tu firma ha sido registrada correctamente</p>
        <p className="text-sm text-gray-400 mt-4">Puedes cerrar esta ventana</p>
      </div>
    );
  }

  if (error && !solicitudData) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Enlace no valido</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  const tiposFirmaPermitidos = solicitudData?.firmante?.tipoFirmaPermitido || ['manuscrita', 'certificado_digital'];

  return (
    <div className="space-y-6">
      {/* Info del documento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Firmar documento</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tipo:</span>
            <span className="ml-2 font-medium capitalize">{solicitudData?.solicitud?.tipoDocumento}</span>
          </div>
          <div>
            <span className="text-gray-500">Codigo:</span>
            <span className="ml-2 font-medium">{solicitudData?.solicitud?.codigoDocumento}</span>
          </div>
        </div>
        {solicitudData?.solicitud?.mensajePersonalizado && (
          <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {solicitudData.solicitud.mensajePersonalizado}
          </p>
        )}
      </div>

      {/* Tabs de tipo de firma */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          {tiposFirmaPermitidos.includes('manuscrita') && (
            <button
              onClick={() => setTabActivo('manuscrita')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                tabActivo === 'manuscrita' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'
              }`}
            >
              Firma manuscrita
            </button>
          )}
          {tiposFirmaPermitidos.includes('certificado_digital') && (
            <button
              onClick={() => setTabActivo('certificado')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                tabActivo === 'certificado' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'
              }`}
            >
              Certificado digital
            </button>
          )}
        </div>

        <div className="p-6">
          {tabActivo === 'manuscrita' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nombre y apellidos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIF (opcional)</label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="12345678A"
                  />
                </div>
              </div>

              <SignatureCanvas onSignature={setImagenFirma} />

              <button
                onClick={handleFirmarManuscrita}
                disabled={firmando || !imagenFirma || !nombre}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {firmando ? 'Firmando...' : 'Firmar documento'}
              </button>
            </div>
          )}

          {tabActivo === 'certificado' && (
            <div className="space-y-4">
              <CertificateUpload onCertificate={setCertData} />

              <button
                onClick={handleFirmarCertificado}
                disabled={firmando || !certData}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {firmando ? 'Firmando...' : 'Firmar con certificado'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && solicitudData && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
