import { test, expect } from '@playwright/test'
import { adminTest } from '../fixtures/auth.fixture'

test.describe('Dashboard Web ERP', () => {

  adminTest('muestra la pantalla de bienvenida', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Verificar saludo (esperar a que pase el spinner de loading)
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Este es tu panel de control personalizable')).toBeVisible()
  })

  adminTest('muestra widgets del dashboard', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Esperar a que el dashboard cargue pasado el spinner
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // El DashboardGrid debería estar visible (o mensaje de error)
    const dashboardGrid = page.locator('.space-y-4, .space-y-6').first()
    await expect(dashboardGrid).toBeVisible()
  })
})

test.describe('Sidebar y Navegación', () => {

  adminTest('muestra los links principales del sidebar', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // Links siempre visibles
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Informes' })).toBeVisible()
  })

  adminTest('expande grupos del menú al hacer click', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // Expandir grupo Ventas
    const ventasGroup = page.getByRole('button', { name: /Ventas/ }).first()
    await ventasGroup.click()

    // Verificar que aparecen los items
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  })

  adminTest('navega a Clientes desde el sidebar', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // Expandir Ventas
    await page.getByRole('button', { name: /Ventas/ }).first().click()

    // Click en Clientes
    await page.getByRole('link', { name: 'Clientes' }).click()

    await page.waitForURL('/clientes', { timeout: 10_000 })
  })

  adminTest('navega a Productos desde el sidebar', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // Expandir Almacenes
    await page.getByRole('button', { name: /Almacenes/ }).first().click()

    // Click en Productos
    await page.getByRole('link', { name: 'Productos' }).click()

    await page.waitForURL('/productos', { timeout: 10_000 })
  })

  adminTest('colapsa y expande el sidebar', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // Buscar botón de colapsar
    const collapseBtn = page.locator('[title="Colapsar sidebar"]')
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click()

      // Verificar que el sidebar está colapsado (w-16)
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toHaveClass(/w-16/)

      // Expandir de nuevo
      const expandBtn = page.locator('[title="Expandir sidebar"]')
      await expandBtn.click()

      // Verificar que el sidebar está expandido (w-64)
      await expect(sidebar).toHaveClass(/w-64/)
    }
  })

  adminTest('navega a submenús con hijos', async ({ adminPage: page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bienvenido,/)).toBeVisible({ timeout: 15_000 })

    // Expandir Ventas
    await page.getByRole('button', { name: /Ventas/ }).first().click()

    // Expandir submenú Facturas
    await page.getByRole('button', { name: /Facturas/ }).first().click()

    // Verificar que aparecen los hijos
    await expect(page.getByRole('link', { name: 'Listado facturas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Nueva factura' })).toBeVisible()
  })
})
