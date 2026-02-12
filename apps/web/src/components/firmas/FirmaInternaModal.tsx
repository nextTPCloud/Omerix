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
import SignatureCanvas from './SignatureCanvas'
import { firmasService } from '@/services/firmas.service'
import { toast } from 'sonner'
import { Fingerprint, Loader2 } from 'lucide-react'

interface FirmaInternaModalProps {
  tipoDocumento: string
  documentoId: string
  tipoFirmante: 'tecnico' | 'cliente'
  open: boolean
  onClose: () => void
  onFirmado?: () => void
}

export function FirmaInternaModal({
  tipoDocumento,
  documentoId,
  tipoFirmante,
  open,
  onClose,
  onFirmado,
}: FirmaInternaModalProps) {
  const [nombre, setNombre] = useState('')
  const [nif, setNif] = useState('')
  const [imagenFirma, setImagenFirma] = useState('')
  const [firmando, setFirmando] = useState(false)

  const handleFirmar = async () => {
    if (!nombre.trim()) {
      toast.error('Indica el nombre del firmante')
      return
    }
    if (!imagenFirma) {
      toast.error('Dibuja la firma')
      return
    }

    setFirmando(true)
    try {
      const res = await firmasService.firmarInterna({
        documentoId,
        tipoDocumento,
        imagenFirma,
        firmante: {
          nombre: nombre.trim(),
          nif: nif.trim() || undefined,
        },
      })

      if (res.success) {
        toast.success('Documento firmado correctamente')
        onFirmado?.()
        onClose()
        // Reset
        setNombre('')
        setNif('')
        setImagenFirma('')
      } else {
        toast.error(res.error || 'Error al firmar')
      }
    } catch {
      toast.error('Error al firmar el documento')
    } finally {
      setFirmando(false)
    }
  }

  const titulo = tipoFirmante === 'tecnico' ? 'Firma del Técnico' : 'Firma del Cliente'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            {titulo}
          </DialogTitle>
          <DialogDescription>
            Firma el documento de forma presencial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input
                placeholder="Nombre del firmante"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>NIF/DNI</Label>
              <Input
                placeholder="NIF o DNI"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Firma</Label>
            <SignatureCanvas
              onSignature={setImagenFirma}
              width={460}
              height={160}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={firmando}>
            Cancelar
          </Button>
          <Button onClick={handleFirmar} disabled={firmando}>
            {firmando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Firmando...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 mr-2" />
                Firmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
