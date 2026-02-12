import { expect } from '@playwright/test'
import { adminTest } from '../fixtures/auth.fixture'

adminTest.describe('Facturas de Venta', () => {

  adminTest('muestra el listado de facturas', async ({ adminPage: page }) => {
    await page.goto('/facturas')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Facturas/i })).toBeVisible({ timeout: 15_000 })
  })

  adminTest('navega a nueva factura', async ({ adminPage: page }) => {
    await page.goto('/facturas')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Facturas/i })).toBeVisible({ timeout: 15_000 })

    // Usar main para evitar duplicados con el sidebar
    const nuevoBtn = page.locator('main').getByRole('link', { name: /Nueva|Nuevo/i })
                     .or(page.locator('main').getByRole('button', { name: /Nueva|Nuevo/i }))
    await expect(nuevoBtn.first()).toBeVisible({ timeout: 10_000 })
    await nuevoBtn.first().click()

    await page.waitForURL('/facturas/nuevo', { timeout: 10_000 })
  })

  adminTest('el formulario de factura tiene campos esenciales', async ({ adminPage: page }) => {
    await page.goto('/facturas/nuevo')
    await page.waitForLoadState('networkidle')

    // Verificar elementos típicos de una factura
    const clienteField = page.getByText(/Cliente/i).first()
    await expect(clienteField).toBeVisible({ timeout: 15_000 })

    // Tabla de líneas
    const lineasTable = page.locator('table')
                        .or(page.getByText(/Líneas|Lineas|Artículo|Producto/i).first())
    await expect(lineasTable).toBeVisible()

    // Botón guardar
    const guardarBtn = page.getByRole('button', { name: /Guardar|Crear/i })
    await expect(guardarBtn).toBeVisible()
  })
})

adminTest.describe('Presupuestos', () => {

  adminTest('muestra el listado de presupuestos', async ({ adminPage: page }) => {
    await page.goto('/presupuestos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Presupuestos/i })).toBeVisible({ timeout: 15_000 })
  })

  adminTest('navega a nuevo presupuesto', async ({ adminPage: page }) => {
    await page.goto('/presupuestos')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Presupuestos/i })).toBeVisible({ timeout: 15_000 })

    // Usar main para evitar duplicados con el sidebar
    const nuevoBtn = page.locator('main').getByRole('link', { name: /Nuevo/i })
                     .or(page.locator('main').getByRole('button', { name: /Nuevo/i }))
    await expect(nuevoBtn.first()).toBeVisible({ timeout: 10_000 })
    await nuevoBtn.first().click()

    await page.waitForURL('/presupuestos/nuevo', { timeout: 10_000 })
  })
})

adminTest.describe('Pedidos', () => {

  adminTest('muestra el listado de pedidos', async ({ adminPage: page }) => {
    await page.goto('/pedidos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Pedidos/i })).toBeVisible({ timeout: 15_000 })
  })
})

adminTest.describe('Albaranes', () => {

  adminTest('muestra el listado de albaranes', async ({ adminPage: page }) => {
    await page.goto('/albaranes')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Albaranes/i })).toBeVisible({ timeout: 15_000 })
  })
})
