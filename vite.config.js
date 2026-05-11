import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

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

function htmlPartialsPlugin(rootDir) {
  return {
    name: "html-partials-plugin",
    transformIndexHtml(html, ctx) {
      const sourceFile = ctx.filename ? path.resolve(ctx.filename) : path.resolve(rootDir, "index.html");
      return resolveIncludes(html, sourceFile, rootDir);
    },
  };
}

export default defineConfig({
  root: projectRoot,
  plugins: [htmlPartialsPlugin(projectRoot)],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(projectRoot, "index.html"),
        dashboard: path.resolve(projectRoot, "pages/dashboard.html"),
        users: path.resolve(projectRoot, "pages/users.html"),
      },
    },
  },
});
