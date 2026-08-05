module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/contract/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  transform: {
    '^.+\\.[j]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ffc-ahwr-common-library|@defra/hapi-tracing|@defra/hapi-secure-context|p-limit|yocto-queue)/)'
  ]
}
