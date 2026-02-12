import { test, expect } from '@playwright/test'

/**
 * Smoke tests del Kiosk - verifican que la app carga
 */
test.describe('Smoke Tests Kiosk', () => {

  test('la página principal del Kiosk carga', async ({ page }) => {
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

  test('muestra pantalla de carga o activación', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Debería mostrar algo: carga, activación, o bienvenida
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Al menos uno de estos textos debería ser visible
    const textosPosibles = [
      'Cargando',
      'Conectando',
      'Activar',
      'Token',
      'Bienvenido',
      'Hacer Pedido',
    ]

    let hayTexto = false
    for (const texto of textosPosibles) {
      if (await page.getByText(texto).first().isVisible().catch(() => false)) {
        hayTexto = true
        break
      }
    }
    expect(hayTexto).toBeTruthy()
  })
})
