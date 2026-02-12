'use client'

import React from 'react'
import {
  PlantillaDocumento,
  TIPO_DOCUMENTO_LABELS,
} from '@/types/plantilla-documento.types'

interface PlantillaPreviewProps {
  plantilla: PlantillaDocumento
  scale?: number
}

// Datos de ejemplo para la vista previa
const DATOS_EJEMPLO = {
  empresa: {
    nombre: 'Mi Empresa S.L.',
    nif: 'B12345678',
    direccion: 'C/ Principal, 123',
    ciudad: '28001 Madrid',
    telefono: '912 345 678',
    email: 'info@miempresa.es',
    web: 'www.miempresa.es',
  },
  cliente: {
    codigo: 'CLI001',
    nombre: 'Cliente Ejemplo S.A.',
    nif: 'A87654321',
    direccion: 'Av. Secundaria, 456',
    ciudad: '08001 Barcelona',
    telefono: '934 567 890',
    email: 'cliente@ejemplo.com',
  },
  documento: {
    numero: 'F2024-0001',
    fecha: '15/01/2024',
    vencimiento: '15/02/2024',
  },
  lineas: [
    { ref: 'PROD001', descripcion: 'Producto de ejemplo A', cantidad: 10, precio: 25.00, dto: 0, iva: 21, subtotal: 250.00 },
    { ref: 'PROD002', descripcion: 'Servicio de consultoría', cantidad: 5, precio: 80.00, dto: 10, iva: 21, subtotal: 360.00 },
    { ref: 'PROD003', descripcion: 'Material complementario', cantidad: 3, precio: 15.50, dto: 0, iva: 21, subtotal: 46.50 },
  ],
  totales: {
    subtotal: 656.50,
    descuento: 40.00,
    baseImponible: 616.50,
    iva21: 129.47,
    total: 745.97,
  },
  formaPago: 'Transferencia bancaria',
  cuentaBancaria: 'ES12 1234 5678 9012 3456 7890',
}

export function PlantillaPreview({ plantilla, scale = 0.7 }: PlantillaPreviewProps) {
  const { colores, fuentes, cabecera, cliente, lineas, totales, pie, textos, margenes } = plantilla

  // Estilos dinámicos basados en la plantilla
  const containerStyle: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    width: '210mm', // A4
    minHeight: '297mm',
    backgroundColor: colores.fondo,
    color: colores.texto,
    fontFamily: fuentes.familia,
    fontSize: `${fuentes.tamañoTexto}pt`,
    padding: `${margenes.superior}mm ${margenes.derecho}mm ${margenes.inferior}mm ${margenes.izquierdo}mm`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    margin: '0 auto',
  }

  const headerStyle: React.CSSProperties = {
    backgroundColor: cabecera.colorFondo || 'transparent',
    color: cabecera.colorFondo ? '#fff' : colores.texto,
    padding: cabecera.colorFondo ? '15px' : '0',
    marginBottom: '20px',
    borderRadius: cabecera.colorFondo ? '4px' : '0',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: `${fuentes.tamañoTitulo}pt`,
    fontWeight: 'bold',
    color: cabecera.colorFondo ? '#fff' : colores.primario,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: `${fuentes.tamañoSubtitulo}pt`,
    color: cabecera.colorFondo ? 'rgba(255,255,255,0.9)' : colores.textoClaro,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: `${fuentes.tamañoSubtitulo}pt`,
    fontWeight: 'bold',
    color: colores.primario,
    marginBottom: '8px',
    borderBottom: `2px solid ${colores.primario}`,
    paddingBottom: '4px',
  }

  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: colores.primario,
    color: '#fff',
    padding: '8px 6px',
    fontSize: `${fuentes.tamañoTexto}pt`,
    fontWeight: 'bold',
    textAlign: 'left',
  }

  const tableCellStyle: React.CSSProperties = {
    padding: '8px 6px',
    fontSize: `${fuentes.tamañoTexto}pt`,
    borderBottom: `1px solid ${colores.borde}`,
  }

  const zebraRowStyle = (index: number): React.CSSProperties => ({
    backgroundColor: lineas.filasZebra && index % 2 === 1 ? colores.fondoAlterno : 'transparent',
  })

  const totalRowStyle: React.CSSProperties = {
    padding: '6px',
    borderBottom: `1px solid ${colores.borde}`,
  }

  const grandTotalStyle: React.CSSProperties = {
    backgroundColor: totales.resaltarTotal ? colores.primario : 'transparent',
    color: totales.resaltarTotal ? '#fff' : colores.texto,
    fontWeight: 'bold',
    fontSize: `${fuentes.tamañoSubtitulo}pt`,
    padding: '10px 6px',
    borderRadius: '4px',
  }

  const footerStyle: React.CSSProperties = {
    fontSize: `${fuentes.tamañoPie}pt`,
    color: colores.textoClaro,
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: `1px solid ${colores.borde}`,
  }

  return (
    <div className="overflow-auto bg-gray-100 p-4 rounded-lg">
      <div style={containerStyle}>
        {/* CABECERA */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: cabecera.posicionLogo === 'centro' ? 'center' : 'space-between', alignItems: 'flex-start' }}>
            {/* Logo y datos empresa */}
            <div style={{ display: 'flex', flexDirection: cabecera.posicionLogo === 'centro' ? 'column' : 'row', alignItems: cabecera.posicionLogo === 'centro' ? 'center' : 'flex-start', gap: '15px' }}>
              {cabecera.mostrarLogo && (
                <div style={{
                  width: `${cabecera.anchoLogo}px`,
                  height: '60px',
                  backgroundColor: colores.secundario,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                }}>
                  LOGO
                </div>
              )}

              {cabecera.mostrarDatosEmpresa && (
                <div style={{ textAlign: cabecera.posicionLogo === 'centro' ? 'center' : 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: `${fuentes.tamañoSubtitulo}pt` }}>{DATOS_EJEMPLO.empresa.nombre}</div>
                  {cabecera.mostrarNIF && <div style={subtitleStyle}>NIF: {DATOS_EJEMPLO.empresa.nif}</div>}
                  {cabecera.mostrarDireccion && <div style={subtitleStyle}>{DATOS_EJEMPLO.empresa.direccion}, {DATOS_EJEMPLO.empresa.ciudad}</div>}
                  {cabecera.mostrarContacto && <div style={subtitleStyle}>Tel: {DATOS_EJEMPLO.empresa.telefono} | {DATOS_EJEMPLO.empresa.email}</div>}
                  {cabecera.mostrarWeb && <div style={subtitleStyle}>{DATOS_EJEMPLO.empresa.web}</div>}
                </div>
              )}
            </div>

            {/* Título documento */}
            <div style={{ textAlign: 'right' }}>
              <div style={titleStyle}>{textos.tituloDocumento || TIPO_DOCUMENTO_LABELS[plantilla.tipoDocumento].toUpperCase()}</div>
              <div style={subtitleStyle}>Nº: {DATOS_EJEMPLO.documento.numero}</div>
              <div style={subtitleStyle}>Fecha: {DATOS_EJEMPLO.documento.fecha}</div>
            </div>
          </div>
        </div>

        {/* DATOS CLIENTE */}
        <div style={{ display: 'flex', justifyContent: cliente.posicion === 'derecha' ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
          <div style={{ width: '45%', padding: '12px', backgroundColor: colores.fondoAlterno, borderRadius: '4px', border: `1px solid ${colores.borde}` }}>
            {cliente.mostrarTitulo && <div style={sectionTitleStyle}>DATOS DEL CLIENTE</div>}
            <div style={{ fontWeight: 'bold' }}>{DATOS_EJEMPLO.cliente.nombre}</div>
            {cliente.mostrarCodigo && <div style={subtitleStyle}>Código: {DATOS_EJEMPLO.cliente.codigo}</div>}
            {cliente.mostrarNIF && <div>NIF: {DATOS_EJEMPLO.cliente.nif}</div>}
            {cliente.mostrarDireccion && <div>{DATOS_EJEMPLO.cliente.direccion}</div>}
            {cliente.mostrarDireccion && <div>{DATOS_EJEMPLO.cliente.ciudad}</div>}
            {cliente.mostrarContacto && <div style={subtitleStyle}>Tel: {DATOS_EJEMPLO.cliente.telefono}</div>}
          </div>
        </div>

        {/* TABLA DE LÍNEAS */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              {lineas.mostrarNumeroLinea && <th style={{ ...tableHeaderStyle, width: '30px' }}>#</th>}
              {lineas.mostrarReferencia && <th style={{ ...tableHeaderStyle, width: '80px' }}>Ref.</th>}
              {lineas.mostrarDescripcion && <th style={tableHeaderStyle}>Descripción</th>}
              {lineas.mostrarCantidad && <th style={{ ...tableHeaderStyle, width: '50px', textAlign: 'right' }}>Cant.</th>}
              {lineas.mostrarUnidad && <th style={{ ...tableHeaderStyle, width: '40px', textAlign: 'center' }}>Ud.</th>}
              {lineas.mostrarPrecioUnitario && <th style={{ ...tableHeaderStyle, width: '70px', textAlign: 'right' }}>Precio</th>}
              {lineas.mostrarDescuento && <th style={{ ...tableHeaderStyle, width: '50px', textAlign: 'right' }}>Dto.%</th>}
              {lineas.mostrarIVA && <th style={{ ...tableHeaderStyle, width: '50px', textAlign: 'right' }}>IVA%</th>}
              {lineas.mostrarSubtotal && <th style={{ ...tableHeaderStyle, width: '80px', textAlign: 'right' }}>Subtotal</th>}
            </tr>
          </thead>
          <tbody>
            {DATOS_EJEMPLO.lineas.map((linea, index) => (
              <tr key={index} style={zebraRowStyle(index)}>
                {lineas.mostrarNumeroLinea && <td style={{ ...tableCellStyle, textAlign: 'center' }}>{index + 1}</td>}
                {lineas.mostrarReferencia && <td style={tableCellStyle}>{linea.ref}</td>}
                {lineas.mostrarDescripcion && <td style={tableCellStyle}>{linea.descripcion}</td>}
                {lineas.mostrarCantidad && <td style={{ ...tableCellStyle, textAlign: 'right' }}>{linea.cantidad}</td>}
                {lineas.mostrarUnidad && <td style={{ ...tableCellStyle, textAlign: 'center' }}>ud</td>}
                {lineas.mostrarPrecioUnitario && <td style={{ ...tableCellStyle, textAlign: 'right' }}>{linea.precio.toFixed(2)} €</td>}
                {lineas.mostrarDescuento && <td style={{ ...tableCellStyle, textAlign: 'right' }}>{linea.dto > 0 ? `${linea.dto}%` : '-'}</td>}
                {lineas.mostrarIVA && <td style={{ ...tableCellStyle, textAlign: 'right' }}>{linea.iva}%</td>}
                {lineas.mostrarSubtotal && <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 'bold' }}>{linea.subtotal.toFixed(2)} €</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALES */}
        <div style={{ display: 'flex', justifyContent: totales.posicion === 'izquierda' ? 'flex-start' : totales.posicion === 'centrado' ? 'center' : 'flex-end' }}>
          <div style={{ width: '250px' }}>
            {totales.mostrarSubtotal && (
              <div style={{ ...totalRowStyle, display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{DATOS_EJEMPLO.totales.subtotal.toFixed(2)} €</span>
              </div>
            )}
            {totales.mostrarDescuentoGlobal && DATOS_EJEMPLO.totales.descuento > 0 && (
              <div style={{ ...totalRowStyle, display: 'flex', justifyContent: 'space-between', color: colores.error }}>
                <span>Descuento:</span>
                <span>-{DATOS_EJEMPLO.totales.descuento.toFixed(2)} €</span>
              </div>
            )}
            {totales.mostrarBaseImponible && (
              <div style={{ ...totalRowStyle, display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Imponible:</span>
                <span>{DATOS_EJEMPLO.totales.baseImponible.toFixed(2)} €</span>
              </div>
            )}
            {totales.mostrarDetalleIVA && (
              <div style={{ ...totalRowStyle, display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA 21%:</span>
                <span>{DATOS_EJEMPLO.totales.iva21.toFixed(2)} €</span>
              </div>
            )}
            {totales.mostrarTotal && (
              <div style={{ ...grandTotalStyle, display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span>TOTAL:</span>
                <span>{DATOS_EJEMPLO.totales.total.toFixed(2)} €</span>
              </div>
            )}
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div style={footerStyle}>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {pie.mostrarFormaPago && (
              <div>
                <div style={{ fontWeight: 'bold', color: colores.texto }}>Forma de Pago</div>
                <div>{DATOS_EJEMPLO.formaPago}</div>
              </div>
            )}
            {pie.mostrarVencimientos && (
              <div>
                <div style={{ fontWeight: 'bold', color: colores.texto }}>Vencimiento</div>
                <div>{DATOS_EJEMPLO.documento.vencimiento}</div>
              </div>
            )}
            {pie.mostrarDatosBancarios && (
              <div>
                <div style={{ fontWeight: 'bold', color: colores.texto }}>Cuenta Bancaria</div>
                <div>{DATOS_EJEMPLO.cuentaBancaria}</div>
              </div>
            )}
          </div>

          {pie.mostrarCondiciones && textos.condicionesPago && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', color: colores.texto }}>Condiciones</div>
              <div>{textos.condicionesPago}</div>
            </div>
          )}

          {pie.textoLegal && (
            <div style={{ marginTop: '15px', fontSize: `${fuentes.tamañoPie - 1}pt`, fontStyle: 'italic' }}>
              {pie.textoLegal}
            </div>
          )}

          {pie.mostrarPagina && (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              Página 1 de 1
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
