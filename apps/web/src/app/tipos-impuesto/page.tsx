'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tiposImpuestoService } from '@/services/tipos-impuesto.service';
import { TipoImpuesto } from '@/types/tipo-impuesto.types';
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
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TiposImpuestoPage() {
  const router = useRouter();

  const [tiposImpuesto, setTiposImpuesto] = useState<TipoImpuesto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    tipoIds: string[];
    tipoNombres: string[];
  }>({ open: false, tipoIds: [], tipoNombres: [] });

  const [pagination, setpagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchTiposImpuesto();
  }, [pagination.page, searchQuery]);

  const fetchTiposImpuesto = async () => {
    try {
      setIsLoading(true);
      const response = await tiposImpuestoService.getAll({
        q: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setTiposImpuesto(response.data || []);

      if (response.pagination) {
        setpagination((prev) => ({
          ...prev,
          total: response.pagination!.total,
          pages: response.pagination!.totalPages,
        }));
      }
    } catch (error: any) {
      console.error('Error al cargar tipos de impuesto:', error);
      toast.error('Error al cargar los tipos de impuesto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTipo = (id: string) => {
    setSelectedTipos((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTipos([]);
    } else {
      setSelectedTipos(tiposImpuesto.map((t) => t._id));
    }
    setSelectAll(!selectAll);
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        deleteDialog.tipoIds.map((id) => tiposImpuestoService.delete(id))
      );
      toast.success(
        `${deleteDialog.tipoIds.length} tipo(s) de impuesto eliminado(s) correctamente`
      );
      setDeleteDialog({ open: false, tipoIds: [], tipoNombres: [] });
      setSelectedTipos([]);
      fetchTiposImpuesto();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleSetPredeterminado = async (id: string) => {
    try {
      await tiposImpuestoService.setPredeterminado(id);
      toast.success('Tipo de impuesto establecido como predeterminado');
      fetchTiposImpuesto();
    } catch (error: any) {
      toast.error('Error al establecer como predeterminado');
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setpagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tipos de Impuesto</h1>
            <p className="text-muted-foreground">
              Gestiona los tipos de impuesto (IVA, IGIC, IPSI, etc.)
            </p>
          </div>
          <Button onClick={() => router.push('/tipos-impuesto/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tipo de Impuesto
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
              <Button variant="outline" size="sm" onClick={fetchTiposImpuesto} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 sm:mr-2 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>

          {selectedTipos.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md mt-4">
              <span className="text-sm font-medium">{selectedTipos.length} seleccionado(s)</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const tipos = tiposImpuesto.filter((t) => selectedTipos.includes(t._id));
                  setDeleteDialog({
                    open: true,
                    tipoIds: selectedTipos,
                    tipoNombres: tipos.map((t) => t.nombre),
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Porcentaje</th>
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
                ) : tiposImpuesto.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                      <p className="text-muted-foreground">No se encontraron tipos de impuesto</p>
                    </td>
                  </tr>
                ) : (
                  tiposImpuesto.map((tipo) => (
                    <tr key={tipo._id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedTipos.includes(tipo._id)}
                          onCheckedChange={() => handleSelectTipo(tipo._id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{tipo.codigo}</span>
                          {tipo.predeterminado && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{tipo.nombre}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{tipo.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold">{tipo.porcentaje}%</span>
                        {tipo.recargoEquivalencia && tipo.porcentajeRecargo && (
                          <span className="text-xs text-muted-foreground ml-2">
                            + {tipo.porcentajeRecargo}% RE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={tipo.activo ? 'default' : 'secondary'}>
                          {tipo.activo ? 'Activo' : 'Inactivo'}
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
                              onClick={() => router.push(`/tipos-impuesto/${tipo._id}/editar`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {!tipo.predeterminado && (
                              <DropdownMenuItem onClick={() => handleSetPredeterminado(tipo._id)}>
                                <Star className="h-4 w-4 mr-2" />
                                Establecer como predeterminado
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  tipoIds: [tipo._id],
                                  tipoNombres: [tipo.nombre],
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
                Mostrando {tiposImpuesto.length} de {pagination.total} tipos de impuesto
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setpagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setpagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.tipoIds.length > 1 ? 'estos tipos de impuesto' : 'este tipo de impuesto'}?
                <ul className="mt-2 list-disc list-inside">
                  {deleteDialog.tipoNombres.map((nombre, index) => (
                    <li key={index}><strong>{nombre}</strong></li>
                  ))}
                </ul>
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, tipoIds: [], tipoNombres: [] })}>
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
