import { resolve } from "node:path";

import type { Exhibition } from "./src/data/types.js";
import { sortByStartDateDescIdAsc } from "./src/data/transformers.js";
import { loadExhibitionsData } from "./src/data/exhibitions.js";
import { getLogger, logBuildLifecycle } from "./src/lib/logger.js";

const projectRoot = resolve(process.cwd());
const compiledSourceDir = resolve(projectRoot, "dist", "src");

type EleventyUserConfig = {
  addPassthroughCopy: (paths: Record<string, string> | string) => void;
  addWatchTarget: (path: string) => void;
  addFilter: (name: string, filter: (...args: unknown[]) => unknown) => void;
  addCollection: (
    name: string,
    callback: (api: { getGlobalData: <T = unknown>(key: string) => T }) => unknown
  ) => void;
  addGlobalData: (name: string, data: unknown | (() => unknown | Promise<unknown>)) => void;
  on: (event: string, callback: () => void | Promise<void>) => void;
};

const isoToSlashDate = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replaceAll("-", "/");
};

export default function eleventyConfig(config: EleventyUserConfig) {
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

  config.addFilter("sortExhibitions", (input: unknown) => {
    if (!Array.isArray(input)) {
      return input;
    }

    const typed = input.filter(
      (item): item is Exhibition =>
        typeof item === "object" && item !== null && "id" in item && "startDate" in item
    );

    return [...typed].sort(sortByStartDateDescIdAsc);
  });

  config.addFilter("formatExhibitionDate", isoToSlashDate);

  return {
    dir: {
      input: resolve(compiledSourceDir, "pages"),
      data: resolve(compiledSourceDir, "data"),
      includes: resolve(compiledSourceDir, "includes"),
      layouts: resolve(compiledSourceDir, "layouts"),
      output: "_site",
    },
    templateFormats: ["11ty.ts", "md", "njk", "html"],
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    dataTemplateEngine: false,
  };
}
