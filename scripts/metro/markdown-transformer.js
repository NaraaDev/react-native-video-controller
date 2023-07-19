module.exports = (upstreamTransformer) => ({
  transform: async ({ src, filename, options }) => {
    const { remark } = await import("remark");

    if (filename.endsWith(".md")) {
      const ast = remark.parse(src);
      src = `module.exports = ${JSON.stringify(ast)}`;
    }
    return await upstreamTransformer.transform({ src, filename, options });
  },
});
