module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "/node_modules/"],
};
