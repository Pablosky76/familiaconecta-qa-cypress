const { defineConfig } = require('cypress');
module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: { baseUrl: 'http://127.0.0.1:4194', specPattern: 'cypress/e2e/**/*.cy.js', supportFile: 'cypress/support/e2e.js', video: false },
  viewportWidth: 1280, viewportHeight: 800,
});
