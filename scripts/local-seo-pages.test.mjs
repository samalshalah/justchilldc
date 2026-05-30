import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

async function importLocalSeoPagesModule() {
  const sourcePath = path.resolve("src/lib/local-seo-pages.ts");
  let source = await readFile(sourcePath, "utf8");
  source = source
    .replace('import type { SiteSettings } from "./types";', "")
    .replace('import { DEFAULTS } from "./defaults";', "const DEFAULTS = { storeName: 'White Label Store', city: 'Your City', state: 'Your State' };");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  });
  const dir = await mkdtemp(path.join(tmpdir(), "local-seo-pages-"));
  const compiledPath = path.join(dir, "local-seo-pages.mjs");
  await writeFile(compiledPath, compiled.outputText, "utf8");
  return import(pathToFileURL(compiledPath).href);
}

const mod = await importLocalSeoPagesModule();

const settings = {
  store: {
    name: "Just Chill DC",
    address: "1314B 9th St NW, Washington DC 20001",
    phone: "(202) 481-1676",
  },
  location: {
    city: "Washington",
    state: "DC",
    address: "1314B 9th St NW, Washington DC 20001",
    phone: "(202) 481-1676",
  },
  seo: {
    city: "Washington",
  },
};

test("builds a professional hidden local SEO page set", () => {
  const pages = mod.getLocalSeoPages(settings);
  const slugs = pages.map((page) => page.slug);

  assert.ok(pages.length >= 15);
  assert.ok(slugs.includes("arlington-va"));
  assert.ok(slugs.includes("alexandria-va"));
  assert.ok(slugs.includes("silver-spring-md"));

  for (const page of pages) {
    const allCopy = [
      page.title,
      page.metaDescription,
      page.h1,
      page.intro,
      ...page.sections.flatMap((section) => [section.heading, section.body]),
    ].join(" ");

    assert.match(allCopy, /Just Chill DC/);
    assert.doesNotMatch(allCopy, /White Label|Your City|Your State|extra navigation clutter/i);
    assert.ok(page.metaDescription.length >= 120);
    assert.ok(page.sections.length >= 4);
  }
});
