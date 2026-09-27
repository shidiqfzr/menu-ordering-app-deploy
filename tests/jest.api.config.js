import path from 'path';

export default {
  rootDir: "../",
  testMatch: ["<rootDir>/tests/api/**/*.test.js"],
  testPathIgnorePatterns: ["<rootDir>/tests/api/setup/"],
  testEnvironment: "node",
  transform: {},
  moduleDirectories: [
    "node_modules",
    "<rootDir>/backend/node_modules",
    "<rootDir>/node_modules"
  ],
  verbose: true,
  testTimeout: 35000,
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Bujang Cafe - API Test Report",
        outputPath: path.resolve(process.cwd(), "tests/reports/api-test-report.html"),
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: "lightTheme"
      }
    ]
  ]
};
