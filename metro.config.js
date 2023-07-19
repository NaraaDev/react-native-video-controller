const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const configOverrides = {
  transformer: {
    babelTransformerPath: require.resolve("./scripts/metro/babel-transformer"),
  },
  resolver: {
    // Adapted from https://github.com/facebook/metro/blob/main/packages/metro-config/src/defaults/defaults.js
    // NOTE: svg format is removed
    assetExts: [
      // Image formats
      "bmp",
      "gif",
      "jpg",
      "jpeg",
      "png",
      "psd",
      "webp",
      // Video formats
      "m4v",
      "mov",
      "mp4",
      "mpeg",
      "mpg",
      "webm",
      // Audio formats
      "aac",
      "aiff",
      "caf",
      "m4a",
      "mp3",
      "wav",
      // Document formats
      "html",
      "pdf",
      "yaml",
      "yml",
      // Font formats
      "otf",
      "ttf",
      // Archives (virtual files)
      "zip",
    ],
    sourceExts: ["js", "jsx", "ts", "tsx", "json", "svg", "md"],
  },
};
module.exports = mergeConfig(defaultConfig, configOverrides);
