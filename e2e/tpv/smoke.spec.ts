import { test, expect } from '@playwright/test'

/**
 * Smoke tests del TPV - verifican que la app carga
 */
test.describe('Smoke Tests TPV', () => {

  test('la página principal del TPV carga', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()
  })

  test('no hay errores JS críticos al cargar', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (error) => jsErrors.push(error.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const erroresCriticos = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('hydration')
    )
    expect(erroresCriticos).toHaveLength(0)
  })

  test('la ruta /comandero carga', async ({ page }) => {
    const response = await page.goto('/comandero')
    expect(response?.ok()).toBeTruthy()
  })
})
