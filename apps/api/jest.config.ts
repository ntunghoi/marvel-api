export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).m[tj]s'],
  transform: {
    '^.+\\.m[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'mts', 'html'],
  coverageDirectory: '../../coverage/apps/api',
}
