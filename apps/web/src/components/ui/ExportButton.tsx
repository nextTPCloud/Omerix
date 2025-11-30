'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/services/api'

interface ExportButtonProps {
  data?: any[]
  columns?: { key: string; label: string }[]
  filename?: string
  stats?: { label: string; value: string | number }[]
  onExportCSV?: () => void
  onExportExcel?: () => void
  onExportPDF?: () => void
}

export function ExportButton({
  data,
  columns,
  filename,
  stats,
  onExportCSV,
  onExportExcel,
  onExportPDF,
}: ExportButtonProps) {
  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV()
      return
    }

    try {
      // Headers
      const headers = columns.map((col) => col.label).join(',')

      // Rows
      const rows = data.map((item) => {
        return columns
          .map((col) => {
            let value = item[col.key]

            // Handle nested values (e.g., direccion.calle)
            if (col.key.includes('.')) {
              const keys = col.key.split('.')
              value = keys.reduce((obj, key) => obj?.[key], item)
            }

            // Escape commas and quotes
            if (value === null || value === undefined) {
              return ''
            }

            const stringValue = String(value)
            if (
              stringValue.includes(',') ||
              stringValue.includes('"') ||
              stringValue.includes('\n')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }

            return stringValue
          })
          .join(',')
      })

      const csv = [headers, ...rows].join('\n')

      // Crear blob y descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}.csv`
      link.click()

      toast.success('Archivo CSV exportado correctamente')
    } catch (error) {
      console.error('Error al exportar CSV:', error)
      toast.error('Error al exportar CSV')
    }
  }

  const handleExportExcel = async () => {
    if (onExportExcel) {
      onExportExcel()
      return
    }

    try {
      // Construir el body de la petición
      const exportData = {
        filename,
        title: `Listado de ${filename}`,
        subtitle: `Generado el ${new Date().toLocaleDateString('es-ES')}`,
        columns: columns.map((col) => ({
          key: col.key,
          label: col.label,
          width: 20,
        })),
        data,
        stats,
        includeStats: !!stats,
      }

      // Llamar al endpoint de exportación usando axios con responseType blob
      const response = await api.post('/export/excel', exportData, {
        responseType: 'blob',
      })

      // Descargar el archivo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success('Archivo Excel exportado correctamente')
    } catch (error: any) {
      console.error('Error al exportar Excel:', error)
      const message = error.response?.data?.message || 'Error al exportar Excel'
      toast.error(message)
    }
  }

  const handleExportPDF = async () => {
    if (onExportPDF) {
      onExportPDF()
      return
    }

    try {
      const exportData = {
        filename,
        title: `Listado de ${filename}`,
        subtitle: `Generado el ${new Date().toLocaleDateString('es-ES')}`,
        columns: columns.map((col) => ({
          key: col.key,
          label: col.label,
        })),
        data,
        stats,
        includeStats: !!stats,
      }

      // Llamar al endpoint de exportación usando axios con responseType blob
      const response = await api.post('/export/pdf', exportData, {
        responseType: 'blob',
      })

      // Descargar el archivo
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success('Archivo PDF exportado correctamente')
    } catch (error: any) {
      console.error('Error al exportar PDF:', error)
      const message = error.response?.data?.message || 'Error al exportar PDF'
      toast.error(message)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">CSV</span>
            <span className="text-xs text-muted-foreground">
              Para hojas de cálculo
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="font-medium">Excel</span>
            <span className="text-xs text-muted-foreground">
              Con formato y estadísticas
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileImage className="mr-2 h-4 w-4 text-red-600" />
          <div className="flex flex-col">
            <span className="font-medium">PDF</span>
            <span className="text-xs text-muted-foreground">
              Documento imprimible
            </span>
          </div>
        </DropdownMenuItem>
        
        {data && columns && (
          <>
            <DropdownMenuSeparator />

            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {data.length} registros • Columnas visibles: {columns.length}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}