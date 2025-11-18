'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { almacenesService } from '@/services/almacenes.service';
import { Almacen } from '@/types/almacen.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  RefreshCw,
  Warehouse,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AlmacenesPage() {
  const router = useRouter();

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlmacenes, setSelectedAlmacenes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    almacenIds: string[];
    almacenNombres: string[];
  }>({ open: false, almacenIds: [], almacenNombres: [] });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAlmacenes();
  }, [pagination.page, searchQuery]);

  const fetchAlmacenes = async () => {
    try {
      setIsLoading(true);
      const response = await almacenesService.getAll({
        q: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setAlmacenes(response.data || []);

      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: response.pagination!.total,
          pages: response.pagination!.totalPages,
        }));
      }
    } catch (error: any) {
      console.error('Error al cargar almacenes:', error);
      toast.error('Error al cargar los almacenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlmacen = (id: string) => {
    setSelectedAlmacenes((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAlmacenes([]);
    } else {
      setSelectedAlmacenes(almacenes.map((a) => a._id));
    }
    setSelectAll(!selectAll);
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        deleteDialog.almacenIds.map((id) => almacenesService.delete(id))
      );
      toast.success(
        `${deleteDialog.almacenIds.length} almacén(es) eliminado(s) correctamente`
      );
      setDeleteDialog({ open: false, almacenIds: [], almacenNombres: [] });
      setSelectedAlmacenes([]);
      fetchAlmacenes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleSetPrincipal = async (id: string) => {
    try {
      await almacenesService.setPrincipal(id);
      toast.success('Almacén establecido como principal');
      fetchAlmacenes();
    } catch (error: any) {
      toast.error('Error al establecer como principal');
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Almacenes</h1>
            <p className="text-muted-foreground">
              Gestiona los almacenes de tu empresa
            </p>
          </div>
          <Button onClick={() => router.push('/almacenes/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Almacén
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nombre..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAlmacenes} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 sm:mr-2 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>

          {selectedAlmacenes.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md mt-4">
              <span className="text-sm font-medium">{selectedAlmacenes.length} seleccionado(s)</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const almacenesAEliminar = almacenes.filter((a) => selectedAlmacenes.includes(a._id));
                  setDeleteDialog({
                    open: true,
                    almacenIds: selectedAlmacenes,
                    almacenNombres: almacenesAEliminar.map((a) => a.nombre),
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar seleccionados
              </Button>
            </div>
          )}
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ubicación</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Responsable</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : almacenes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                      <p className="text-muted-foreground">No se encontraron almacenes</p>
                    </td>
                  </tr>
                ) : (
                  almacenes.map((almacen) => (
                    <tr key={almacen._id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedAlmacenes.includes(almacen._id)}
                          onCheckedChange={() => handleSelectAlmacen(almacen._id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{almacen.codigo}</span>
                          {almacen.esPrincipal && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{almacen.nombre}</span>
                      </td>
                      <td className="px-4 py-3">
                        {almacen.direccion ? (
                          <span className="text-sm text-muted-foreground">
                            {almacen.direccion.ciudad}, {almacen.direccion.provincia}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{almacen.responsable || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={almacen.activo ? 'default' : 'secondary'}>
                          {almacen.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/almacenes/${almacen._id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/almacenes/${almacen._id}/editar`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {!almacen.esPrincipal && (
                              <DropdownMenuItem onClick={() => handleSetPrincipal(almacen._id)}>
                                <Star className="h-4 w-4 mr-2" />
                                Establecer como principal
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  almacenIds: [almacen._id],
                                  almacenNombres: [almacen.nombre],
                                })
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {almacenes.length} de {pagination.total} almacenes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.almacenIds.length > 1 ? 'estos almacenes' : 'este almacén'}?
                <ul className="mt-2 list-disc list-inside">
                  {deleteDialog.almacenNombres.map((nombre, index) => (
                    <li key={index}><strong>{nombre}</strong></li>
                  ))}
                </ul>
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, almacenIds: [], almacenNombres: [] })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
