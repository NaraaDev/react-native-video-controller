module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    ["module:react-native-dotenv"],
    [
      "module-resolver",
      {
        alias: {
          "@": "./src",
          "@root": ".",
        },
      },
    ],
    // Reanimated plugin has to be listed last. See: https://docs.swmansion.com/react-native-reanimated/docs/next/fundamentals/installation#babel-plugin
    "react-native-reanimated/plugin",
  ],
};
