'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { clientesService } from '@/services/clientes.service'
import {
  Cliente,
  ClientesFilters,
  EstadisticasClientes,
} from '@/types/cliente.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  FileSpreadsheet,
  Filter,
  Settings2,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Building2,
  AlertCircle,
  Columns,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportClientesToCSV, processImportFile } from '@/utils/excel.utils'

// ============================================
// HOOK PARA DEBOUNCE
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================
// INTERFACES Y TIPOS
// ============================================

interface ColumnFilters {
  [key: string]: string
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ClientesPage() {
  const router = useRouter()

  // Estados de datos - con inicialización correcta
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selección múltiple
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Ordenamiento
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  })
  
  // Filtros por columna - con estados separados para input y valor aplicado
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  
  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)
  
  // Filtros generales
  const [filters, setFilters] = useState<ClientesFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })
  
  // UI States
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    clienteIds: string[]
    clienteNombres: string[]
  }>({
    open: false,
    clienteIds: [],
    clienteNombres: [],
  })
  
  // Columnas disponibles y visibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', width: 'w-32' },
    { key: 'nombre', label: 'Nombre', width: 'w-64' },
    { key: 'nif', label: 'NIF/CIF', width: 'w-36' },
    { key: 'email', label: 'Email', width: 'w-56' },
    { key: 'telefono', label: 'Teléfono', width: 'w-36' },
    { key: 'tipoCliente', label: 'Tipo', width: 'w-32' },
    { key: 'direccion', label: 'Dirección', width: 'w-64' },
    { key: 'formaPago', label: 'Forma Pago', width: 'w-40' },
    { key: 'riesgoActual', label: 'Riesgo', width: 'w-32' },
    { key: 'limiteCredito', label: 'Límite', width: 'w-32' },
    { key: 'activo', label: 'Estado', width: 'w-28' },
  ])
  
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>([
    'codigo',
    'nombre',
    'nif',
    'email',
    'telefono',
    'tipoCliente',
    'riesgoActual',
    'activo',
  ])

  // ============================================
  // CALCULAR ANCHO MÍNIMO DE LA TABLA
  // ============================================
  
  const anchoMinimoTabla = useMemo(() => {
    let ancho = 100 // checkbox + acciones
    columnasVisibles.forEach(col => {
      const columna = columnasDisponibles.find(c => c.key === col)
      if (columna) {
        const widthValue = columna.width.replace('w-', '')
        // Convertir clases tailwind a píxeles aproximados
        const pixelMap: { [key: string]: number } = {
          '28': 112, '32': 128, '36': 144, '40': 160,
          '56': 224, '64': 256,
        }
        ancho += pixelMap[widthValue] || 128
      }
    })
    return ancho
  }, [columnasVisibles, columnasDisponibles])

  // ============================================
  // ESTADÍSTICAS CALCULADAS - Con verificación de seguridad
  // ============================================

  const stats = useMemo(() => {
    // Verificación de seguridad completa
    if (!clientes || !Array.isArray(clientes)) {
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        empresas: 0,
        particulares: 0,
        conRiesgo: 0,
      }
    }

    const total = pagination?.total || 0
    const activos = clientes.filter((c) => c?.activo).length
    const inactivos = clientes.filter((c) => !c?.activo).length
    const empresas = clientes.filter((c) => c?.tipoCliente === 'empresa').length
    const particulares = clientes.filter((c) => c?.tipoCliente === 'particular').length
    const conRiesgo = clientes.filter((c) => (c?.riesgoActual || 0) > 0).length

    return {
      total,
      activos,
      inactivos,
      empresas,
      particulares,
      conRiesgo,
    }
  }, [clientes, pagination?.total])

  // ============================================
  // CARGAR CLIENTES
  // ============================================

  const cargarClientes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getAll(filters)
      
      if (response.success) {
        // Verificación adicional de seguridad
        setClientes(response.data || [])
        setPagination(response.pagination || {
          page: 1,
          limit: 25,
          total: 0,
          pages: 0,
        })
      } else {
        // Si la respuesta no es exitosa, mantener array vacío
        setClientes([])
        toast.error('Error al cargar los clientes')
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      // En caso de error, asegurar que clientes sea un array vacío
      setClientes([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los clientes')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Cargar clientes cuando cambien los filtros
  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  // ============================================
  // APLICAR FILTROS DEBOUNCED
  // ============================================
  
  useEffect(() => {
    setColumnFilters(debouncedColumnFilters)
    applyAllFilters(debouncedColumnFilters)
  }, [debouncedColumnFilters])

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1,
    }))
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }
    
    setSortConfig({ key, direction })
    setFilters(prev => ({
      ...prev,
      sortBy: key,
      sortOrder: direction,
      page: 1,
    }))
  }

  const getSortIcon = (column: string) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-3 w-3" />
      : <ArrowDown className="ml-2 h-3 w-3" />
  }

  // ============================================
  // FILTROS POR COLUMNA CON DEBOUNCE
  // ============================================

  const handleColumnFilterInput = (column: string, value: string) => {
    const newFilters = { ...columnFiltersInput }
    
    if (value === '') {
      delete newFilters[column]
    } else {
      newFilters[column] = value
    }
    
    setColumnFiltersInput(newFilters)
  }

  const applyAllFilters = (colFilters: ColumnFilters) => {
    // Combinar filtros de columna con filtros generales
    const combinedFilters: any = { ...filters, page: 1 }
    
    // Aplicar filtros de texto para búsqueda
    const searchableFields = ['codigo', 'nombre', 'nif', 'email', 'telefono']
    const searchTerms: string[] = []
    
    searchableFields.forEach(field => {
      if (colFilters[field]) {
        searchTerms.push(colFilters[field])
      }
    })
    
    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }
    
    // Aplicar filtros de tipo select
    Object.entries(colFilters).forEach(([key, value]) => {
      if (key === 'tipoCliente' || key === 'formaPago') {
        combinedFilters[key] = value
      } else if (key === 'activo') {
        combinedFilters.activo = value === 'true'
      }
    })
    
    setFilters(combinedFilters)
  }

  // ============================================
  // SELECCIÓN MÚLTIPLE
  // ============================================

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClientes([])
    } else {
      setSelectedClientes(clientes.map(c => c._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectCliente = (clienteId: string) => {
    if (selectedClientes.includes(clienteId)) {
      setSelectedClientes(selectedClientes.filter(id => id !== clienteId))
    } else {
      setSelectedClientes([...selectedClientes, clienteId])
    }
  }

  // ============================================
  // ACCIONES EN LOTE
  // ============================================

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'export':
        handleExportSelected()
        break
      case 'delete':
        if (selectedClientes.length > 0) {
          const nombresSeleccionados = clientes
            .filter(c => selectedClientes.includes(c._id))
            .map(c => c.nombre)
          
          setDeleteDialog({
            open: true,
            clienteIds: selectedClientes,
            clienteNombres: nombresSeleccionados,
          })
        }
        break
      case 'activate':
      case 'deactivate':
        handleToggleStatus(action === 'activate')
        break
    }
  }

  const handleExportSelected = () => {
    const selectedData = clientes.filter(c => selectedClientes.includes(c._id))
    exportClientesToCSV(selectedData, 'clientes_seleccionados.csv')
    toast.success('Clientes exportados correctamente')
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await Promise.all(
        selectedClientes.map(id =>
          clientesService.update(id, { activo: activate })
        )
      )
      toast.success(`Clientes ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarClientes()
      setSelectedClientes([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  // ============================================
  // ELIMINAR CLIENTES
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.clienteIds.length === 1) {
        await clientesService.delete(deleteDialog.clienteIds[0])
      } else {
        await clientesService.deleteMany(deleteDialog.clienteIds)
      }
      
      toast.success('Cliente(s) eliminado(s) correctamente')
      cargarClientes()
      setSelectedClientes([])
      setSelectAll(false)
      setDeleteDialog({ open: false, clienteIds: [], clienteNombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // GESTIÓN DE COLUMNAS
  // ============================================

  const toggleColumna = (key: string) => {
    if (columnasVisibles.includes(key)) {
      // No permitir quitar todas las columnas
      if (columnasVisibles.length > 1) {
        setColumnasVisibles(columnasVisibles.filter(c => c !== key))
      }
    } else {
      setColumnasVisibles([...columnasVisibles, key])
    }
  }

  // ============================================
  // IMPORTAR CLIENTES
  // ============================================

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        try {
          if (file.name.endsWith('.csv')) {
            const clientesImportados = await processImportFile(file)
            toast.info(`${clientesImportados.length} clientes listos para importar`)
            
            // TODO: Aquí deberías enviar los clientes al backend
            // for (const cliente of clientesImportados) {
            //   await clientesService.create(cliente as any)
            // }
            // cargarClientes()
          } else {
            toast.error('Por favor selecciona un archivo CSV')
          }
        } catch (error) {
          console.error('Error al procesar archivo:', error)
          toast.error('Error al procesar el archivo')
        }
      }
    }
    input.click()
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu cartera de clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowStats(!showStats)}
              title="Ver estadísticas"
            >
              {showStats ? <Eye /> : <Users />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={cargarClientes}
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild>
              <Link href="/clientes/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{stats.activos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                  <p className="text-2xl font-bold">{stats.inactivos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Empresas</p>
                  <p className="text-2xl font-bold">{stats.empresas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Particulares</p>
                  <p className="text-2xl font-bold">{stats.particulares}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Con Riesgo</p>
                  <p className="text-2xl font-bold">{stats.conRiesgo}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center w-full md:max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, NIF, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Selector de columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="mr-2 h-4 w-4" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnasDisponibles.map((columna) => (
                  <DropdownMenuCheckboxItem
                    key={columna.key}
                    checked={columnasVisibles.includes(columna.key)}
                    onCheckedChange={() => toggleColumna(columna.key)}
                  >
                    {columna.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportClientesToCSV(clientes)
                toast.success('Clientes exportados correctamente')
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedClientes.length > 0 && (
          <div className="flex gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground mr-4">
              {selectedClientes.length} seleccionados
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('activate')}
            >
              Activar ({selectedClientes.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('deactivate')}
            >
              Desactivar ({selectedClientes.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('export')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar ({selectedClientes.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar ({selectedClientes.length})
            </Button>
          </div>
        )}

        {/* TABLA CON SCROLL HORIZONTAL */}
        <Card>
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm" style={{ minWidth: `${anchoMinimoTabla}px` }}>
                <thead>
                  {/* Headers con ordenamiento */}
                  <tr className="border-b bg-muted/30">
                    <th className="sticky left-0 z-10 bg-background px-3 py-2 text-left w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    
                    {columnasVisibles.includes('codigo') && (
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('codigo')}
                          className="flex items-center hover:text-primary"
                        >
                          Código
                          {getSortIcon('codigo')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nombre') && (
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('nombre')}
                          className="flex items-center hover:text-primary"
                        >
                          Nombre
                          {getSortIcon('nombre')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nif') && (
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('nif')}
                          className="flex items-center hover:text-primary"
                        >
                          NIF/CIF
                          {getSortIcon('nif')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('email') && (
                      <th className="px-3 py-2 text-left">Email</th>
                    )}
                    
                    {columnasVisibles.includes('telefono') && (
                      <th className="px-3 py-2 text-left">Teléfono</th>
                    )}
                    
                    {columnasVisibles.includes('tipoCliente') && (
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('tipoCliente')}
                          className="flex items-center hover:text-primary"
                        >
                          Tipo
                          {getSortIcon('tipoCliente')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('direccion') && (
                      <th className="px-3 py-2 text-left">Dirección</th>
                    )}
                    
                    {columnasVisibles.includes('formaPago') && (
                      <th className="px-3 py-2 text-left">Forma Pago</th>
                    )}
                    
                    {columnasVisibles.includes('riesgoActual') && (
                      <th className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleSort('riesgoActual')}
                          className="flex items-center justify-end w-full hover:text-primary"
                        >
                          Riesgo
                          {getSortIcon('riesgoActual')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('limiteCredito') && (
                      <th className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleSort('limiteCredito')}
                          className="flex items-center justify-end w-full hover:text-primary"
                        >
                          Límite
                          {getSortIcon('limiteCredito')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('activo') && (
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('activo')}
                          className="flex items-center hover:text-primary"
                        >
                          Estado
                          {getSortIcon('activo')}
                        </button>
                      </th>
                    )}
                    
                    <th className="sticky right-0 z-10 bg-background px-3 py-2 text-right w-16">
                      Acciones
                    </th>
                  </tr>

                  {/* Fila de filtros por columna */}
                  <tr className="border-b bg-muted/10">
                    <th className="sticky left-0 z-10 bg-background px-3 py-1"></th>
                    
                    {columnasVisibles.includes('codigo') && (
                      <th className="px-3 py-1">
                        <Input
                          placeholder="Filtrar..."
                          className="h-7 text-xs"
                          value={columnFiltersInput.codigo || ''}
                          onChange={(e) => handleColumnFilterInput('codigo', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nombre') && (
                      <th className="px-3 py-1">
                        <Input
                          placeholder="Filtrar..."
                          className="h-7 text-xs"
                          value={columnFiltersInput.nombre || ''}
                          onChange={(e) => handleColumnFilterInput('nombre', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nif') && (
                      <th className="px-3 py-1">
                        <Input
                          placeholder="Filtrar..."
                          className="h-7 text-xs"
                          value={columnFiltersInput.nif || ''}
                          onChange={(e) => handleColumnFilterInput('nif', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('email') && (
                      <th className="px-3 py-1">
                        <Input
                          placeholder="Filtrar..."
                          className="h-7 text-xs"
                          value={columnFiltersInput.email || ''}
                          onChange={(e) => handleColumnFilterInput('email', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('telefono') && (
                      <th className="px-3 py-1">
                        <Input
                          placeholder="Filtrar..."
                          className="h-7 text-xs"
                          value={columnFiltersInput.telefono || ''}
                          onChange={(e) => handleColumnFilterInput('telefono', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('tipoCliente') && (
                      <th className="px-3 py-1">
                        <Select
                          value={columnFiltersInput.tipoCliente || 'all'}
                          onValueChange={(value) => 
                            handleColumnFilterInput('tipoCliente', value === 'all' ? '' : value)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="empresa">Empresa</SelectItem>
                            <SelectItem value="particular">Particular</SelectItem>
                          </SelectContent>
                        </Select>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('direccion') && (
                      <th className="px-3 py-1"></th>
                    )}
                    
                    {columnasVisibles.includes('formaPago') && (
                      <th className="px-3 py-1">
                        <Select
                          value={columnFiltersInput.formaPago || 'all'}
                          onValueChange={(value) => 
                            handleColumnFilterInput('formaPago', value === 'all' ? '' : value)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="contado">Contado</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                            <SelectItem value="confirming">Confirming</SelectItem>
                            <SelectItem value="pagare">Pagaré</SelectItem>
                          </SelectContent>
                        </Select>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('riesgoActual') && (
                      <th className="px-3 py-1"></th>
                    )}
                    
                    {columnasVisibles.includes('limiteCredito') && (
                      <th className="px-3 py-1"></th>
                    )}
                    
                    {columnasVisibles.includes('activo') && (
                      <th className="px-3 py-1">
                        <Select
                          value={columnFiltersInput.activo || 'all'}
                          onValueChange={(value) => 
                            handleColumnFilterInput('activo', value === 'all' ? '' : value)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="true">Activos</SelectItem>
                            <SelectItem value="false">Inactivos</SelectItem>
                          </SelectContent>
                        </Select>
                      </th>
                    )}
                    
                    <th className="sticky right-0 z-10 bg-background px-3 py-1"></th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={columnasVisibles.length + 2} className="px-3 py-8 text-center text-sm">
                        Cargando clientes...
                      </td>
                    </tr>
                  ) : clientes.length === 0 ? (
                    <tr>
                      <td colSpan={columnasVisibles.length + 2} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        No se encontraron clientes
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr
                        key={cliente._id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-background px-3 py-2">
                          <Checkbox
                            checked={selectedClientes.includes(cliente._id)}
                            onCheckedChange={() => handleSelectCliente(cliente._id)}
                          />
                        </td>
                        
                        {columnasVisibles.includes('codigo') && (
                          <td className="px-3 py-2 font-medium">{cliente.codigo}</td>
                        )}
                        
                        {columnasVisibles.includes('nombre') && (
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-medium">{cliente.nombre}</p>
                              {cliente.nombreComercial && (
                                <p className="text-xs text-muted-foreground">
                                  {cliente.nombreComercial}
                                </p>
                              )}
                            </div>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('nif') && (
                          <td className="px-3 py-2">{cliente.nif}</td>
                        )}
                        
                        {columnasVisibles.includes('email') && (
                          <td className="px-3 py-2">
                            {cliente.email && (
                              <a href={`mailto:${cliente.email}`} className="text-primary hover:underline">
                                {cliente.email}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('telefono') && (
                          <td className="px-3 py-2">
                            {cliente.telefono && (
                              <a href={`tel:${cliente.telefono}`} className="hover:underline">
                                {cliente.telefono}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('tipoCliente') && (
                          <td className="px-3 py-2">
                            <Badge variant="outline">
                              {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                            </Badge>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('direccion') && (
                          <td className="px-3 py-2">
                            <div className="text-xs">
                              <p>{cliente.direccion?.calle}</p>
                              <p className="text-muted-foreground">
                                {cliente.direccion?.codigoPostal} {cliente.direccion?.ciudad}
                              </p>
                            </div>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('formaPago') && (
                          <td className="px-3 py-2">
                            <span className="text-xs">
                              {cliente.formaPago === 'contado' && 'Contado'}
                              {cliente.formaPago === 'transferencia' && 'Transferencia'}
                              {cliente.formaPago === 'domiciliacion' && 'Domiciliación'}
                              {cliente.formaPago === 'confirming' && 'Confirming'}
                              {cliente.formaPago === 'pagare' && 'Pagaré'}
                            </span>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('riesgoActual') && (
                          <td className="px-3 py-2 text-right">
                            <span className={`font-medium ${
                              cliente.limiteCredito && (cliente.riesgoActual || 0) > cliente.limiteCredito 
                                ? 'text-red-500' 
                                : ''
                            }`}>
                              {(cliente.riesgoActual || 0).toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </span>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('limiteCredito') && (
                          <td className="px-3 py-2 text-right">
                            {cliente.limiteCredito ? (
                              <span>
                                {cliente.limiteCredito.toLocaleString('es-ES', {
                                  style: 'currency',
                                  currency: 'EUR',
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('activo') && (
                          <td className="px-3 py-2">
                            <Badge variant={cliente.activo ? 'success' : 'secondary'}>
                              {cliente.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        )}
                        
                        <td className="sticky right-0 z-10 bg-background px-3 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/clientes/${cliente._id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/clientes/${cliente._id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({
                                  open: true,
                                  clienteIds: [cliente._id],
                                  clienteNombres: [cliente.nombre],
                                })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </Card>

        {/* PAGINACIÓN */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} clientes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
                disabled={pagination.page === pagination.pages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* DIALOG DE CONFIRMACIÓN PARA ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => 
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.clienteIds.length === 1 
                  ? 'el siguiente cliente' 
                  : `los siguientes ${deleteDialog.clienteIds.length} clientes`}?
                <ul className="mt-2 max-h-32 overflow-y-auto">
                  {deleteDialog.clienteNombres.map((nombre, index) => (
                    <li key={index} className="text-sm">• {nombre}</li>
                  ))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, clienteIds: [], clienteNombres: [] })}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}