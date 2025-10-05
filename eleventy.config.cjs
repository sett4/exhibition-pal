module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({
    "site/src/styles/exhibitions/assets": "assets/exhibitions",
  });
  eleventyConfig.addPassthroughCopy({ "site/src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({
    "site/src/_data/artwork-lookup.json": "data/artwork-lookup.json",
  });

  eleventyConfig.addCollection("artworks", async () => {
    const module = await import("./site/src/_data/artworkLookup.js");
    const lookup = await module.default();
    return Object.entries(lookup).map(([artworkId, entry]) => ({
      artworkId,
      exhibitionId: entry.exhibitionId,
      artwork: entry.artwork,
    }));
  });

  eleventyConfig.addFilter("toStandFmEmbedUrl", (url) => {
    // Example: https://stand.fm/episodes/68bef02d405041d7296bc539 を https://stand.fm/embed/episodes/68bef02d405041d7296bc539 に変換
    if (typeof url !== "string") {
      return url;
    }
    const match = url.match(/^https:\/\/stand\.fm\/episodes\/([a-z0-9]+)$/);
    if (match) {
      return `https://stand.fm/embed/episodes/${match[1]}`;
    }
    return url;
  });

  return {
    dir: {
      input: "site/src",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
