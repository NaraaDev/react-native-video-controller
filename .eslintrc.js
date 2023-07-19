module.exports = {
  root: true,
  extends: "@react-native",
  rules: {
    "@typescript-eslint/no-non-null-assertion": "warn",
    // RN 0.70.0 introduces new JSX transform, so that React namespace import is not required
    "react/react-in-jsx-scope": "off",
  },
};
