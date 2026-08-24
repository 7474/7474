# Resume Sync Action

職務経歴のマスタデータ(サービス非依存)を単一ソースとして、

1. GitHub Pages に公開する Markdown を**生成**し、
2. 同じマスタを各求職サイトのプロフィールへ**同期**する

GitHub Action。サービス固有の語彙(職種ID・スキルID・年数の刻みなど)への変換は、サービスごとの**アダプタ**が担う。現在の対応サービスは **LAPRAS**。

## 構成

```
resume.json                          汎用定義のマスタデータ(単一ソース)
職務経歴.md                           ← resume.json からの生成物(直接編集しない)
.github/actions/resume-sync/
  action.yml
  scripts/
    lib/master.mjs                   マスタの読み込み・検証・共通ユーティリティ
    lib/markdown.mjs                 マスタ → 公開用Markdown のレンダラ
    adapters/lapras.mjs              マスタ → LAPRAS固有定義 のマッピング + API呼び出し
    generate.mjs                     生成のエントリポイント(--check で差分検証)
    sync.mjs                         同期のエントリポイント(サービスへディスパッチ)
```

マスタは [JSON Resume](https://jsonresume.org/schema/) 準拠の形で、独自に必要な項目のみ `x_` 接頭辞で拡張している(`x_wantToDo`, `work[].x_roles`, `skills[].x_years`, `x_talks`, `x_outputs` など)。`lib/` と `resume.json` は特定サービスを知らず、サービス固有の知識は `adapters/` にのみ存在する。

## マスタの編集フロー

```bash
# 1. resume.json を編集する
# 2. Markdown を再生成してコミットする
node .github/actions/resume-sync/scripts/generate.mjs

# 同期予定の内容を確認する(APIを呼ばない)
node .github/actions/resume-sync/scripts/sync.mjs --dry-run
```

`職務経歴.md` を直接編集してはいけない。プルリクエストのCIが `--check` で生成物とマスタの一致を検証し、乖離していれば失敗する。

## CIの挙動

| きっかけ | 実行内容 |
|---|---|
| プルリクエスト | `mode: check` のみ。生成物がマスタと乖離していたら失敗する(再生成漏れ・手編集の防止) |
| `main` へのpush | `mode: check,sync`。検証後、各サービスへ上書き同期する |
| 手動実行(`Run workflow`) | 同上。`dry_run: true` を指定すると、APIを呼ばずに同期予定のみ表示する |

同期時、スキル名がサービスのカタログに存在しない場合は**警告してスキップ**する(ジョブは失敗しない)。それ以外のAPIエラーはジョブの失敗として扱う。

## 運用ルール

リポジトリ全体の運用ルール(公開面の扱い、マスタに書いてよい情報の境界など)は [../../CONTRIBUTING.md](../../CONTRIBUTING.md) にまとめてある。このActionを使う上で特に注意する点は下記のとおり。

- **同期は上書き**: サービス側(LAPRASのプロフィール画面など)で直接編集した内容も次回の同期で失われる。編集はマスタに一本化する
- **職種(ロール)を追加するときは2箇所を直す**: 汎用語彙 `scripts/lib/master.mjs` の `ROLES` と、各アダプタの対応表(LAPRASなら `adapters/lapras.mjs` の `ROLE_TO_POSITION_ID`)の両方に追加する。片方だけではマスタの検証か同期で失敗する
- **初回とマスタの大きな変更時は `dry_run` で確認する**: 特にスキル名の解決結果(未解決の警告)は実行時にしか分からない

## 同期内容(LAPRASアダプタ)

| マスタ(汎用定義) | LAPRAS(固有定義) | マッピング |
|---|---|---|
| `basics.summary` | 職務要約 `PUT /job_summary` | そのまま(上限10,000文字) |
| `x_wantToDo` | 今後のキャリアでやりたいこと `PUT /want_to_do` | そのまま(上限1,000文字) |
| `work[]` | 職歴 `POST` / `PUT /experiences/{id}` / `DELETE` | `x_roles`(例: `tech-lead`)→ 職種ID(例: 13)、`summary` + `highlights` → Markdownの説明文。組織名+開始年月で突合し、差分がある場合のみ更新 |
| `skills[]` | 経験技術 `PUT /tech_skill` | スキル名 → `GET /tech_skill/master` で実行時に名前解決、`x_years` → API許容値(0/1/2/3/5/10)へ丸め |

同期は**上書き**。サービス側で直接編集した内容はマスタの内容で置き換えられるため、編集はマスタに一本化すること。マスタに無い職歴の削除は `delete_missing_experiences: true` の時のみ行い、既定は警告のみ。

**APIが無くCI同期できないLAPRAS項目**(手動入力が必要): 希望年収・勤務地、学歴。

## 使い方

```yaml
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/resume-sync   # 切り出し後: 7474/resume-sync-action@v1
        with:
          mode: check,sync
          lapras_api_key: ${{ secrets.LAPRAS_API_KEY }}
```

### inputs

| name | 既定値 | 説明 |
|---|---|---|
| `master_path` | `resume.json` | マスタデータのパス |
| `mode` | `check,sync` | `check`(生成物の差分検証) / `generate`(生成) / `sync`(同期) をカンマ区切りで指定 |
| `markdown_path` | `職務経歴.md` | 生成するMarkdownのパス |
| `services` | `lapras` | 同期先サービス(カンマ区切り) |
| `lapras_api_key` | — | [LAPRAS APIキー](https://lapras.com/config/api-key)。Secretsに保存すること |
| `delete_missing_experiences` | `false` | `true`でマスタに無いサービス側の職歴を削除 |
| `dry_run` | `false` | `true`でAPIを呼ばず予定のみ表示 |

### セットアップ

1. https://lapras.com/config/api-key でAPIキーを発行
2. リポジトリの Settings > Secrets and variables > Actions に `LAPRAS_API_KEY` を登録
3. 初回は `Run workflow` を `dry_run: true` で実行し、同期予定とスキル名の解決結果(未解決の警告)を確認してから本同期する

## 背景

- LAPRAS公式の [lapras-inc/resume-sync-action](https://github.com/lapras-inc/resume-sync-action) は2025年12月15日に提供終了した(LLMでMarkdownを構造化する方式だった)
- LAPRASの公開API( [lapras-inc/lapras-mcp-server](https://github.com/lapras-inc/lapras-mcp-server) が使用する `https://lapras.com/api/mcp` 配下)は現役のため、本Actionはこれを直接呼ぶ
- 構造化データをマスタに持つことで、LLMによる変換を挟まずに決定的・冪等に同期できる

## 求職サイトのCI対応状況(2026-08調査)

| サービス | CI同期 | 手段 |
|---|---|---|
| LAPRAS | ○ | 公開API。本Actionのアダプタが対応 |
| GitHubプロフィール | ○ | プロフィールリポジトリ(このリポジトリ)自体がCI対象 |
| Findy / Forkwell | △ 間接 | 公開APIなし。GitHub連携によりリポジトリ活動が自動反映される |
| Wantedly | △ 限定 | [Open API](https://sg.wantedly.com/developers)はパートナー向けで、スキル・資格の追加のみ |
| LinkedIn | × | プロフィール編集APIはパートナー審査制 |
| 転職ドラフト / Green / ビズリーチ / paiza / doda | × | 公開APIなし(職務経歴書ファイルの手動アップロード・AIインポートのみ) |

## 新しいサービスを追加する

1. `scripts/adapters/<service>.mjs` を作成し、`name` / `displayName` / `sync({ master, apiKey, dryRun, deleteMissing, log, summary })` を export する(必要なら `unsupportedFields` も)
2. マスタの汎用定義からそのサービスの固有定義へのマッピングは、すべてそのファイル内に閉じる
3. `scripts/sync.mjs` の `ADAPTERS` にAPIキーの環境変数名とともに登録する
4. `action.yml` にそのサービスのキー入力を追加する

## リポジトリ切り出し(再利用)手順

このディレクトリは自己完結しており、他リポジトリからの再利用は以下で可能:

1. 公開リポジトリ `7474/resume-sync-action` を作成
2. このディレクトリ(`action.yml`, `scripts/`, `README.md`)の内容をそのリポジトリのルートにコピーし、タグ `v1` を付与
3. 利用側ワークフローの `uses: ./.github/actions/resume-sync` を `uses: 7474/resume-sync-action@v1` に変更
