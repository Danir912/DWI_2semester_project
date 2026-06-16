import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run mock',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npm start',
      port: 4300,
      reuseExistingServer: true,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
});
