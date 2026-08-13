import neostandard from 'neostandard'
import sonarjs from 'eslint-plugin-sonarjs'

export default [
  ...neostandard({
    env: ['node', 'jest'],
    ignores: [...neostandard.resolveIgnoresFromGitignore()],
    noJsx: true,
    noStyle: true
  }),
  {
    plugins: {
      sonarjs
    },
    rules: {
      'sonarjs/no-commented-code': 'error'
    }
  }
]
