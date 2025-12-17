'use client';

import { CheckCircle, AlertCircle, FileText, User, Package, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ResultadoComando, EntidadResuelta, TipoDocumento } from '@/services/ai.service';
import Link from 'next/link';

interface AICommandResultProps {
  resultado: ResultadoComando;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Mapeo de tipos de documento a rutas
const documentRoutes: Record<TipoDocumento, string> = {
  presupuesto: '/presupuestos',
  pedido: '/pedidos',
  albaran: '/albaranes',
  factura: '/facturas',
  presupuesto_compra: '/compras/presupuestos',
  pedido_compra: '/compras/pedidos',
  albaran_compra: '/compras/albaranes',
  factura_compra: '/compras/facturas',
};

// Nombres legibles para tipos de documento
const documentNames: Record<TipoDocumento, string> = {
  presupuesto: 'Presupuesto',
  pedido: 'Pedido',
  albaran: 'Albarán',
  factura: 'Factura',
  presupuesto_compra: 'Presupuesto de Compra',
  pedido_compra: 'Pedido de Compra',
  albaran_compra: 'Albarán de Compra',
  factura_compra: 'Factura de Compra',
};

export function AICommandResult({ resultado, onConfirm, onCancel }: AICommandResultProps) {
  const { exito, mensaje, tipoDocumento, documentoCreado, entidadesResueltas, requiereConfirmacion, datosParaConfirmar, sugerencias, error } = resultado;

  // Si fue exitoso y hay documento creado
  if (exito && documentoCreado) {
    const docRoute = tipoDocumento ? documentRoutes[tipoDocumento] : '';
    const docName = tipoDocumento ? documentNames[tipoDocumento] : 'Documento';

    return (
      <Card className="mt-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                {docName} creado correctamente
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Código: <span className="font-mono font-semibold">{documentoCreado.codigo}</span>
              </p>
              {documentoCreado.total && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Total: <span className="font-semibold">{documentoCreado.total.toFixed(2)} €</span>
                </p>
              )}
              {docRoute && documentoCreado._id && (
                <Link href={`${docRoute}/${documentoCreado._id}`}>
                  <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-green-700">
                    Ver documento <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si requiere confirmación
  if (requiereConfirmacion && datosParaConfirmar) {
    return (
      <Card className="mt-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            Confirmar creación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Cliente/Proveedor */}
          {datosParaConfirmar.cliente && (
            <EntidadInfo entidad={datosParaConfirmar.cliente} tipo="cliente" />
          )}
          {datosParaConfirmar.proveedor && (
            <EntidadInfo entidad={datosParaConfirmar.proveedor} tipo="proveedor" />
          )}

          {/* Productos */}
          {datosParaConfirmar.productos && datosParaConfirmar.productos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Productos:
              </p>
              <div className="space-y-1">
                {datosParaConfirmar.productos.map((prod, idx) => (
                  <EntidadInfo key={idx} entidad={prod} tipo="producto" />
                ))}
              </div>
            </div>
          )}

          {/* Totales */}
          {datosParaConfirmar.totales && (
            <div className="border-t border-yellow-200 dark:border-yellow-700 pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{datosParaConfirmar.totales.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA:</span>
                <span>{datosParaConfirmar.totales.iva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{datosParaConfirmar.totales.total.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Botones de confirmación */}
          {onConfirm && onCancel && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onConfirm} className="flex-1">
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Si hay error
  if (!exito || error) {
    return (
      <Card className="mt-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                {mensaje || 'Error al procesar el comando'}
              </p>
              {error && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              )}
              {sugerencias && sugerencias.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-800 dark:text-red-200">
                    Sugerencias:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                    {sugerencias.map((sug, idx) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mensaje simple de éxito sin documento
  return (
    <Card className="mt-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {mensaje}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente auxiliar para mostrar información de entidades
function EntidadInfo({ entidad, tipo }: { entidad: EntidadResuelta; tipo: 'cliente' | 'proveedor' | 'producto' }) {
  const Icon = tipo === 'producto' ? Package : User;
  const label = tipo === 'cliente' ? 'Cliente' : tipo === 'proveedor' ? 'Proveedor' : 'Producto';

  if (!entidad.encontrado) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-yellow-600" />
        <span className="text-yellow-800 dark:text-yellow-200">
          {label} no encontrado
        </span>
        {entidad.alternativas && entidad.alternativas.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {entidad.alternativas.length} alternativas
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-green-600" />
      <span className="text-yellow-800 dark:text-yellow-200 font-medium">
        {entidad.nombre}
      </span>
      {tipo === 'producto' && entidad.cantidad && (
        <Badge variant="secondary" className="text-xs">
          x{entidad.cantidad}
        </Badge>
      )}
      {tipo === 'producto' && entidad.precio && (
        <span className="text-xs text-muted-foreground">
          @ {entidad.precio.toFixed(2)} €
        </span>
      )}
    </div>
  );
}
