// Render the master data as the Markdown page published on GitHub Pages.
// Service-agnostic: this is the human-facing view of the same master data the
// adapters sync to job sites.

import { formatPeriod, formatYearMonth, sortedByStartDesc } from "./master.mjs";

const GENERATED_NOTICE =
  "<!-- このファイルは resume.json から生成されています。直接編集せず resume.json を編集し、" +
  "`node .github/actions/resume-sync/scripts/generate.mjs` で再生成してください。 -->";

function section(title, body) {
  return body && body.length > 0 ? `## ${title}\n\n${body}\n` : "";
}

function highlightList(highlights) {
  return (highlights || []).map((h) => `- ${h}`).join("\n");
}

function workTable(work) {
  const rows = sortedByStartDesc(work)
    .filter((w) => !w.x_sideJob)
    .map((w) => {
      const start = formatYearMonth(w.startDate);
      const end = w.endDate ? formatYearMonth(w.endDate) : "";
      const name = w.url ? `[${w.name}](${w.url})` : w.name;
      const note = w.x_note ? w.x_note : "";
      return `| ${start} | ${end} | ${name} | ${note} |`;
    });
  return ["| 入社 | 退社 | 社名 | 備考 |", "|----|----|----|----|", ...rows].join("\n");
}

function workDetail(w) {
  const parts = [`### ${w.name}`, "", `${formatPeriod(w.startDate, w.endDate)}${w.position ? ` / ${w.position}` : ""}`];
  if (w.x_clientWork) parts.push("", `クライアントワーク: ${w.x_clientCompanyName}`);
  if (w.summary) parts.push("", w.summary);
  const highlights = highlightList(w.highlights);
  if (highlights) parts.push("", highlights);
  return parts.join("\n");
}

function projectDetail(p) {
  const period = formatPeriod(p.startDate, p.endDate);
  const heading = [`### ${p.name}`, ""];
  const meta = [p.x_affiliation, period].filter(Boolean).join(" / ");
  const parts = [...heading];
  if (meta) parts.push(meta, "");
  if (p.description) parts.push(p.description, "");
  const highlights = highlightList(p.highlights);
  if (highlights) parts.push(highlights, "");
  if (p.keywords?.length) parts.push(`要素技術: ${p.keywords.join(", ")}`, "");
  if (p.url) parts.push(`関連: ${p.url}`, "");
  return parts.join("\n").trimEnd();
}

function skillTable(skills) {
  const rows = (skills || []).map((s) => {
    const years = s.x_years >= 1 ? `約${s.x_years}年` : "1年未満";
    const keywords = s.keywords?.length ? s.keywords.join(", ") : "";
    return `| ${s.name} | ${years} | ${s.level || ""} | ${keywords} |`;
  });
  return ["| 技術 | 経験 | レベル | 備考 |", "|----|----|----|----|", ...rows].join("\n");
}

function talkList(talks) {
  return (talks || [])
    .map((t) => {
      const title = t.url ? `[${t.title}](${t.url})` : t.title;
      return `- ${t.date} ${t.event}: ${title}`;
    })
    .join("\n");
}

function outputList(outputs) {
  return (outputs || [])
    .map((group) => [`### ${group.category}`, "", ...group.items.map((i) => `- ${i}`)].join("\n"))
    .join("\n\n");
}

function profileList(profiles) {
  return (profiles || []).map((p) => `- ${p.network}: ${p.url}`).join("\n");
}

/**
 * Build the full Markdown document from master data.
 *
 * NOTE: `education` is deliberately NOT rendered. It is kept in the master
 * because job sites ask for it as a form field, but it is not wanted on the
 * published page. Do not "fix" this by adding an education section.
 */
export function renderMarkdown(master) {
  const work = master.work || [];
  const sideJobs = work.filter((w) => w.x_sideJob);
  const employments = sortedByStartDesc(work.filter((w) => !w.x_sideJob));
  const sideJobNote =
    sideJobs.length > 0 ? "\n\n他に、副業として下記に関わっています(「在籍企業ごとの職務内容」に記載)。" : "";

  const sections = [
    section("紹介文", master.basics.summary),
    section("このさきやってみたいこと", master.x_wantToDo),
    section("職歴", `${workTable(work)}${sideJobNote}`),
    section("テクニカルスキル", skillTable(master.skills)),
    section("在籍企業ごとの職務内容", [...employments, ...sideJobs].map(workDetail).join("\n\n")),
    section("主なプロジェクト", (master.projects || []).map(projectDetail).join("\n\n")),
    section("登壇", talkList(master.x_talks)),
    section("アウトプット", outputList(master.x_outputs)),
    section("リンク", profileList(master.basics.profiles)),
  ].filter(Boolean);

  return `${[GENERATED_NOTICE, "", "# 職務経歴", "", ...sections].join("\n").trimEnd()}\n`;
}
