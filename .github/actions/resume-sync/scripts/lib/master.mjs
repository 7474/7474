// Load and validate the resume master data (service-agnostic).
//
// The master is JSON Resume (https://jsonresume.org/schema/) shaped, with
// `x_`-prefixed fields as this repository's own extensions. Nothing in here
// may know about a specific job-site: service-specific vocabulary lives in
// the adapters under ../adapters/.

import { readFileSync } from "node:fs";

/** Generic role vocabulary usable in work[].x_roles. Adapters map these to their own IDs. */
export const ROLES = [
  "web-application-engineer",
  "frontend-engineer",
  "backend-engineer",
  "infrastructure-engineer",
  "sre",
  "system-engineer",
  "tech-lead",
  "engineering-manager",
  "project-manager",
  "product-manager",
  "architect",
  "embedded-engineer",
  "data-engineer",
  "qa-engineer",
  "scrum-master",
  "other",
];

const YEAR_MONTH = /^(\d{4})-(\d{1,2})$/;

/** Parse an ISO year-month ("2018-11") into parts. Returns null for empty/undefined. */
export function parseYearMonth(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const m = String(value).match(YEAR_MONTH);
  if (!m) throw new Error(`${label}: "${value}" is not in YYYY-MM format`);
  const month = Number(m[2]);
  if (month < 1 || month > 12) throw new Error(`${label}: "${value}" has an out-of-range month`);
  return { year: Number(m[1]), month };
}

/** Human-readable "2018-11" -> "2018年11月" */
export function formatYearMonth(value) {
  const parsed = parseYearMonth(value, "date");
  return parsed ? `${parsed.year}年${parsed.month}月` : "";
}

/** "2018-11" + null -> "2018年11月 〜 現在" */
export function formatPeriod(startDate, endDate) {
  const start = formatYearMonth(startDate);
  const end = formatYearMonth(endDate);
  if (start && end) return `${start} 〜 ${end}`;
  if (start) return `${start} 〜 現在`;
  if (end) return `〜 ${end}`;
  return "";
}

function validate(master, path) {
  const errors = [];
  if (!master.basics?.name) errors.push("basics.name is required");
  if (!master.basics?.summary) errors.push("basics.summary is required");
  if (!Array.isArray(master.work) || master.work.length === 0) errors.push("work must be a non-empty array");

  for (const [i, w] of (master.work || []).entries()) {
    const at = `work[${i}]`;
    if (!w.name) errors.push(`${at}.name is required`);
    if (!w.startDate) errors.push(`${at}.startDate is required`);
    for (const field of ["startDate", "endDate"]) {
      try {
        parseYearMonth(w[field], `${at}.${field}`);
      } catch (e) {
        errors.push(e.message);
      }
    }
    const roles = w.x_roles || [];
    if (roles.length === 0) errors.push(`${at}.x_roles must list at least one role`);
    for (const role of roles) {
      if (!ROLES.includes(role)) {
        errors.push(`${at}.x_roles contains unknown role "${role}" (known: ${ROLES.join(", ")})`);
      }
    }
    if (w.x_clientWork && !w.x_clientCompanyName) {
      errors.push(`${at}.x_clientCompanyName is required when x_clientWork is true`);
    }
  }

  for (const [i, s] of (master.skills || []).entries()) {
    const at = `skills[${i}]`;
    if (!s.name) errors.push(`${at}.name is required`);
    if (typeof s.x_years !== "number" || s.x_years < 0) errors.push(`${at}.x_years must be a non-negative number`);
  }

  for (const [i, p] of (master.projects || []).entries()) {
    for (const field of ["startDate", "endDate"]) {
      try {
        parseYearMonth(p[field], `projects[${i}].${field}`);
      } catch (e) {
        errors.push(e.message);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`invalid master data (${path}):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}

/** Read, parse and validate the master data file. */
export function loadMaster(path) {
  let master;
  try {
    master = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`cannot read master data (${path}): ${e.message}`);
  }
  validate(master, path);
  return master;
}

/** work[] and projects[] sorted newest-first by start date. */
export function sortedByStartDesc(items) {
  return [...items].sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")));
}
