import { resolve } from "node:path";
import loadExhibitionsData from "./dist/src/_data/exhibitions.js";
import { sortByStartDateDescIdAsc } from "./dist/src/_data/transformers.js";
import { renderExhibitionDetailPage, renderExhibitionsListingPage } from "./dist/src/lib/exhibitionsMarkup.js";
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
  config.addWatchTarget("src");
  config.addWatchTarget("public");

  config.on("eleventy.before", () => {
    logBuildLifecycle("eleventy:before");
  });

  config.on("eleventy.after", () => {
    logBuildLifecycle("eleventy:after");
    logger.info("Eleventy build completed", { outputDir: "_site" });
  });

  config.addGlobalData("exhibitionsData", async () => loadExhibitionsData());

  config.addFilter("renderExhibitionsListingPage", renderExhibitionsListingPage);
  config.addShortcode("renderExhibitionDetailPage", renderExhibitionDetailPage);

  config.addFilter("sortExhibitions", (input) => {
    if (!Array.isArray(input)) {
      return input;
    }

    const typed = input.filter(
      (item) => typeof item === "object" && item !== null && "id" in item && "startDate" in item
    );

    return [...typed].sort(sortByStartDateDescIdAsc);
  });

  config.addFilter("formatExhibitionDate", isoToSlashDate);

  return {
    dir: {
      input: resolve(projectRoot, "src", "pages"),
      data: resolve(compiledSourceDir, "_data"),
      includes: resolve(projectRoot, "src", "includes"),
      layouts: resolve(projectRoot, "src", "layouts"),
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
