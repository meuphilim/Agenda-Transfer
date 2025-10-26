// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // A URL base para os testes. O servidor dev deve estar rodando.
    baseURL: 'http://localhost:5173',
    // Captura screenshots em caso de falha.
    screenshot: 'only-on-failure',
  },
  // Onde os testes estão localizados.
  testDir: './tests/visual',
  // Timeout global para os testes.
  timeout: 30 * 1000,
});
