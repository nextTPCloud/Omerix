'use client';

import { useState, useRef } from 'react';

interface CertificateUploadProps {
  onCertificate: (data: { certificadoBase64: string; password: string } | null) => void;
}

export default function CertificateUpload({ onCertificate }: CertificateUploadProps) {
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extraer solo la parte base64 (sin el prefijo data:...)
      const base64 = result.split(',')[1] || result;
      setFileBase64(base64);
      if (password) {
        onCertificate({ certificadoBase64: base64, password });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    if (fileBase64 && pwd) {
      onCertificate({ certificadoBase64: fileBase64, password: pwd });
    } else {
      onCertificate(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Certificado digital (.p12 / .pfx)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".p12,.pfx"
            onChange={handleFileChange}
            className="hidden"
          />
          {fileName ? (
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-gray-500 mt-1">Pulsa para cambiar</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Pulsa para seleccionar tu certificado</p>
              <p className="text-xs text-gray-400 mt-1">Formato .p12 o .pfx</p>
            </div>
          )}
        </div>
      </div>

      {fileName && (
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña del certificado</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Introduce la contraseña"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
}
