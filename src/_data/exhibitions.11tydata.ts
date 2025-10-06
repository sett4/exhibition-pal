import loadExhibitionsData from "./exhibitions.js";
import { logBuildLifecycle } from "../lib/logger.js";

/**
 * Provides Eleventy global data for exhibitions pages.
 * @returns Resolved exhibitions dataset.
 */
export default async function exhibitionsGlobalData() {
  logBuildLifecycle("exhibitions-global-data:start");
  const data = await loadExhibitionsData();
  logBuildLifecycle("exhibitions-global-data:complete", {
    exhibitionCount: data.exhibitions.length,
    latestUpdate: data.latestUpdate,
  });
  return data;
}
