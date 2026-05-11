import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const includePattern = /<!--\s*@include\s+["'](.+?)["']\s*-->/g;

function resolveIncludes(content, fromFile, rootDir, stack = []) {
  return content.replace(includePattern, (_, includePath) => {
    const absolutePath = path.resolve(path.dirname(fromFile), includePath);

    if (!absolutePath.startsWith(rootDir)) {
      throw new Error(`Include outside project root is not allowed: ${includePath}`);
    }

    if (stack.includes(absolutePath)) {
      const cycle = [...stack, absolutePath].map((item) => path.relative(rootDir, item)).join(" -> ");
      throw new Error(`Circular include detected: ${cycle}`);
    }

    const fileContent = fs.readFileSync(absolutePath, "utf-8");
    return resolveIncludes(fileContent, absolutePath, rootDir, [...stack, absolutePath]);
  });
}

function htmlPartialsPlugin() {
  return {
    name: "html-partials-plugin",
    transformIndexHtml(html, ctx) {
      const rootDir = ctx.server?.config.root
        ? path.resolve(ctx.server.config.root)
        : process.cwd();
      const sourceFile = path.resolve(rootDir, "index.html");
      return resolveIncludes(html, sourceFile, rootDir);
    },
  };
}

export default defineConfig({
  plugins: [htmlPartialsPlugin()],
});
