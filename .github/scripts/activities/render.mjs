#!/usr/bin/env node
// Render activities.md from the structured, evidence-carrying activities.json.
//
// Usage:
//   node render.mjs [--data activities.json] [--out activities.md] [--check]
//
//   --check  exit 1 when the output file differs from what would be generated

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadActivities, renderActivities } from "./lib.mjs";

function parseArgs(argv) {
  const args = {
    data: process.env.ACTIVITIES_PATH || "activities.json",
    out: process.env.OUTPUT_PATH || "activities.md",
    check: process.env.CHECK === "true",
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--data") args.data = argv[++i];
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
  rendered = renderActivities(loadActivities(args.data));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const current = existsSync(args.out) ? readFileSync(args.out, "utf8") : null;

if (args.check) {
  if (current === rendered) {
    console.log(`${args.out} is up to date with ${args.data}`);
    process.exit(0);
  }
  console.error(
    `${args.out} is out of date with ${args.data}.\n` +
      `Run: node .github/scripts/activities/render.mjs --data ${args.data} --out ${args.out}`,
  );
  process.exit(1);
}

if (current === rendered) {
  console.log(`${args.out} unchanged`);
} else {
  writeFileSync(args.out, rendered);
  console.log(`wrote ${args.out} (${rendered.length} chars) from ${args.data}`);
}
