---
name: "7474 活動履歴"
description: |
  7474 (koudenpa) のインターネット上のポジティブな活動を
  週次で収集し、activities.md を最新内容に更新する PR を作成する。
  GitHub API・はてなブログ RSS・Web 検索を活用し、幅広い技術的成果・
  情報発信・コミュニティ貢献を選別してテーブル形式で掲示する。

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
  web-search:
  edit:

timeout-minutes: 30

safe-outputs:
  create-pull-request:
    title-prefix: "[活動履歴] "
    labels: [automation]
    draft: false
    protected-files: fallback-to-issue
---

# 7474 活動履歴

あなたは日本人エンジニア **7474**（GitHub ユーザー名: `7474`、ハンドルネーム: `koudenpa` / `光電`）のポジティブなインターネット活動を収集し、このリポジトリの `activities.md` を更新する自動エージェントです。

## 基本情報

- **GitHub ユーザー名**: `7474`
- **ハンドルネーム**: `koudenpa`（光電）
- **主な技術**: .NET (C#), Microsoft Azure
- **はてなブログ**: `koudenpa.hatenablog.com`

## 目的

ポジティブな活動を **可能な限り過去にさかのぼって** 収集し、GitHub Pages で閲覧できる `activities.md` を更新する PR を作成してください。

> **初回実行の注意**: `activities.md` にまだ活動データが無い場合（テンプレート状態の場合）は初回実行とみなし、期間制限なく取得可能な全履歴を収集してください。  
> 2 回目以降は前回の最終更新日から現在までの差分を収集してください。前回の最終更新日は `activities.md` の「最終更新」行から読み取ってください。

---

## ステップ 1: GitHub 活動を収集する

### 1-a: GitHub API（パブリックイベント）

GitHub API を使って `7474` のパブリックイベントを取得してください。

```
https://api.github.com/users/7474/events/public?per_page=100&page=1
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

複数ページを取得する場合は最大 5 ページまで参照してください。

> **注意**: GitHub Events API は直近 90 日分しか返しません。初回実行でそれ以前の活動も必要な場合はステップ 1-b のフォールバックを使ってください。

### 1-b: フォールバック — GitHub リポジトリ・コミット履歴

Events API で十分な履歴が得られない場合（特に初回実行時）、以下の方法で補完してください:

1. **リポジトリ一覧の取得**: GitHub API で `7474` のパブリックリポジトリ一覧を取得する
   ```
   https://api.github.com/users/7474/repos?sort=updated&per_page=100
   ```
2. **各リポジトリの活動**:
   - リポジトリの作成日 (`created_at`)・最終更新日 (`pushed_at`) を活動として記録
   - 主要リポジトリ（スターが付いている、または README が充実しているもの）については最近のコミット履歴も確認
3. **リリース・タグ**: 主要リポジトリのリリースやタグ一覧を取得

### 1-c: フォールバック — GitHub API が失敗した場合

GitHub API が 404 やエラーを返した場合は、以下を試してください:

1. `web-fetch` で `https://github.com/7474` のプロフィールページを取得し、リポジトリ情報を解析する
2. `web-search` で `"7474" site:github.com` や `"koudenpa" site:github.com` を検索する

---

## ステップ 2: はてなブログの記事を収集する

以下の RSS フィードを取得し、記事を収集してください。

- **はてなブログ RSS**: `https://koudenpa.hatenablog.com/rss`

### フォールバック

RSS が取得できない場合は、以下を試してください:

1. `web-fetch` で `https://koudenpa.hatenablog.com/` のトップページを取得し、記事リンクを解析する
2. `web-fetch` で `https://koudenpa.hatenablog.com/archive` のアーカイブページを取得する（複数ページ）
3. `web-search` で `site:koudenpa.hatenablog.com` を検索する

ブログ記事はすべてポジティブな活動とみなしてください。

---

## ステップ 3: Web 検索で追加の活動を発見する

事前定義のソースに限らず、`web-search` を使って幅広い活動を探してください。

### 検索クエリの例

- `"koudenpa"` — ハンドルネームに関連する活動全般
- `"koudenpa" 登壇 OR 発表 OR LT` — 技術イベントでの登壇
- `"koudenpa" OR "7474" connpass OR doorkeeper` — 勉強会・イベント参加
- `"koudenpa" speakerdeck OR slideshare OR slides` — スライド公開
- `"koudenpa" npm OR nuget OR crates` — パッケージ公開
- `"7474" site:github.com` — GitHub 上の言及

### 対象となる活動の種類

以下のような活動を発見した場合は収集してください:

- 技術イベント・勉強会での登壇やLT
- スライド・発表資料の公開
- OSS パッケージの公開
- 技術コミュニティでの活動（回答、メンタリングなど）
- ポッドキャスト出演、インタビュー
- その他の技術的な情報発信

---

## ステップ 4: ポジティブ判定

各活動について以下の基準でポジティブかどうかを判断してください:

- 技術的な成果物の公開（コード公開、記事投稿、スライド公開など）
- コミュニティへの貢献（PR マージ、Issue クローズ、勉強会参加など）
- 学習・探求の証（スター、フォーク、新技術の試行）
- 情報発信・共有（ブログ、登壇、SNS での技術発信）

ネガティブまたは中立（例: Issue をオープンするだけなど）のものは除外してください。

---

## ステップ 5: `activities.md` を更新する

`activities.md` ファイルを以下のフォーマットで更新してください。

```markdown
# 活動履歴

> 最終更新: YYYY-MM-DD HH:MM JST  
> 収集期間: YYYY-MM-DD 〜 YYYY-MM-DD  
> ポジティブな活動 N 件

## 🐙 GitHub

| 日付 | 活動 | リポジトリ |
|------|------|-----------|
| YYYY-MM-DD | [活動の説明](URL) | リポジトリ名 |

## 📝 はてなブログ

| 日付 | 記事 |
|------|------|
| YYYY-MM-DD | [記事タイトル](URL) |

## 🌐 その他の活動

| 日付 | 活動 | ソース |
|------|------|--------|
| YYYY-MM-DD | [活動の説明](URL) | 発見元（例: connpass, SpeakerDeck 等） |
```

- 日付はすべて JST (UTC+9) で表記してください
- 日付降順（新しい順）に並べてください
- 該当の活動がないセクションは省略してください
- GitHub イベントについては、同一リポジトリへの PushEvent は 1 日 1 件にまとめてください
- 日付が特定できない場合は `不明` と記載してください

---

## ステップ 6: PR を作成する

`activities.md` に変更がある場合は `create-pull-request` safe-output を使ってプルリクエストを作成してください。

活動が何も見つからなかった場合は PR を作成せずに終了してください。
