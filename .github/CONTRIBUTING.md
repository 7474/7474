# このリポジトリの運用

`7474/7474` はユーザ名と同名のリポジトリのため、**内容がそのまま公開面に出る**特殊なリポジトリ。運用ルールをここ(`.github/` 配下 = Pages の公開対象外)に置く。

## 公開面と非公開面

| ファイル | どこに出るか |
|---|---|
| `README.md` | **GitHubプロフィール**(https://github.com/7474 のトップ)**および GitHub Pages のトップページ**。最も人目に触れる |
| `職務経歴.md` | GitHub Pages のページ。**`resume.json` からの生成物** |
| `activities.md` | GitHub Pages のページ(別のワークフローが更新) |
| `resume.json` | 静的ファイルとしてそのまま配信される(JSON Resume 形式の機械可読な職務経歴) |
| `images/` | GitHub Pages から配信される |
| `.github/` 配下 | **公開されない**(Jekyll はドットディレクトリを無視する)。ワークフロー・アクション・この運用ドキュメントの置き場所 |

GitHub Pages は Jekyll(`jekyll-theme-minimal`)で構築され、front matter の無い Markdown もページ化される(`jekyll-optional-front-matter`)。**リポジトリのルートに置いた `.md` は原則すべて公開される**ため、公開したくない文書をルートに置かないこと。

## `README.md` の扱い

プロフィールとして読まれる文書。**運用手順やメンテナンス情報を書かない**(読者にとってノイズであり、プロフィールの品位を損なう)。書くのは自己紹介と各コンテンツへのリンクのみ。

自己紹介の内容は `resume.json` の `basics`(氏名・肩書き・要約)と矛盾させないこと。両者は用途が違う(README = 人柄と趣味開発の紹介 / resume.json = 職務経歴)ため文章は別で構わないが、肩書きや事実関係が食い違わないようにする。

## 職務経歴の更新フロー

`resume.json` がマスタデータ(単一ソース)。

```bash
# 1. resume.json を編集する
# 2. 公開用 Markdown を再生成してコミットする
node .github/actions/resume-sync/scripts/generate.mjs

# 求職サイトへの同期予定を確認する(APIを呼ばない)
node .github/actions/resume-sync/scripts/sync.mjs --dry-run
```

`main` へマージすると `sync-resume` ワークフローが動き、GitHub Pages と求職サイトのプロフィール(現在は LAPRAS)が更新される。

- プルリクエストでは生成物とマスタの一致だけを検証する(乖離していたら失敗)
- 手動実行(`Run workflow`)では `dry_run: true` で同期予定だけを確認できる

仕組み・サービスごとのマッピング・新しいサービスの追加方法は [actions/resume-sync/README.md](actions/resume-sync/README.md) を参照。

## 活動(ポートフォリオ)の収集フロー

`activities.md` は `activities.json` からの生成物で、収集は週次の agentic workflow (`collect-activities.md`) が行う。

```
収集エージェント ──→ activities.json ──→ [CI] verify.mjs ──→ render.mjs ──→ activities.md
  (根拠URLを付与)                        帰属の機械検証        生成・自動コミット
```

**設計の要点は「帰属を人間がレビューしない」こと**。他者の成果を自分の活動として書いてしまう事故を、CI が機械的に弾く。

- 各項目は `evidence`(根拠URL)を必ず持つ。一次根拠(PR / コミット / リリース / リポジトリ / 本人のブログ / 本人の Speaker Deck)が最低1つ必要
- `verify.mjs` が GitHub API に問い合わせ、根拠URLの**実際の作成者が `7474` か**を照合する。他者や bot が作成したものを根拠にすると CI が失敗する
- 他者の成果物が土台のもの(テンプレート・教材・フォーク)は `attribution: "derived"` と `upstream` の明示が必須。**フォークでないことは自作の証明にならない**ため、README の出所表記も確認する
- パッケージ登録ページや第三者の記事(`package` / `external`)は補足にしかならず、単独で項目を成立させられない(同名異人・単なる言及の混入を防ぐため)
- 実装の主体が他者なら `maintainer` / `reviewer` を使う。これらは生成物に役割として明示される

手元で確認する場合:

```bash
node .github/scripts/activities/verify.mjs            # 帰属の検証(GitHub API を使う)
node .github/scripts/activities/verify.mjs --offline  # 構造とホストのみ検証
node .github/scripts/activities/render.mjs            # activities.md を生成
```

## 運用ルール

- **`職務経歴.md` を直接編集しない**。生成物であり、次回の生成で上書きされる。編集は `resume.json` に対して行う
- **`activities.md` を直接編集しない**。生成物であり、CI が `activities.json` から再生成する
- **根拠のない活動を `activities.json` に書かない**。項目数より帰属の正確さを優先する
- **求職サイト側で直接編集しない**。同期は上書きのため、サービス側の編集は失われる
- **`resume.json` に非公開情報を入れない**。このリポジトリは公開されており、`resume.json` は Pages からも配信される。希望年収、生年月日、勤務先の非公開情報などをマスタに書かないこと(それらは別途非公開で管理し、API連携の無いサイトへは手入力する)
- **`education`(学歴)はマスタに持つが公開ページには出さない**。各求職サイトの入力項目として必要なためマスタで管理するが、`職務経歴.md` には意図的にレンダリングしていない(`scripts/lib/markdown.mjs` のコメント参照)。「学歴の節が抜けている」と誤解して追加しないこと。なお `resume.json` 自体は公開されるため、学歴もリポジトリ上では参照可能である点は承知の上での方針
- **職種(ロール)を追加するときは2箇所を直す**。`scripts/lib/master.mjs` の `ROLES` と、各アダプタの対応表(LAPRAS なら `adapters/lapras.mjs` の `ROLE_TO_POSITION_ID`)の両方。片方だけではマスタの検証か同期で失敗する
- **公開したくない文書をリポジトリのルートに置かない**。作業メモ・下書き・非公開の職務経歴などは、このリポジトリではなく非公開の管理先に置く
