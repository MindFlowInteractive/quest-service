module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/main.ts",
    "!src/**/*.module.ts",
  ],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  roots: ["<rootDir>/src/", "<rootDir>/test/"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
