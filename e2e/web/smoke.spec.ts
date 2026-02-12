import { test, expect } from '@playwright/test'

/**
 * Tests de smoke: verifican que las páginas principales cargan sin errores
 * Estos tests no requieren autenticación
 */
test.describe('Smoke Tests - Páginas Públicas', () => {

  test('la página raíz carga', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok() || response?.status() === 307 || response?.status() === 302).toBeTruthy()
  })

  test('la página de login carga sin errores JS', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (error) => jsErrors.push(error.message))

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // No debería haber errores JS críticos
    const erroresCriticos = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && // Ignorar ResizeObserver
      !e.includes('hydration') // Ignorar errores de hidratación menores
    )
    expect(erroresCriticos).toHaveLength(0)
  })

  test('la página de registro carga', async ({ page }) => {
    const response = await page.goto('/register')
    expect(response?.ok()).toBeTruthy()
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Crear Cuenta' })).toBeVisible()
  })

  test('la página de planes carga', async ({ page }) => {
    const response = await page.goto('/planes')
    expect(response?.ok()).toBeTruthy()
  })

  test('la página de forgot-password carga', async ({ page }) => {
    const response = await page.goto('/forgot-password')
    expect(response?.ok()).toBeTruthy()
  })
})

test.describe('Smoke Tests - Redirección sin auth', () => {

  test('dashboard redirige sin sesión', async ({ page }) => {
    await page.goto('/dashboard')

    // El dashboard layout redirige a / (landing page) cuando no hay sesión
    // Esperar a que la URL cambie (ya no sea /dashboard)
    await expect(async () => {
      const url = new URL(page.url())
      expect(url.pathname).not.toContain('/dashboard')
    }).toPass({ timeout: 15_000 })
  })

  test('clientes redirige sin sesión', async ({ page }) => {
    await page.goto('/clientes')

    await expect(async () => {
      const url = new URL(page.url())
      expect(url.pathname).not.toContain('/clientes')
    }).toPass({ timeout: 15_000 })
  })

  test('productos redirige sin sesión', async ({ page }) => {
    await page.goto('/productos')

    await expect(async () => {
      const url = new URL(page.url())
      expect(url.pathname).not.toContain('/productos')
    }).toPass({ timeout: 15_000 })
  })

  test('configuración redirige sin sesión', async ({ page }) => {
    await page.goto('/configuracion')

    await expect(async () => {
      const url = new URL(page.url())
      expect(url.pathname).not.toContain('/configuracion')
    }).toPass({ timeout: 15_000 })
  })
})
