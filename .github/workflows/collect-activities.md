---
name: "koudenpa 活動履歴"
description: |
  koudenpa のインターネット上のポジティブな活動（GitHub、はてなブログ、Zenn、Qiita）を
  週次で収集し、activities.md を最新内容に更新する PR を作成する。
  GitHub のパブリックイベント、RSSフィードを取得し、ポジティブな技術的成果・情報発信・
  コミュニティ貢献を選別してテーブル形式で掲示する。

on:
  schedule: weekly on monday
  workflow_dispatch:

permissions:
  contents: read

network: defaults

tools:
  github:
    toolsets: [default]
  web-fetch:
  edit:

timeout-minutes: 30

safe-outputs:
  create-pull-request:
    title-prefix: "[活動履歴] "
    labels: [automation]
    draft: false
    protected-files: fallback-to-issue
---

# koudenpa 活動履歴

あなたは日本人エンジニア `koudenpa`（GitHub ユーザー名: `koudenpa`）のポジティブなインターネット活動を収集し、このリポジトリの `activities.md` を更新する自動エージェントです。

## 目的

直近 90 日以内のポジティブな活動を収集し、GitHub Pages で閲覧できる `activities.md` を更新する PR を作成してください。

---

## ステップ 1: GitHub パブリックイベントを収集する

GitHub API を使って `koudenpa` のパブリックイベントを取得してください。

```
https://api.github.com/users/koudenpa/events/public?per_page=100&page=1
```

以下のイベントタイプをポジティブな活動として扱ってください:

| イベントタイプ | 条件 |
|---|---|
| `PushEvent` | すべて |
| `CreateEvent` | すべて（リポジトリ・ブランチ・タグ作成） |
| `PullRequestEvent` | `action: closed` かつ `merged: true` のみ |
| `IssuesEvent` | `action: closed` のみ |
| `WatchEvent` | `action: started` のみ（スター付与） |
| `ForkEvent` | すべて |
| `ReleaseEvent` | `action: published` のみ |
| `PublicEvent` | すべて（リポジトリ公開） |

直近 90 日より古いイベントは除外してください。
複数ページを取得する場合は最大 5 ページまで参照してください。

---

## ステップ 2: RSS フィードから記事を収集する

以下の RSS/Atom フィードを取得し、直近 90 日以内の記事を収集してください。

- **はてなブログ**: `https://koudenpa.hatenablog.com/rss`
- **Zenn**: `https://zenn.dev/koudenpa/feed`
- **Qiita**: `https://qiita.com/koudenpa/feed.atom`

フィードが 404 や取得不可だった場合は静かにスキップしてください。

---

## ステップ 3: ポジティブ判定

各活動について以下の基準でポジティブかどうかを判断してください:

- 技術的な成果物の公開（コード公開、記事投稿など）
- コミュニティへの貢献（PR マージ、Issue クローズなど）
- 学習・探求の証（スター、フォーク）
- 情報発信・共有

ネガティブまたは中立（例: Issue をオープンするだけなど）のものは除外してください。
ブログ・Zenn・Qiita の記事はすべてポジティブとみなしてください。

---

## ステップ 4: `activities.md` を更新する

`activities.md` ファイルを以下のフォーマットで更新してください。

```markdown
# 活動履歴

> 最終更新: YYYY-MM-DD HH:MM JST  
> 収集期間: 直近 90 日間  
> ポジティブな活動 N 件

## 🐙 GitHub

| 日付 | 活動 | リポジトリ |
|------|------|-----------|
| YYYY-MM-DD | [活動の説明](URL) | リポジトリ名 |

## 📝 はてなブログ

| 日付 | 記事 |
|------|------|
| YYYY-MM-DD | [記事タイトル](URL) |

## 📘 Zenn

| 日付 | 記事 |
|------|------|
| YYYY-MM-DD | [記事タイトル](URL) |

## 🟩 Qiita

| 日付 | 記事 |
|------|------|
| YYYY-MM-DD | [記事タイトル](URL) |
```

- 日付はすべて JST (UTC+9) で表記してください
- 日付降順（新しい順）に並べてください
- 該当の活動がないセクションは省略してください
- GitHub イベントについては、同一リポジトリへの PushEvent は 1 日 1 件にまとめてください

---

## ステップ 5: PR を作成する

`activities.md` に変更がある場合は `create-pull-request` safe-output を使ってプルリクエストを作成してください。

活動が何も見つからなかった場合は PR を作成せずに終了してください。
