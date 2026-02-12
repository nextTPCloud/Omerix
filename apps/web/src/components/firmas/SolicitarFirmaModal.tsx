'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { firmasService } from '@/services/firmas.service'
import { toast } from 'sonner'
import { Plus, Trash2, Fingerprint, Loader2 } from 'lucide-react'

interface Firmante {
  nombre: string
  email: string
}

interface SolicitarFirmaModalProps {
  tipoDocumento: string
  documentoId: string
  codigoDocumento: string
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function SolicitarFirmaModal({
  tipoDocumento,
  documentoId,
  codigoDocumento,
  open,
  onClose,
  onCreated,
}: SolicitarFirmaModalProps) {
  const [firmantes, setFirmantes] = useState<Firmante[]>([{ nombre: '', email: '' }])
  const [mensaje, setMensaje] = useState('')
  const [diasExpiracion, setDiasExpiracion] = useState(7)
  const [enviando, setEnviando] = useState(false)

  const addFirmante = () => {
    setFirmantes([...firmantes, { nombre: '', email: '' }])
  }

  const removeFirmante = (index: number) => {
    if (firmantes.length <= 1) return
    setFirmantes(firmantes.filter((_, i) => i !== index))
  }

  const updateFirmante = (index: number, field: keyof Firmante, value: string) => {
    const updated = [...firmantes]
    updated[index] = { ...updated[index], [field]: value }
    setFirmantes(updated)
  }

  const handleSubmit = async () => {
    // Validar
    const firmantesValidos = firmantes.filter(f => f.nombre.trim())
    if (firmantesValidos.length === 0) {
      toast.error('Añade al menos un firmante con nombre')
      return
    }

    const tieneEmailInvalido = firmantesValidos.some(f => f.email && !f.email.includes('@'))
    if (tieneEmailInvalido) {
      toast.error('Verifica los emails de los firmantes')
      return
    }

    setEnviando(true)
    try {
      const fechaExpiracion = new Date(Date.now() + diasExpiracion * 24 * 60 * 60 * 1000).toISOString()
      const res = await firmasService.crearSolicitud({
        documentoId,
        tipoDocumento,
        codigoDocumento,
        firmantes: firmantesValidos.map(f => ({
          nombre: f.nombre.trim(),
          email: f.email.trim() || undefined,
        })),
        fechaExpiracion,
        mensajePersonalizado: mensaje.trim() || undefined,
      })

      if (res.success) {
        toast.success('Solicitud de firma creada correctamente')
        onCreated?.()
        onClose()
        // Reset
        setFirmantes([{ nombre: '', email: '' }])
        setMensaje('')
        setDiasExpiracion(7)
      } else {
        toast.error(res.error || 'Error al crear solicitud')
      }
    } catch {
      toast.error('Error al crear solicitud de firma')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Solicitar Firma
          </DialogTitle>
          <DialogDescription>
            Solicita firma digital para {codigoDocumento}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Firmantes */}
          <div className="space-y-3">
            <Label>Firmantes</Label>
            {firmantes.map((firmante, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Nombre del firmante *"
                    value={firmante.nombre}
                    onChange={(e) => updateFirmante(idx, 'nombre', e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Email (para enviar enlace)"
                    value={firmante.email}
                    onChange={(e) => updateFirmante(idx, 'email', e.target.value)}
                  />
                </div>
                {firmantes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 text-red-500 hover:text-red-700"
                    onClick={() => removeFirmante(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFirmante}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir firmante
            </Button>
          </div>

          {/* Mensaje personalizado */}
          <div className="space-y-1">
            <Label>Mensaje personalizado (opcional)</Label>
            <Textarea
              placeholder="Mensaje que verán los firmantes..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
            />
          </div>

          {/* Días de expiración */}
          <div className="space-y-1">
            <Label>Días de expiración</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={diasExpiracion}
              onChange={(e) => setDiasExpiracion(parseInt(e.target.value) || 7)}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              El enlace de firma expirará en {diasExpiracion} días
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={enviando}>
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 mr-2" />
                Solicitar Firma
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
