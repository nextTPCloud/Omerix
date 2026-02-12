import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración de Playwright para tests E2E de Tralok ERP
 * Cubre: Web (ERP), TPV, Comandero y Kiosk
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
  },

  projects: [
    // ─── Web ERP ───
    {
      name: 'web',
      testDir: './e2e/web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.WEB_URL || 'http://localhost:3000',
      },
    },
    // ─── TPV (Punto de Venta) ───
    {
      name: 'tpv',
      testDir: './e2e/tpv',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.TPV_URL || 'http://localhost:3010',
        viewport: { width: 1280, height: 1024 },
      },
    },
    // ─── Comandero (móvil) ───
    {
      name: 'comandero',
      testDir: './e2e/comandero',
      use: {
        ...devices['iPhone 14'],
        baseURL: process.env.TPV_URL || 'http://localhost:3010',
      },
    },
    // ─── Kiosk (pantalla táctil) ───
    {
      name: 'kiosk',
      testDir: './e2e/kiosk',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.KIOSK_URL || 'http://localhost:3012',
        viewport: { width: 1080, height: 1920 }, // Vertical kiosk
      },
    },
  ],
})
