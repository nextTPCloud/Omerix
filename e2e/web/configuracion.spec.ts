import { expect } from '@playwright/test'
import { adminTest, superadminTest } from '../fixtures/auth.fixture'

adminTest.describe('Configuración Empresa', () => {

  adminTest('carga la página de configuración', async ({ adminPage: page }) => {
    await page.goto('/configuracion')
    await page.waitForLoadState('networkidle')

    // La página de configuración debería cargar
    await expect(page.getByText(/Configuración|Empresa|Mi Empresa/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

adminTest.describe('Informes', () => {

  adminTest('muestra la página de informes', async ({ adminPage: page }) => {
    await page.goto('/informes')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Informes/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

superadminTest.describe('Panel de Administración (Superadmin)', () => {

  superadminTest('muestra el panel de administración', async ({ superadminPage: page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Administración|Panel|Empresas/i).first()).toBeVisible({ timeout: 15_000 })
  })

  superadminTest('muestra el listado de empresas', async ({ superadminPage: page }) => {
    await page.goto('/admin/empresas')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Empresas/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

adminTest.describe('Compras', () => {

  adminTest('muestra proveedores', async ({ adminPage: page }) => {
    await page.goto('/proveedores')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Proveedores/i })).toBeVisible({ timeout: 15_000 })
  })

  adminTest('muestra facturas de compra', async ({ adminPage: page }) => {
    await page.goto('/compras/facturas')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Facturas/i).first()).toBeVisible({ timeout: 15_000 })
  })

  adminTest('muestra pedidos de compra', async ({ adminPage: page }) => {
    await page.goto('/compras/pedidos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Pedidos/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

adminTest.describe('RRHH y Personal', () => {

  adminTest('muestra el listado de personal', async ({ adminPage: page }) => {
    await page.goto('/personal')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Personal/i })).toBeVisible({ timeout: 15_000 })
  })

  adminTest('muestra departamentos', async ({ adminPage: page }) => {
    await page.goto('/departamentos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Departamentos/i })).toBeVisible({ timeout: 15_000 })
  })
})

adminTest.describe('Proyectos y Partes', () => {

  adminTest('muestra listado de proyectos', async ({ adminPage: page }) => {
    await page.goto('/proyectos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Proyectos/i })).toBeVisible({ timeout: 15_000 })
  })

  adminTest('muestra listado de partes de trabajo', async ({ adminPage: page }) => {
    await page.goto('/partes-trabajo')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Partes/i).first()).toBeVisible({ timeout: 15_000 })
  })
})
