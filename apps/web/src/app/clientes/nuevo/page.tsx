"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NuevoClientePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
            <p className="text-muted-foreground">
              Completa el formulario para crear un nuevo cliente
            </p>
          </div>
        </div>

        {/* Formulario */}
        <ClienteForm />
      </div>
    </DashboardLayout>
  )
}