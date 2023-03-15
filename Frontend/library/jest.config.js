module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  modulePathIgnorePatterns: ["<rootDir>/build/"],
  testPathIgnorePatterns: ["<rootDir>/build/", "/node_modules/"],
  globals: {
    TextDecoder: TextDecoder,
    TextEncoder: TextEncoder,
  }
};
