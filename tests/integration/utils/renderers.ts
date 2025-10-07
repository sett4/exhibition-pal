import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nunjucks from "nunjucks";

export function createRenderer() {
  const searchPaths = [
    resolve(process.cwd(), "src", "pages"),
    resolve(process.cwd(), "src", "includes"),
    resolve(process.cwd(), "src", "layouts"),
  ];

  const { Environment, FileSystemLoader } = nunjucks;

  return new Environment(new FileSystemLoader(searchPaths, { noCache: true }), {
    autoescape: true,
  });
}

export function renderTemplate(
  renderer: nunjucks.Environment,
  relativePath: string,
  context: Record<string, unknown>
) {
  const templatePath = resolve(process.cwd(), "src", "pages", relativePath);
  const template = readFileSync(templatePath, "utf8");
  const body = template.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  return renderer.renderString(body, context);
}
