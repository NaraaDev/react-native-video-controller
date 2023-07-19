module.exports = {
  preset: "react-native",
  transform: {
    "\\.(ts|tsx)$": [
      "ts-jest",
      { tsconfig: "tsconfig.spec.json", babelConfig: true },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?(@react-native|react-native)|react-clone-referenced-element|@react-native-community|@unimodules|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules-*|native-base|dooboo-ui|@dooboo-ui|@sentry/.*|sentry-expo|victory-.*)",
  ],
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)$",
  testPathIgnorePatterns: ["\\.snap$", "<rootDir>/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "\\.svg$": "<rootDir>/test/stubs/svg.js",
    "\\.(jpg|png)$": "<rootDir>/test/stubs/image.js",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/build/",
    "<rootDir>/node_modules/",
    "<rootDir>/.history/",
  ],
  cacheDirectory: ".jest/cache",
};
