const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, sizes) {
  // 💡 Eleventy-imgは、`src`（この場合は動的なURL）がリモートURLであれば自動的にダウンロードして処理します。
  let metadata = await Image(src, {
    widths: [300, 600, null],
    formats: ["webp", "jpeg"],
    outputDir: "./_site/img/",
    urlPath: "/img/",
  });

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({
    "site/src/styles/exhibitions/assets": "assets/exhibitions",
  });
  eleventyConfig.addPassthroughCopy({ "site/src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({
    "site/src/_data/artwork-lookup.json": "data/artwork-lookup.json",
  });
  eleventyConfig.addPassthroughCopy({
    ".cache/hero-images/optimized": "img/hero",
  });

  eleventyConfig.addWatchTarget(".cache/hero-images");

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

  eleventyConfig.addPlugin(eleventyImageTransformPlugin);

  return {
    dir: {
      input: "site/src",
      includes: "_includes",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
