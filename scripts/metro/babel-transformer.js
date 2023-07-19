const svgTransformer = require("react-native-svg-transformer");
const markdownTransformer = require("./markdown-transformer");

module.exports = markdownTransformer(svgTransformer);
