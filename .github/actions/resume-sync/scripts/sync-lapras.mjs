#!/usr/bin/env node
// Sync sections of a Markdown resume to a LAPRAS profile via the public API
// (the same endpoints used by the official lapras-inc/lapras-mcp-server).
//
// Env:
//   RESUME_PATH          (required) path to the resume Markdown file
//   LAPRAS_API_KEY       (required unless DRY_RUN=true) https://lapras.com/config/api-key
//   JOB_SUMMARY_HEADING  heading whose section syncs to 職務要約 (default: 紹介文)
//   WANT_TO_DO_HEADING   heading whose section syncs to やりたいこと (default: このさきやってみたいこと)
//   DRY_RUN              "true" to print extracted content without calling the API
//   LAPRAS_BASE_URL      override for testing (default: https://lapras.com/api/mcp)

import { readFileSync, appendFileSync } from "node:fs";

const BASE_URL = process.env.LAPRAS_BASE_URL || "https://lapras.com/api/mcp";

// LAPRAS side limits (see lapras-inc/lapras-mcp-server tool definitions)
const FIELDS = [
  {
    name: "job_summary",
    label: "職務要約",
    path: "job_summary",
    heading: process.env.JOB_SUMMARY_HEADING || "紹介文",
    maxLength: 10000,
  },
  {
    name: "want_to_do",
    label: "今後のキャリアでやりたいこと",
    path: "want_to_do",
    heading: process.env.WANT_TO_DO_HEADING || "このさきやってみたいこと",
    maxLength: 1000,
  },
];

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*?)\s*$/);
    if (m && m[2].trim() === heading) {
      start = i + 1;
      level = m[1].length;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+/);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

async function putField(field, value, apiKey) {
  const res = await fetch(`${BASE_URL}/${field.path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      accept: "application/json, text/plain, */*",
    },
    body: JSON.stringify({ [field.name]: value }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PUT ${field.path} failed: HTTP ${res.status} ${body}`);
  }
}

function stepSummary(line) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  }
}

const resumePath = process.env.RESUME_PATH;
if (!resumePath) {
  console.error("RESUME_PATH is required");
  process.exit(1);
}
const dryRun = process.env.DRY_RUN === "true";
const apiKey = process.env.LAPRAS_API_KEY;
if (!dryRun && !apiKey) {
  console.error("LAPRAS_API_KEY is required (or set DRY_RUN=true)");
  process.exit(1);
}

const markdown = readFileSync(resumePath, "utf8");
const planned = [];
for (const field of FIELDS) {
  const value = extractSection(markdown, field.heading);
  if (value === null || value === "") {
    console.warn(`skip ${field.name}: heading "${field.heading}" not found or empty in ${resumePath}`);
    continue;
  }
  if (value.length > field.maxLength) {
    console.error(
      `${field.name}: section "${field.heading}" is ${value.length} chars, exceeds LAPRAS limit of ${field.maxLength}`,
    );
    process.exit(1);
  }
  planned.push({ field, value });
}

if (planned.length === 0) {
  console.error("nothing to sync: no configured headings found in the resume");
  process.exit(1);
}

stepSummary(`## Resume sync to LAPRAS${dryRun ? " (dry run)" : ""}`);
for (const { field, value } of planned) {
  if (dryRun) {
    console.log(`[dry run] would PUT ${field.path} (${value.length} chars):\n---\n${value}\n---`);
  } else {
    await putField(field, value, apiKey);
    console.log(`synced ${field.name} (${value.length} chars) from section "${field.heading}"`);
  }
  stepSummary(`- ${field.label} (\`${field.name}\`): ${value.length}文字 ← 「${field.heading}」セクション`);
}
if (!dryRun) {
  stepSummary("\n同期は上書きです。反映結果を https://lapras.com/career で確認してください。");
}
