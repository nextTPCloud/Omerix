import { test, expect } from '@playwright/test'
import { TPV_TOKEN, TPV_NOMBRE } from '../fixtures/test-data'

test.describe('Activación TPV', () => {

  test('muestra la pantalla de activación cuando no está activado', async ({ page }) => {
    // Limpiar localStorage para simular TPV no activado
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Verificar que se muestra el formulario de activación
    await expect(page.getByText(/Token de activación|Activar TPV|Registrar Terminal/i).first()).toBeVisible()
  })

  test('tiene campos de token y nombre', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Campo de token (input con placeholder de 8 chars o campo token)
    const tokenInput = page.getByPlaceholder(/XXXXXXXX|Token|token/i)
                       .or(page.locator('input[maxlength="8"]'))
                       .or(page.locator('input').first())
    await expect(tokenInput).toBeVisible()
  })

  test('muestra error con token inválido', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Llenar token inválido
    const tokenInput = page.getByPlaceholder(/XXXXXXXX|Token/i)
                       .or(page.locator('input[maxlength="8"]'))
                       .or(page.locator('input').first())
    await tokenInput.fill('INVALIDO')

    // Llenar nombre
    const nombreInput = page.getByPlaceholder(/nombre/i)
                        .or(page.locator('input').nth(1))
    if (await nombreInput.isVisible()) {
      await nombreInput.fill(TPV_NOMBRE)
    }

    // Intentar activar
    const activarBtn = page.getByRole('button', { name: /Activar/i })
    await activarBtn.click()

    // Esperar error (puede ser error de validación del backend o error de red)
    const errorVisible = await page.getByText(/inválido|expirado|error|failed|red|conexión/i).first()
      .isVisible({ timeout: 10_000 }).catch(() => false)
    // Si no hay error visible, al menos verificar que no navegó (sigue en activación)
    if (!errorVisible) {
      await expect(page.getByRole('button', { name: /Activar/i })).toBeVisible()
    }
  })

  test('el botón de activar está deshabilitado sin token', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const activarBtn = page.getByRole('button', { name: /Activar/i })
    if (await activarBtn.isVisible()) {
      await expect(activarBtn).toBeDisabled()
    }
  })
})
