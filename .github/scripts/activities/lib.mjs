// Activity collection: schema, structural validation, and rendering.
//
// The point of this module is attribution precision. An activity may only be
// published if it carries evidence that mechanically ties it to this account,
// so that a collector (human or agent) cannot claim someone else's work.

import { readFileSync } from "node:fs";

export const ACCOUNT = "7474";
export const BLOG_HOST = "koudenpa.hatenablog.com";

/**
 * How the account relates to the activity. This is rendered into the page, so
 * an item can never silently read as "I built this".
 */
export const ATTRIBUTIONS = {
  author: { label: null }, // built it — no annotation needed
  maintainer: { label: "役割: メンテナ" },
  reviewer: { label: "役割: レビュー・技術判断" },
  derived: { label: "派生・導入" }, // upstream's work, adopted or tried out
};

export const CATEGORIES = ["project", "article", "talk", "package", "community", "milestone"];

/**
 * Evidence kinds. "primary" kinds are the ones that can establish attribution
 * on their own; every item needs at least one of them. Anything else (a
 * package registry page, a third-party article) can support an item but never
 * carry it, because names are not unique and a mention is not authorship.
 */
export const EVIDENCE_KINDS = {
  commit: { primary: true, verify: "github" },
  "pull-request": { primary: true, verify: "github" },
  release: { primary: true, verify: "github" },
  repository: { primary: true, verify: "github" },
  blog: { primary: true, verify: "host" },
  slide: { primary: true, verify: "host" },
  package: { primary: false, verify: "host" },
  external: { primary: false, verify: "none" },
};

const HOST_RULES = {
  blog: (u) => u.hostname === BLOG_HOST,
  slide: (u) => u.hostname === "speakerdeck.com" && u.pathname.toLowerCase().startsWith(`/${ACCOUNT}/`),
  package: (u) => ["www.nuget.org", "nuget.org", "www.npmjs.com", "npmjs.com", "hub.docker.com"].includes(u.hostname),
};

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Parse a github.com URL into the API lookup needed to check authorship. */
export function parseGitHubEvidence(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.hostname !== "github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const [owner, repo, kind, id] = parts;
  if (parts.length === 2) return { type: "repository", owner, repo };
  if (kind === "pull" && id) return { type: "pull-request", owner, repo, number: Number(id) };
  if (kind === "commit" && id) return { type: "commit", owner, repo, sha: id };
  if (kind === "releases" && parts[3] === "tag" && parts[4]) {
    return { type: "release", owner, repo, tag: decodeURIComponent(parts[4]) };
  }
  return null;
}

function validateItem(item, index, errors) {
  const at = `items[${index}]`;
  const need = (field) => {
    if (!item[field] || String(item[field]).trim() === "") errors.push(`${at}.${field} is required`);
  };
  need("id");
  need("title");
  need("summary");

  if (!YEAR_MONTH.test(String(item.date || ""))) {
    errors.push(`${at}.date must be YYYY-MM (got: ${JSON.stringify(item.date)})`);
  }
  if (!CATEGORIES.includes(item.category)) {
    errors.push(`${at}.category must be one of: ${CATEGORIES.join(", ")}`);
  }
  if (!Object.hasOwn(ATTRIBUTIONS, item.attribution)) {
    errors.push(`${at}.attribution must be one of: ${Object.keys(ATTRIBUTIONS).join(", ")}`);
  }
  // Adopting someone else's project is fine; hiding whose it was is not.
  if (item.attribution === "derived" && !item.upstream) {
    errors.push(`${at}.upstream is required when attribution is "derived" (name whose work it is)`);
  }

  if (item.featured !== undefined && typeof item.featured !== "boolean") {
    errors.push(`${at}.featured must be a boolean when present`);
  }

  const evidence = item.evidence || [];
  if (evidence.length === 0) {
    errors.push(`${at}.evidence must not be empty`);
    return;
  }
  let primaries = 0;
  for (const [j, e] of evidence.entries()) {
    const eAt = `${at}.evidence[${j}]`;
    const spec = EVIDENCE_KINDS[e?.kind];
    if (!spec) {
      errors.push(`${eAt}.kind must be one of: ${Object.keys(EVIDENCE_KINDS).join(", ")}`);
      continue;
    }
    let u;
    try {
      u = new URL(e.url);
    } catch {
      errors.push(`${eAt}.url is not a valid URL: ${JSON.stringify(e.url)}`);
      continue;
    }
    if (u.protocol !== "https:") errors.push(`${eAt}.url must be https`);

    if (spec.verify === "github") {
      const parsed = parseGitHubEvidence(e.url);
      if (!parsed) errors.push(`${eAt}.url is not a recognizable github.com ${e.kind} URL`);
      else if (parsed.type !== e.kind) errors.push(`${eAt}.url looks like a ${parsed.type}, not a ${e.kind}`);
    } else if (spec.verify === "host" && !HOST_RULES[e.kind](u)) {
      errors.push(`${eAt}.url host is not accepted for kind "${e.kind}": ${u.hostname}${u.pathname}`);
    }
    if (spec.primary) primaries++;
  }
  if (primaries === 0) {
    errors.push(
      `${at} has no primary evidence. A package page or a third-party mention cannot establish authorship ` +
        `— add a commit / pull-request / release / repository / blog / slide URL.`,
    );
  }
}

/** Read, parse and structurally validate the activity data. */
export function loadActivities(path) {
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`cannot read activity data (${path}): ${e.message}`);
  }
  const errors = [];
  if (!Array.isArray(data.items)) errors.push("items must be an array");
  else {
    const ids = new Set();
    data.items.forEach((item, i) => {
      validateItem(item, i, errors);
      if (item?.id) {
        if (ids.has(item.id)) errors.push(`items[${i}].id is duplicated: ${item.id}`);
        ids.add(item.id);
      }
    });
  }
  if (errors.length > 0) {
    throw new Error(`invalid activity data (${path}):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
  return data;
}

// --- rendering ---------------------------------------------------------------

const GENERATED_NOTICE =
  "<!-- このファイルは activities.json から生成されています。直接編集せず activities.json を編集し、" +
  "`node .github/scripts/activities/render.mjs` で再生成してください。 -->";

const SECTIONS = [
  { category: "project", title: "🎯 プロジェクト" },
  { category: "package", title: "📦 公開パッケージ" },
  { category: "talk", title: "🎤 登壇" },
  { category: "community", title: "🌐 コミュニティ" },
  { category: "article", title: "📝 技術発信" },
  { category: "milestone", title: "📅 マイルストーン" },
];

/**
 * 根拠は帰属を担保するために必須だが、読み物としては邪魔になりうる。
 * 本文からリンクできる種別(記事・スライド)は見出しのリンクで用が足りるので、
 * 根拠行には出さない。GitHub 由来のものは「何を根拠にしたか」が読者にも
 * 意味を持つので明示する。
 */
const INLINE_LINK_KINDS = new Set(["blog", "slide"]);

function primaryLink(item) {
  const inline = item.evidence.find((e) => INLINE_LINK_KINDS.has(e.kind));
  return inline?.url ?? null;
}

function evidenceLinks(item) {
  const shown = item.evidence.filter((e) => !INLINE_LINK_KINDS.has(e.kind));
  return shown.map((e) => `[${e.kind}](${e.url})`).join(" / ");
}

/** Attribution is rendered, never implied — that is what keeps the page honest. */
function attributionNote(item) {
  const spec = ATTRIBUTIONS[item.attribution];
  if (!spec.label) return "";
  const upstream = item.upstream ? `: ${item.upstream}` : "";
  return ` _(${spec.label}${upstream})_`;
}

function titleWithLink(item) {
  const link = primaryLink(item);
  return link ? `[${item.title}](${link})` : item.title;
}

function renderItem(item) {
  const lines = [`- **${titleWithLink(item)}**（${item.date}）${attributionNote(item)}`];
  if (item.summary) lines.push(`  - ${item.summary}`);
  const evidence = evidenceLinks(item);
  if (evidence) lines.push(`  - 根拠: ${evidence}`);
  if (item.tech?.length) lines.push(`  - 技術: ${item.tech.join(", ")}`);
  return lines.join("\n");
}

/** ハイライトは読み手が最初に見る場所なので、要約を本文として見せる。 */
function renderHighlight(item) {
  // 根拠は下のカテゴリ一覧に同じ項目が出るので、ここでは繰り返さない。
  return [`### ${titleWithLink(item)}${attributionNote(item)}`, "", item.summary].join("\n");
}

/**
 * 技術スキルは項目から集計する。何回出てきたかではなく
 * 「どの活動で使ったか」が根拠になるので、代表する活動名を添える。
 */
function skillTable(items) {
  const byTech = new Map();
  for (const item of items) {
    for (const tech of item.tech || []) {
      if (!byTech.has(tech)) byTech.set(tech, []);
      byTech.get(tech).push(item);
    }
  }
  const rows = [...byTech.entries()]
    .filter(([, used]) => used.length >= 2) // 1回だけの技術は羅列になるので出さない
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([tech, used]) => {
      const examples = used
        .slice(0, 3)
        .map((i) => i.title.split(" — ")[0])
        .join(" / ");
      return `| ${tech} | ${used.length}件 | ${examples} |`;
    });
  if (rows.length === 0) return "";
  return ["| 技術 | 活動数 | 主な活動 |", "|----|----|----|", ...rows].join("\n");
}

export function renderActivities(data) {
  const items = [...data.items].sort((a, b) => b.date.localeCompare(a.date));
  const blocks = [GENERATED_NOTICE, "", "# プロジェクト & 活動ハイライト", ""];

  if (data.meta?.generatedAt) blocks.push(`> 最終更新: ${data.meta.generatedAt}`, "");

  // 役割の注記は、実際に author 以外がある場合にだけ意味を持つ。
  if (items.some((i) => ATTRIBUTIONS[i.attribution].label)) {
    blocks.push(
      "> 他者の成果物を取り込んだものは「派生・導入」、レビューや技術判断で関わったものは「役割」として明示しています。",
      "",
    );
  }

  const featured = items.filter((i) => i.featured);
  if (featured.length > 0) {
    blocks.push("## 🔥 最近の注目活動", "", ...featured.map(renderHighlight).flatMap((b) => [b, ""]));
  }

  for (const section of SECTIONS) {
    const inSection = items.filter((i) => i.category === section.category);
    if (inSection.length === 0) continue;
    blocks.push(`## ${section.title}`, "", ...inSection.map(renderItem), "");
  }

  const skills = skillTable(items);
  if (skills) {
    blocks.push("## 🛠 技術スキル(活動からの集計)", "", skills, "");
  }
  return `${blocks.join("\n").trimEnd()}\n`;
}
