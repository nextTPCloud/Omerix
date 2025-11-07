import { Cliente } from '@/types/cliente.types'

/**
 * Exporta clientes a formato CSV
 */
export const exportClientesToCSV = (clientes: Cliente[], filename?: string) => {
  const headers = [
    'Código',
    'Tipo',
    'Nombre',
    'Nombre Comercial',
    'NIF/CIF',
    'Email',
    'Teléfono',
    'Móvil',
    'Dirección',
    'Ciudad',
    'Provincia',
    'CP',
    'Forma de Pago',
    'Días de Pago',
    'IBAN',
    'Límite de Crédito',
    'Riesgo Actual',
    'Descuento',
    'Estado',
    'Observaciones'
  ]

  const rows = clientes.map(cliente => [
    cliente.codigo || '',
    cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular',
    cliente.nombre || '',
    cliente.nombreComercial || '',
    cliente.nif || '',
    cliente.email || '',
    cliente.telefono || '',
    cliente.movil || '',
    cliente.direccion?.calle || '',
    cliente.direccion?.ciudad || '',
    cliente.direccion?.provincia || '',
    cliente.direccion?.codigoPostal || '',
    cliente.formaPago || '',
    cliente.diasPago || 0,
    cliente.iban || '',
    cliente.limiteCredito || 0,
    cliente.riesgoActual || 0,
    cliente.descuentoGeneral || 0,
    cliente.activo ? 'Activo' : 'Inactivo',
    cliente.observaciones || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `clientes_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Procesa archivo de importación
 */
export const processImportFile = async (file: File): Promise<Partial<Cliente>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        
        const clientes: Partial<Cliente>[] = []
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
            const cliente: any = {}
            
            headers.forEach((header, index) => {
              const value = values[index]
              // Mapear headers a propiedades del cliente
              switch(header.toLowerCase()) {
                case 'código':
                case 'codigo':
                  cliente.codigo = value
                  break
                case 'nombre':
                  cliente.nombre = value
                  break
                case 'nif':
                case 'cif':
                case 'nif/cif':
                  cliente.nif = value
                  break
                case 'email':
                  cliente.email = value
                  break
                case 'teléfono':
                case 'telefono':
                  cliente.telefono = value
                  break
                // Añadir más mapeos según necesites
              }
            })
            
            if (cliente.nombre && cliente.nif) {
              clientes.push(cliente)
            }
          }
        }
        
        resolve(clientes)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}