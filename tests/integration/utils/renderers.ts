import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nunjucks from "nunjucks";

export function createRenderer() {
  const searchPaths = [
    resolve(process.cwd(), "src", "pages"),
    resolve(process.cwd(), "src", "pages", "_includes"),
    resolve(process.cwd(), "src", "pages", "_includes", "layouts"),
    resolve(process.cwd(), "src", "pages", "_includes", "components"),
    resolve(process.cwd(), "src", "pages", "_includes", "partials"),
    resolve(process.cwd(), "src", "includes"),
    resolve(process.cwd(), "src", "layouts"),
  ];

  const { Environment, FileSystemLoader } = nunjucks;

  const env = new Environment(new FileSystemLoader(searchPaths, { noCache: true }), {
    autoescape: true,
  });
  env.addFilter("url", (value: string) => value);
  env.addFilter("date", (value: string | Date, format?: string) => {
    if (!value) {
      return "";
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    if (format === "yyyy") {
      return String(date.getFullYear());
    }
    return date.toISOString();
  });
  return env;
}

export function renderTemplate(
  renderer: nunjucks.Environment,
  relativePath: string,
  context: Record<string, unknown>
) {
  const templatePath = resolve(process.cwd(), "src", "pages", relativePath);
  const template = readFileSync(templatePath, "utf8");
  const body = template.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");

  const prologue: string[] = [];
  const runtimeContext: Record<string, unknown> = { ...context };

  if (Object.prototype.hasOwnProperty.call(context, "exhibition")) {
    prologue.push("{% set exhibition = __test_exhibition %}");
    runtimeContext.__test_exhibition = context.exhibition;
    delete runtimeContext.exhibition;
  }

  if (Object.prototype.hasOwnProperty.call(context, "exhibitionsData")) {
    prologue.push("{% set exhibitionsData = __test_exhibitionsData %}");
    runtimeContext.__test_exhibitionsData = context.exhibitionsData;
    delete runtimeContext.exhibitionsData;
  }

  if (Object.prototype.hasOwnProperty.call(context, "hasExhibition")) {
    prologue.push("{% set hasExhibition = __test_hasExhibition %}");
    runtimeContext.__test_hasExhibition = context.hasExhibition;
    delete runtimeContext.hasExhibition;
  }

  if (Object.prototype.hasOwnProperty.call(context, "sections")) {
    prologue.push("{% set sections = __test_sections %}");
    runtimeContext.__test_sections = context.sections;
    delete runtimeContext.sections;
  }

  if (Object.prototype.hasOwnProperty.call(context, "heroMedia")) {
    prologue.push("{% set heroMedia = __test_heroMedia %}");
    runtimeContext.__test_heroMedia = context.heroMedia;
    delete runtimeContext.heroMedia;
  }

  const hydratedTemplate = `${prologue.join("\n")}${body}`;
  return renderer.renderString(hydratedTemplate, runtimeContext);
}
