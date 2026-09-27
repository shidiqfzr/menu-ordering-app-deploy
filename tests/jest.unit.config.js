import path from 'path';

export default {
  rootDir: "../",
  testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
  testEnvironment: "node",
  transform: {},
  moduleDirectories: [
    "node_modules",
    "<rootDir>/backend/node_modules",
    "<rootDir>/node_modules"
  ],
  verbose: true,
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Bujang Cafe - Unit Test Report",
        outputPath: path.resolve(process.cwd(), "tests/reports/unit-test-report.html"),
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: "lightTheme"
      }
    ]
  ]
};
