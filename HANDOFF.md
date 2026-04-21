# トラック受付システム — 引き継ぎ書

作成日: 2026-04-22  
対象プロジェクト: `truck-reception-app`

---

## 1. プロジェクト概要

日本セイフティー株式会社（建設用仮設資材レンタル業）の**社内業務アプリ**。  
トラックドライバーが機材センターに到着した際の受付処理と、バース（荷台）予約を管理する。

### アプリのURL

| 用途 | URL |
|------|-----|
| 本番 (Vercel) | `https://truck-reception-app.vercel.app` |
| 管理画面 | `https://truck-reception-app.vercel.app/admin` |
| キオスク画面 | `https://truck-reception-app.vercel.app/kiosk` |
| ドライバー予約 | `https://truck-reception-app.vercel.app/driver` |
| ログイン | `https://truck-reception-app.vercel.app/login` |

### リポジトリ

- GitHub: `https://github.com/icc29669-cyber/truck-reception-app`
- ブランチ: `main`
- Vercel: 自動デプロイ (main push → 即デプロイ)

---

## 2. このチャット(引き継ぎ前の作業)で行ったこと

### フェーズ1: 2アプリ統合 (berth-app → reception-app)

元々 `truck-berth-app`（バース予約管理）と `truck-reception-app`（キオスク受付）の2アプリに分かれていた。これを **reception-app 1本に統合**した。

**主な変更:**

- `prisma/schema.prisma` を全面改訂
  - `AdminUser` + `KioskTerminal` → 単一 `User` モデル（loginId/passwordHash/name/centerId/paperWidth/autoPrint）
  - `Driver` に Passkey認証フィールド追加（isAdmin/pin/sessionVersion/agreedToPolicy）
  - 新規モデル追加: `Passkey`, `AuthChallenge`, `LoginAttempt`, `Holiday`, `BarcodeSequence`, `CenterDailyCounter`, `AppSetting`
  - `Reservation` に `driverId` 外部キー追加
  - `Reception` に `barcodeSeq`, `fiscalYear` 追加
  - `Center` に `showInDriverApp Boolean @default(true)` 追加

- `src/lib/session.ts` を新規作成
  - PBKDF2-SHA256(100k iter) でパスワードハッシュ
  - HMAC-SHA256 でセッションcookie署名（edge対応、bcrypt不使用）
  - cookie名: `truck_session`、sliding refresh で実質無期限

- `src/middleware.ts` を全面書き直し
  - `/driver/*` と `/api/driver/*` は独自認証（driver_session）のためmiddlewareはスルー
  - `/admin`, `/kiosk`, `/api/admin`, `/api/reception` は `truck_session` 必須

- `/login` ページを統合（admin + kiosk 共通ログイン）
  - ファーストラン時: DB にユーザーが0件なら bootstrap モード（初期ユーザー作成）

- berth-app の全ページ・APIを `/driver/*` 配下に移植
  - `/driver` — 認証TOP（passkey/PIN）
  - `/driver/reserve` — バース予約
  - `/driver/dashboard` — 予約確認・キャンセル
  - `/driver/my-reservations` — 過去予約一覧
  - `/driver/profile` — プロフィール編集
  - `/driver/receipt/[id]` — 受付票

### フェーズ2: 管理画面の改善

| 機能 | 変更内容 |
|------|----------|
| ダッシュボード | ログインユーザーのセンターに絞り込んでKPIを表示 |
| 予約一覧 | 初期状態でログインユーザーのセンターを選択済みにする |
| 受付一覧 | 同上 |
| センター管理 | 削除機能: FK依存チェック付き（reception/reservation/userが紐づく場合は削除不可） |
| センター管理 | `showInDriverApp` フラグUI追加（ドライバー予約画面への表示/非表示を切替） |
| ユーザー管理 | 新規ページ作成（6桁loginId + 4桁以上パスワード + センター紐付け） |
| 更新履歴 | `/admin/changelog` ページ追加（berth-appからポート） |
| ドライバー向け案内 | `/admin/driver-guide` ページ追加（QRコード付き印刷用シート） |
| サイドバー | 「キオスクを起動」ボタンを左メニューに目立つ配置で追加 |
| 同期API削除 | berth連携用の `/api/admin/sync/*` を削除（SyncTabも廃止） |

### フェーズ3: データ移行

- `/api/admin/migrate-berth` エンドポイント作成
  - `BERTH_DATABASE_URL` 環境変数で旧DBに接続
  - ドライバー・passkey・予約・祝日を reception DB へ移行（冪等・重複スキップ）
  - `?dry=1` でdry-run可能
- `berth-app` は全ルートを reception-app にリダイレクトする薄いシェルに変換

### フェーズ4: センター別表示制御

- `Center.showInDriverApp` フラグを API/UI に実装
- ドライバー予約・ダッシュボードは `/api/centers?forDriver=1` でフィルタリング

---

## 3. ユーザーID・パスワード一覧

### ログイン仕様
- loginId: 6桁の数字（先頭4桁 = 所属センターコード、末尾2桁 = 端末連番）
- パスワード: 4桁以上の数字（**現行の運用ルール: loginId の先頭4桁 = センターコードと同じ値を設定**）
- 自動ログアウトなし（sliding refresh cookie）

### 登録済みID（2026-04-22 本番 API で実在確認済み）

| loginId | パスワード | ユーザー名 | センター |
|---------|-----------|-----------|---------|
| 510101 | `5101` | 岸和田機材センター01 | id=1, code=5101: 岸和田機材センター |
| 510102 | `5101` | 岸和田機材センター02 | id=1, code=5101: 岸和田機材センター |
| 310101 | `3101` | 狭山機材センター01 | id=2, code=3101: 狭山機材センター |
| 310102 | `3101` | 狭山機材センター02 | id=2, code=3101: 狭山機材センター |
| 510601 | `5106` | 高槻機材センター01 | id=5, code=5106: 高槻機材センター |
| 510801 | `5108` | 摂津機材センター01 | id=4, code=5108: 摂津機材センター |

> パスワードを変更する場合は管理画面のユーザー管理からリセット可能（または `scripts/seed-admin.mjs` で再作成）。

---

## 4. アーキテクチャ

```
truck-reception-app/
├── src/
│   ├── app/
│   │   ├── login/              # 統合ログインページ
│   │   ├── admin/              # 管理画面 (truck_session 必須)
│   │   │   ├── page.tsx        # ダッシュボード
│   │   │   ├── reservations/   # 予約一覧
│   │   │   ├── receptions/     # 受付一覧
│   │   │   ├── drivers/        # ドライバー・運送会社管理
│   │   │   ├── vehicles/       # 車両管理
│   │   │   ├── users/          # ユーザー管理
│   │   │   ├── centers/        # センター設定
│   │   │   ├── settings/       # システム設定
│   │   │   ├── changelog/      # 更新履歴
│   │   │   └── driver-guide/   # ドライバー向け案内(印刷用)
│   │   ├── kiosk/              # キオスク受付フロー (truck_session 必須)
│   │   │   ├── page.tsx        # TOP
│   │   │   ├── phone/          # 電話番号入力
│   │   │   ├── person/         # ドライバー選択
│   │   │   ├── vehicle/        # 車両入力
│   │   │   ├── plate/          # ナンバープレート入力
│   │   │   ├── reservation-select/ # 予約照合
│   │   │   ├── data-confirm/   # 確認
│   │   │   ├── final-confirm/  # 最終確認
│   │   │   └── complete/       # 受付完了(レシート印刷)
│   │   └── driver/             # ドライバーポータル (公開、独自認証)
│   │       ├── page.tsx        # ログインTOP
│   │       ├── reserve/        # バース予約
│   │       ├── dashboard/      # 予約確認
│   │       ├── my-reservations/ # 過去予約
│   │       ├── profile/        # プロフィール
│   │       └── receipt/[id]/   # 受付票
│   ├── api/
│   │   ├── auth/               # login/logout/me/bootstrap
│   │   ├── admin/              # 管理API (centers/users/drivers/etc.)
│   │   ├── kiosk-config/       # キオスク初期設定
│   │   ├── reception/          # 受付処理API
│   │   ├── centers/            # センター一覧 (公開、?forDriver=1 対応)
│   │   └── driver/             # ドライバーAPI (passkey/reservations/etc.)
│   ├── lib/
│   │   ├── session.ts          # PBKDF2 + HMAC-SHA256 セッション管理
│   │   ├── driverAuth.ts       # ドライバー用 driver_session cookie
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── rateLimit.ts        # ログイン失敗レート制限
│   │   └── ...
│   └── middleware.ts           # 認証ゲート
├── prisma/
│   └── schema.prisma           # DBスキーマ
├── scripts/
│   ├── seed-admin.mjs          # 管理者ユーザー初期作成
│   └── migrate-berth-data.mjs  # berth→reception DB移行スクリプト
└── vercel.json                 # buildCommand (prisma generate + db push + build)
```

---

## 5. 環境変数

Vercel の Environment Variables に設定が必要。`.env.local` をローカルに置く場合も同じ変数名。

| 変数名 | 用途 | 例 |
|--------|------|-----|
| `DATABASE_URL` | Neon PostgreSQL (pooled / PgBouncer) | `postgresql://...?pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL` | Neon PostgreSQL (direct, マイグレーション用) | `postgresql://...` |
| `SESSION_SECRET` | HMAC-SHA256署名キー (32文字以上) | ランダム文字列64文字推奨 |
| `BERTH_DATABASE_URL` | 旧berth-app DB（移行完了後は不要） | `postgresql://...` |

> `SESSION_SECRET` を変更するとすべてのセッションが無効になる（全ユーザー再ログイン必要）

---

## 6. 認証フロー

### スタッフ（管理者/キオスク）
```
/login → POST /api/auth/login
       → DB照合(PBKDF2-SHA256)
       → Set-Cookie: truck_session=<HMAC署名トークン>
       → /admin or /kiosk へリダイレクト

/api/auth/me  → cookieを読んでセッション検証 + sliding refresh
/api/auth/logout → cookie削除
```

### ドライバー
```
/driver → passkey or PIN認証
        → Set-Cookie: driver_session=<cookieSign>
        → /driver/dashboard

POST /api/driver/auth/passkey/auth-options → WebAuthn challenge生成
POST /api/driver/auth/passkey/auth-verify  → WebAuthn認証完了
```

### ファーストラン（初期セットアップ）
- DBにUserが0件の状態で `/login` にアクセス → bootstrap画面表示
- 任意のloginId/パスワードを入力 → `POST /api/auth/bootstrap` → 最初のユーザー作成

---

## 7. DBスキーマ概要

DB: Neon PostgreSQL (Serverless)

### 主要テーブル

| テーブル | 説明 |
|---------|------|
| `Center` | 機材センター（営業時間・メッセージ・showInDriverApp） |
| `User` | スタッフアカウント（loginId 6桁・センター紐付け・印刷設定） |
| `Driver` | ドライバー（カタカナ氏名・電話・Passkey認証情報） |
| `Passkey` | WebAuthn認証情報 |
| `Company` | 運送会社 |
| `Vehicle` | 車両（ナンバープレート） |
| `Reservation` | バース予約（centerId・driverId・日時・ステータス） |
| `Reception` | 受付記録（到着日時・センター日次連番・バーコード連番） |
| `Holiday` | 祝日マスタ |
| `AppSetting` | アプリ設定（スロット時間・デフォルト営業時間） |
| `CenterDailyCounter` | センター日次受付番号カウンタ（race条件防止） |
| `BarcodeSequence` | 全国通し連番（年度別） |
| `Setting` | その他設定（キー/バリュー） |
| `LoginAttempt` | ログイン失敗記録（IPベースレート制限用） |
| `AuthChallenge` | WebAuthnチャレンジ一時保存 |

---

## 8. デプロイ手順

### 通常デプロイ (git push のみ)

```bash
git add -A
git commit -m "変更内容"
git push origin main
# → Vercel が自動ビルド・デプロイ
```

Vercel の `vercel.json` に以下が設定されているため、デプロイ時に自動でスキーマ変更も適用される:
```json
{
  "buildCommand": "prisma generate && (prisma db push --accept-data-loss --skip-generate || echo 'db push skipped') && next build"
}
```

### スキーマ変更時の注意
- `prisma db push` は `--accept-data-loss` を使っているため、カラム削除等は**データも消える**
- 安全に変えたい場合は先にカラムを `nullable` にしてから段階的に移行すること

### ローカル開発

```bash
cd truck-reception-app
npm install
# .env.local に DATABASE_URL / DIRECT_URL / SESSION_SECRET を設定
npm run dev
# → http://localhost:3000
```

---

## 9. 残タスク（未完了）

| 優先度 | タスク | 詳細 |
|--------|--------|------|
| 高 | berth-app データ移行実行 | `/api/admin/migrate-berth` を POST で叩く。`BERTH_DATABASE_URL` が Vercel に設定済みであれば管理画面から実行可能 |
| 中 | berth-app 本体のリダイレクト化 | `truck-berth-app/next.config.js` に全ルートリダイレクトを設定済みだがデプロイ要確認 |
| 低 | 印刷設定の整理 | `User.paperWidth/autoPrint`（サーバー側）と `/admin/settings` のプリンター設定（localStorage）が並存している。設定タブはセットアップ案内用として共存させるか、UserモデルのものをUIに反映するか要検討 |
| 低 | ドライバーガイドQRコード確認 | `/admin/driver-guide` ページのQRが `https://truck-reception-app.vercel.app/driver` を指しているか確認 |

---

## 10. 新しいClaude Codeセッションでの始め方

### リポジトリクローン（初回のみ）

```bash
git clone https://github.com/icc29669-cyber/truck-reception-app.git
cd truck-reception-app
npm install
```

### 環境変数設定（.env.local）

```
DATABASE_URL=postgresql://...（Neon の pooled URL）
DIRECT_URL=postgresql://...（Neon の direct URL）
SESSION_SECRET=（32文字以上のランダム文字列）
BERTH_DATABASE_URL=（旧berth DB、移行後は不要）
```

### 既存コードを把握するための読み込み順

1. `prisma/schema.prisma` — データモデル全体
2. `src/lib/session.ts` — 認証の心臓部
3. `src/middleware.ts` — ルーティングのアクセス制御
4. `src/app/admin/layout.tsx` — 管理画面の構造
5. `src/app/kiosk/page.tsx` — キオスクのエントリーポイント
6. `src/app/driver/page.tsx` — ドライバーポータルのエントリーポイント

### コード変更後のチェック

```bash
npm run build      # 型チェック + ビルド（エラーがなければ本番でも動く）
npm test           # ユニットテスト（vitest）
```

---

## 11. 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v3 |
| ORM | Prisma v5 |
| DB | Neon PostgreSQL (Serverless) |
| 認証 | PBKDF2-SHA256 + HMAC-SHA256（edge対応、外部ライブラリ不使用） |
| Passkey | @simplewebauthn/server |
| ホスティング | Vercel |
| バージョン管理 | GitHub |

---

## 12. よくあるトラブルシューティング

### ログインできない
- `SESSION_SECRET` が Vercel の環境変数に設定されているか確認
- DBにUserが0件 → `/login` のbootstrapモードで初期ユーザー作成

### センター削除できない
- 受付・予約・ユーザーが紐づいていると削除不可（UI上にエラーメッセージ表示）
- 先に関連データを削除するか、「無効化」で対応

### Vercelビルドが失敗する
- `prisma generate` が失敗している場合: `DATABASE_URL` / `DIRECT_URL` が設定されているか確認
- スキーマとDBの不整合: Vercelのビルドログを確認し、`db push` のエラーを読む

### ドライバー予約画面にセンターが出てこない
- `Center.showInDriverApp = true` かつ `isActive = true` のセンターのみ表示される
- 管理画面 → センター設定 → 編集 → 「予約アプリに表示」チェックボックスを確認

---

*このドキュメントは 2026-04-22 のClaude Codeセッション完了時点の状態を記録したものです。*
