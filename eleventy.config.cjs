module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ 'site/src/styles/exhibitions/assets': 'assets/exhibitions' });
  eleventyConfig.addPassthroughCopy({ 'site/src/scripts': 'scripts' });
  eleventyConfig.addPassthroughCopy({ 'site/src/_data/artwork-lookup.json': 'data/artwork-lookup.json' });

  eleventyConfig.addCollection('artworks', async () => {
    const module = await import('./site/src/_data/artworkLookup.js');
    const lookup = await module.default();
    return Object.entries(lookup).map(([artworkId, entry]) => ({
      artworkId,
      exhibitionId: entry.exhibitionId,
      artwork: entry.artwork
    }));
  });

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
