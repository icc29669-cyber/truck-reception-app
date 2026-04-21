# 新しいClaudeセッションへの初手プロンプト

以下をそのまま新しいClaude Codeセッションに貼り付けて開始してください。

---

## ■ コピー&ペースト用プロンプト（ここから）

このプロジェクトを引き継いで保守・開発を続けてください。

**プロジェクト場所:**
```
C:\Users\1219\OneDrive - 日本セイフティー株式会社\デスクトップ\くるーど\truck-reception-app
```

**まず以下を読んでプロジェクトを把握してください:**
1. `HANDOFF.md` — プロジェクト全体の引き継ぎ書（このチャットで行った作業の要約を含む）
2. `prisma/schema.prisma` — DBスキーマ
3. `src/lib/session.ts` — 認証の仕組み
4. `src/middleware.ts` — ルートのアクセス制御

**プロジェクト概要:**
- 日本セイフティー株式会社（仮設資材レンタル業）の社内システム
- トラックドライバーの受付キオスクとバース（荷台）予約管理を統合したNext.js 14アプリ
- DB: Neon PostgreSQL / Vercel 自動デプロイ / GitHub: `icc29669-cyber/truck-reception-app`

**技術スタック:**
- Next.js 14 (App Router) + TypeScript + Prisma v5 + Tailwind CSS v3
- 認証: PBKDF2-SHA256 + HMAC-SHA256（bcrypt不使用、edge対応）
- WebAuthn/Passkey対応（ドライバー向け）

**現在のアプリ構成（3ゾーン）:**
- `/admin` — スタッフ向け管理画面（truck_session cookie必須）
- `/kiosk` — 受付キオスク（truck_session cookie必須）
- `/driver` — ドライバーポータル（独自認証、公開）

**ユーザー応対方針:**
- 返答は日本語で
- 「バイブコーディング」スタイルで開発支援（コードを書いて直接適用していく）
- 中規模以上の変更は並列エージェントを活用

準備ができたら「HANDOFF.mdを読みました。現在の状態を把握しました。次に何をしますか？」と報告してください。

---

## ■ 環境変数の伝え方

`.env.local` の内容を口頭または貼り付けで渡すか、VercelダッシュボードのEnvironment Variablesを共有してください。必要な変数:

- `DATABASE_URL` — Neon pooled URL
- `DIRECT_URL` — Neon direct URL  
- `SESSION_SECRET` — 32文字以上のランダム文字列
- `BERTH_DATABASE_URL` — 旧berth DB（移行完了後は不要）

## ■ GitHubアクセス権の付与

`https://github.com/icc29669-cyber/truck-reception-app`
→ Settings → Collaborators → Add people
→ 引き継ぎ先のGitHubアカウントを Maintainer で招待

## ■ Neonアクセス権の付与（オプション）

`console.neon.tech` → プロジェクト → Settings → Access
→ 引き継ぎ先のメールアドレスを追加
