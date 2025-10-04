module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/src/styles": "styles" });

  return {
    dir: {
      input: "site/src",
      includes: "_includes",
      data: "_data",
      output: ".output/public"
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
