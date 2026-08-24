#!/usr/bin/env node
// Generate the published Markdown resume from the master data.
//
// Usage:
//   node generate.mjs [--master resume.json] [--out 職務経歴.md] [--check]
//
//   --check  exit 1 when the output file differs from what would be generated
//            (used in CI so a stale generated file cannot be merged)
//
// Env fallbacks: MASTER_PATH, OUTPUT_PATH, CHECK=true

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadMaster } from "./lib/master.mjs";
import { renderMarkdown } from "./lib/markdown.mjs";

function parseArgs(argv) {
  const args = { master: process.env.MASTER_PATH || "resume.json", out: process.env.OUTPUT_PATH || "職務経歴.md", check: process.env.CHECK === "true" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--master") args.master = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--check") args.check = true;
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return args;
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

let rendered;
try {
  rendered = renderMarkdown(loadMaster(args.master));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const current = existsSync(args.out) ? readFileSync(args.out, "utf8") : null;

if (args.check) {
  if (current === rendered) {
    console.log(`${args.out} is up to date with ${args.master}`);
    process.exit(0);
  }
  console.error(
    `${args.out} is out of date with ${args.master}.\n` +
      `Run: node .github/actions/resume-sync/scripts/generate.mjs\n` +
      `then commit the regenerated file.`,
  );
  process.exit(1);
}

if (current === rendered) {
  console.log(`${args.out} unchanged`);
} else {
  writeFileSync(args.out, rendered);
  console.log(`wrote ${args.out} (${rendered.length} chars) from ${args.master}`);
}
