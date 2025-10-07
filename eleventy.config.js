import { resolve } from "node:path";
import loadExhibitionsData from "./dist/src/_data/exhibitions.js";
import { getLogger, logBuildLifecycle } from "./src/lib/logger.js";

const projectRoot = resolve(process.cwd());
const compiledSourceDir = resolve(projectRoot, "dist", "src");
const isoToSlashDate = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replaceAll("-", "/");
};

/**
 * Configures Eleventy with custom filters, collections, and global data.
 * @param {EleventyUserConfig} config - The Eleventy configuration object.
 * @returns {object} Eleventy configuration options.
 */
export default function eleventyConfig(config) {
  const logger = getLogger();

  config.addPassthroughCopy({ public: "/" });
  config.addPassthroughCopy({ "dist/assets": "assets" });
  config.addWatchTarget("src");
  config.addWatchTarget("src/styles");
  config.addWatchTarget("dist/assets");
  config.addWatchTarget("dist/assets/styles/exhibitions.css");
  config.addWatchTarget("public");

  config.on("eleventy.before", () => {
    logBuildLifecycle("eleventy:before");
  });

  config.on("eleventy.after", () => {
    logBuildLifecycle("eleventy:after");
    logger.info("Eleventy build completed", { outputDir: "_site" });
  });

  config.addGlobalData("exhibitionsData", () => loadExhibitionsData());

  return {
    dir: {
      input: resolve(projectRoot, "src", "pages"),
      data: "_data",
      includes: "_includes",
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
