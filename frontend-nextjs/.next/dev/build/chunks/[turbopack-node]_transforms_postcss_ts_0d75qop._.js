module.exports = [
"[turbopack-node]/transforms/postcss.ts?config=[project]/frontend-nextjs/postcss.config.js { CONFIG => \"[project]/frontend-nextjs/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/1yvi_1-o8spf._.js",
  "chunks/[root-of-the-server]__0k6uhqx._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts?config=[project]/frontend-nextjs/postcss.config.js { CONFIG => \"[project]/frontend-nextjs/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];