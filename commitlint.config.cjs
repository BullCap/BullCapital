module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['monorepo', 'web', 'ai', 'infra', 'ci', 'db']],
    'scope-empty': [0], // scope é opcional
  },
}
