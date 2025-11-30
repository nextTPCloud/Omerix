'use client'

import * as React from 'react'
import { Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface FullCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: () => Promise<void>
  submitLabel?: string
  loading?: boolean
  // Tamaño del modal
  size?: 'default' | 'lg' | 'xl' | 'full'
  // Altura máxima del contenido
  maxHeight?: string
}

const sizeClasses = {
  default: 'sm:max-w-[600px]',
  lg: 'sm:max-w-[800px]',
  xl: 'sm:max-w-[1000px]',
  full: 'sm:max-w-[90vw]',
}

export function FullCreateModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Crear',
  loading = false,
  size = 'lg',
  maxHeight = '70vh',
}: FullCreateModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} p-0 gap-0`}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <ScrollArea className="flex-1" style={{ maxHeight }}>
            <div className="p-6">
              {children}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
