<!-- このファイルは activities.json から生成されています。直接編集せず activities.json を編集し、`node .github/scripts/activities/render.mjs` で再生成してください。 -->

# プロジェクト & 活動ハイライト

> 最終更新: 2026-08-27

## 🎯 プロジェクト

- **SRC# に GitHub Agentic Workflows を導入**（2026-06）
  - 自作の gh-aw-compile-action を SRC# に適用し、GitHub Agentic Workflows の `.lock.yml` 自動生成を CI に組み込んだ。
  - 根拠: [pull-request](https://github.com/7474/SRC/pull/1032)
  - 技術: GitHub Actions, GitHub Agentic Workflows
- **php-my-admin-lambda-web-adapter — phpMyAdmin を AWS Lambda Web Adapter でサーバーレス化**（2026-04）
  - phpMyAdmin を AWS Lambda Web Adapter + CloudFront 上で動かす構成テンプレート。読み取り専用ファイルシステムやステートレスセッションなど Lambda 特有の制約に対応した。
  - 根拠: [repository](https://github.com/7474/php-my-admin-lambda-web-adapter) / [pull-request](https://github.com/7474/php-my-admin-lambda-web-adapter/pull/50)
  - 技術: PHP, Apache, AWS Lambda, Amazon CloudFront, Amazon ECR, Docker, Terraform, GitHub Actions
- **SRC# — Simulation RPG Construction の C# .NET 移植**（2026-02）
  - 2000年代の VB 製シミュレーション RPG エンジン「SRC」を C#/.NET へ移植する長期プロジェクト。v0.1〜v0.5 まで継続的にリリースし、コアライブラリ・Windows Forms・Blazor WebAssembly など複数コンポーネントを実装した。
  - 根拠: [repository](https://github.com/7474/SRC) / [release](https://github.com/7474/SRC/releases/tag/v0.5.0)
  - 技術: C#, .NET 8, .NET Standard 2.1, Windows Forms, Blazor WebAssembly, Docker, GitHub Actions
- **NantoNBai — 「ナントナクバイ」なグラフをオフィスソフト風に自動生成するサービス**（2025-09）
  - オフィスソフトで雑に作られたようなグラフ画像をAzure Functions上でAPIとして生成するサービス。OpenXML/SVG/PNGの変換パイプラインを自前実装し、商用ライブラリの透かし問題を自力レンダリングで解決した。
  - 根拠: [repository](https://github.com/7474/NantoNBai) / [pull-request](https://github.com/7474/NantoNBai/pull/175)
  - 技術: C#, .NET, Azure Functions, Open XML SDK, Svg.Skia, SkiaSharp, CloudFront

## 📦 公開パッケージ

- **gh-aw-compile-action — GitHub Agentic Workflows のコンパイル自動化 Action**（2026-04）
  - `.md` の変更を検知して `gh aw compile` を実行する GitHub Action を自作し、GitHub Marketplace に公開した。
  - 根拠: [repository](https://github.com/7474/gh-aw-compile-action) / [release](https://github.com/7474/gh-aw-compile-action/releases/tag/v1)
  - 技術: GitHub Actions, gh CLI, GitHub Agentic Workflows

## 📝 技術発信

- **[画像バトラー〜ちょっと作りたかったものを生成AIにサッと作って貰う〜](https://koudenpa.hatenablog.com/entry/2026/07/30/223317)**（2026-07）
  - PhotoBattler の後継として、作りたいアイデアを生成AIに委ねてあっさり実現した体験を記事化。プロトタイプ製作のコスト感の変化を記録した。
  - 技術: 生成AI
- **[AWS DevOps Agent雑感](https://koudenpa.hatenablog.com/entry/2026/07/24/120000)**（2026-07）
  - AWS DevOps Agent の使い心地を検証・記録し、他のAI開発エージェントとの比較考察を行った記事。
  - 技術: AWS, 生成AI
- **[大手外食業の中央注文管理Webサービスがダウンしたら？](https://koudenpa.hatenablog.com/entry/2026/05/06/153121)**（2026-05）
  - 外食チェーンの注文管理システム障害をエンジニア視点で分析し、アーキテクチャの脆弱性や可用性設計を考察した記事。
  - 技術: アーキテクチャ, 可用性設計
- **[Azure嫌になっちまったな —— 趣味の拠点をAWS CloudFrontへ移す話](https://koudenpa.hatenablog.com/entry/2026/04/10/094719)**（2026-04）
  - 個人サイトの基盤を Azure から AWS CloudFront へ移行した経緯と技術的判断を記録した記事。
  - 技術: AWS, Amazon CloudFront, Azure
- **[phpMyAdminをAWSのLambda関数URLで動かす](https://koudenpa.hatenablog.com/entry/2026/04/06/105622)**（2026-04）
  - phpMyAdmin を AWS Lambda 関数URLで動かす構成を検証した記事。php-my-admin-lambda-web-adapter の実装過程を記録している。
  - 技術: PHP, AWS Lambda
- **[Aurora for MySQL r6g to r8g のパフォーマンス変化例](https://koudenpa.hatenablog.com/entry/2026/04/04/202642)**（2026-04）
  - Amazon Aurora for MySQL のインスタンスクラスを r6g から r8g に変更した際のパフォーマンス変化を実測した記事。
  - 技術: AWS, Amazon Aurora, MySQL
- **[VPS1台で動いていたLAMPなLaravel5をServerlessなLaravel12にした](https://koudenpa.hatenablog.com/entry/2026/03/24/015051)**（2026-03）
  - VPS 上の LAMP 構成 Laravel 5 アプリケーションを、サーバーレスな Laravel 12 構成へ移行した経緯を記録した記事。
  - 技術: PHP, Laravel, AWS Lambda, Serverless
- **[見せてもらおうか、RDSのBlue/Greenデプロイの性能とやらを](https://koudenpa.hatenablog.com/entry/2026/01/28/235749)**（2026-01）
  - Amazon RDS の Blue/Green デプロイ機能の性能を実際に検証した記事。
  - 技術: AWS, Amazon RDS
- **[Laravel LighthouseのGraphQLをOpenTelemetryトレース](https://koudenpa.hatenablog.com/entry/2025/03/23/203242)**（2025-03）
  - Laravel Lighthouse で構築した GraphQL API を OpenTelemetry でトレースする方法を検証した記事。
  - 技術: PHP, Laravel, Lighthouse, GraphQL, OpenTelemetry
- **[PHPを運用するときはOPcacheを有効にしておけ](https://koudenpa.hatenablog.com/entry/2025/02/23/225354)**（2025-02）
  - 本番運用における PHP OPcache の有効化の重要性と設定のポイントをまとめた記事。
  - 技術: PHP, OPcache
- **[CloudWatchメトリクスの歩き方](https://koudenpa.hatenablog.com/entry/2025/01/02/000000)**（2025-01）
  - Amazon CloudWatch のメトリクスを使いこなすための実践的な観点をまとめた記事。
  - 技術: AWS, Amazon CloudWatch

## 🛠 技術スキル(活動からの集計)

| 技術 | 活動数 | 主な活動 |
|----|----|----|
| AWS | 5件 | AWS DevOps Agent雑感 / Azure嫌になっちまったな —— 趣味の拠点をAWS CloudFrontへ移す話 / Aurora for MySQL r6g to r8g のパフォーマンス変化例 |
| PHP | 5件 | php-my-admin-lambda-web-adapter / phpMyAdminをAWSのLambda関数URLで動かす / VPS1台で動いていたLAMPなLaravel5をServerlessなLaravel12にした |
| GitHub Actions | 4件 | SRC# に GitHub Agentic Workflows を導入 / gh-aw-compile-action / php-my-admin-lambda-web-adapter |
| AWS Lambda | 3件 | php-my-admin-lambda-web-adapter / phpMyAdminをAWSのLambda関数URLで動かす / VPS1台で動いていたLAMPなLaravel5をServerlessなLaravel12にした |
| Amazon CloudFront | 2件 | php-my-admin-lambda-web-adapter / Azure嫌になっちまったな —— 趣味の拠点をAWS CloudFrontへ移す話 |
| C# | 2件 | SRC# / NantoNBai |
| Docker | 2件 | php-my-admin-lambda-web-adapter / SRC# |
| GitHub Agentic Workflows | 2件 | SRC# に GitHub Agentic Workflows を導入 / gh-aw-compile-action |
| Laravel | 2件 | VPS1台で動いていたLAMPなLaravel5をServerlessなLaravel12にした / Laravel LighthouseのGraphQLをOpenTelemetryトレース |
| 生成AI | 2件 | 画像バトラー〜ちょっと作りたかったものを生成AIにサッと作って貰う〜 / AWS DevOps Agent雑感 |
