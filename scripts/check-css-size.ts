import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { getLogger } from "../src/lib/logger.js";

const MAX_SIZE_KB = 120;
const cssPath = resolve(process.cwd(), "dist", "assets", "styles", "exhibitions.css");
const logger = getLogger();

try {
  statSync(cssPath);
} catch (error) {
  logger.error("CSS bundle not found", { cssPath });
  throw new Error(
    `CSS bundle not found at ${cssPath}. Run "npm run tailwind:build" before executing the size check.`
  );
}

const css = readFileSync(cssPath);
const compressed = gzipSync(css);
const sizeInKb = compressed.length / 1024;

logger.info("CSS bundle size check", {
  cssPath,
  sizeKb: parseFloat(sizeInKb.toFixed(2)),
  maxSizeKb: MAX_SIZE_KB,
  withinBudget: sizeInKb <= MAX_SIZE_KB,
});

if (sizeInKb > MAX_SIZE_KB) {
  logger.error("CSS bundle exceeds budget", {
    sizeKb: parseFloat(sizeInKb.toFixed(2)),
    maxSizeKb: MAX_SIZE_KB,
    overage: parseFloat((sizeInKb - MAX_SIZE_KB).toFixed(2)),
  });
  throw new Error(
    `Tailwind bundle exceeds ${MAX_SIZE_KB}KB gzip budget (actual: ${sizeInKb.toFixed(2)}KB).`
  );
}

console.log(`Tailwind bundle within budget: ${sizeInKb.toFixed(2)}KB (gzip).`);
