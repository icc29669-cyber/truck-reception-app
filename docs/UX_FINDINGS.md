# UX テスト所見 + 修正記録

実施日: 2026-04-22 / 2026-04-23
対象: truck-reception-app 本番 (https://truck-reception-app.vercel.app)
実施者: Claude Code セッション内で自動化ウォークスルー + 並列コード監査 + 実機（ユーザー）フィードバック

---

## エグゼクティブサマリ

**ドライバー予約画面が 2026-04-22 時点で実質動作していなかった**（電話番号入力後にループ、または 500 エラー）。複数の致命バグを発見→修正→デプロイ。加えて UX 改善 30 項目以上を適用。

**結果**: すべての核機能（ドライバー新規登録、予約作成、予約確認、受付キオスク、管理画面）が本番で動作する状態に復旧 + 操作性改善。

---

## 1. 発見した致命バグ（修正済・本番反映済）

| # | 症状 | 原因 | 修正コミット |
|---|------|-----|------------|
| 1 | 電話番号入力後に「エラーが発生しました」 | driver/page.tsx が存在しない `/api/auth` を呼び出し (正: `/api/driver/auth`) | `d21555c` |
| 2 | PIN 設定後に `/driver` へループ | dashboard/reserve/profile/my-reservations も同じ `/api/auth` 誤り | `d21555c` |
| 3 | 生体認証で 500 エラー | `@simplewebauthn/server` v13 API 変更 (`authenticator` → `credential`) に未対応 | `41a8c21` |
| 4 | 予約画面が「空き状況を確認中...」で永久ハング | `/api/driver/berths` が存在しない `date` フィールドを Prisma `where` に渡して 500 (正: `reservationDate`) | `2a7e259` |
| 5 | 画面がスクロールできない | `globals.css` の `html, body { overflow: hidden }` が全ページ適用（元はキオスク用） | `ed39122` |
| 6 | Driver.phone の複合ユニーク制約問題で findUnique が例外 | `findUnique` → `findFirst` に全面変更、register時の必須フィールド補完 | `e6927a6` |

---

## 2. UX 改善（修正済・本番反映済）

### ドライバー画面

| # | 課題 | 対応 | ファイル |
|---|------|------|---------|
| D-01 | 090/080/070 クイック選択が押下で消失し 0-9 テンキーが上にジャンプ | `visibility: hidden` に変更し領域維持 | driver/page.tsx |
| D-02 | 電話番号表示のフォントサイズが 24↔30 で微妙にガタつく | 28px + lineHeight:1 で統一 | driver/page.tsx |
| D-03 | バリデーションエラー出現/消失で下のテンキーがガタつく | min-height で領域予約、visibility のみ切替 | driver/page.tsx |
| D-04 | 「次へ」無効時の半透明 teal（rgba 0.35）が直射日光で判読不能 | `#d6d4cd` + `#9a978c` の solid コントラストに | driver/*.tsx 全般 |
| D-05 | 「通信エラーが発生しました」が汎用すぎて回復行動不明 | 「電波の弱い場所では接続できない…場所を変えて」等に具体化 | driver/page.tsx |
| D-06 | 生体認証 fetch 失敗が「エラーが発生しました」 | 「認証の準備に失敗…しばらく経ってから再度お試しください」 | driver/page.tsx |
| D-07 | ダッシュボードのスロットが `<div onClick>` で a11y 違反 | `<button type="button" disabled>` に変換 | driver/dashboard/page.tsx |
| D-08 | 満車トーストが SR で読み上げられない | `role="status"` + `aria-live="polite"` 追加 | driver/dashboard/page.tsx |
| D-09 | 「CENTER — タップで変更」の 11px が読みづらい | プリフィクスのみ 11px、説明を 13px に分割 | driver/dashboard/page.tsx |
| D-10 | receipt で 300ms 後自動印刷 → 内容確認前に印刷開始 | 3秒カウントダウン + 「今すぐ印刷 / キャンセル」 | driver/receipt/[id]/page.tsx |
| D-11 | receipt fetch 失敗で再試行不可 | 2秒後に 1 回自動リトライ + エラー時「もう一度試す」 | driver/receipt/[id]/page.tsx |
| D-12 | receipt 画面表示が 76mm 固定で見づらい | 画面 max-width:400px、印刷時のみ 76mm | driver/receipt/[id]/page.tsx |
| D-13 | プロフィールの電話変更が自由入力（ログイン画面はテンキー） | 同じテンキー UI に統一、validatePhone/isSubmittable 追加 | driver/profile/page.tsx |
| D-14 | reserve で必須項目未入力時に該当フィールドへフォーカス移動しない | refs + focus() + scrollIntoView() 追加 | driver/reserve/page.tsx |
| D-15 | my-reservations の「取り消し中...」にスピナーなし | インラインスピナー追加 | driver/my-reservations/page.tsx |
| D-16 | 「過去・取消済みを見る」タップ領域 30px | `padding 14px 2px` + `minHeight 44` | driver/my-reservations/page.tsx |
| D-17 | 過去予約 `opacity 0.6` で WCAG 違反 | 明示的 `color: #5a5852` に | driver/my-reservations/page.tsx |
| D-18 | キャンセル失敗「取り消しに失敗しました」のみ | `data.error` を優先表示 + 回復メッセージ付与 | driver/my-reservations/page.tsx |
| D-19 | エラー/必須項目リストが SR 非対応 | `role="alert"` / `aria-live="polite"` 追加 | driver/reserve/page.tsx |

### キオスク

| # | 課題 | 対応 | ファイル |
|---|------|------|---------|
| K-01 | OK ボタン無効時 `opacity: 0.4` で屋外識別困難 | solid `#d6d4cd` + `#9a978c` + shadow | kiosk/phone/page.tsx |
| K-02 | 検索失敗エラーに復旧ボタンなし | 「番号を入力し直す」60px 高ボタン追加 | kiosk/phone/page.tsx |
| K-03 | 会社名・氏名フィールドが `<div onPointerDown>` | `<button type="button">` に | kiosk/person/page.tsx |
| K-04 | data-confirm ヘッダー「次へ」無効時が半透明 | solid コントラストに統一 | kiosk/data-confirm/page.tsx |
| K-05 | final-confirm 戻るボタンに `type="button"` 欠如 | 追加（誤 submit 防止） | kiosk/final-confirm/page.tsx |
| K-06 | 「管理画面」ボタンのタップ領域 < 56px | `minWidth/minHeight: 56` + padding 強化 | kiosk/page.tsx |

### 管理画面

| # | 課題 | 対応 | ファイル |
|---|------|------|---------|
| A-01 | fetch 失敗時に silent fail、画面は空のまま | エラーバナー + 「再読み込み」ボタン追加 | admin/{page,reservations,drivers,vehicles,users,centers}.tsx |
| A-02 | 検索結果件数の表示なし | 検索欄下に「X 件ヒット」表示 | admin/drivers/page.tsx, vehicles/page.tsx |
| A-03 | 空状態（データなし）に新規作成 CTA なし | 「+新規〇〇を追加」ボタン追加 + 文言改善 | 同上 + users/centers |
| A-04 | 削除/キャンセル confirm() がターゲット情報なし | 会社名・時間帯・ドライバー名を明示 + 「取り消せません」警告 | admin/reservations/page.tsx |
| A-05 | 受付一覧に stray `)` が画面に表示 | 修正 | admin/receptions/page.tsx |
| A-06 | 「ステータスヲ変更」 の文字化け風タイポ | 「ステータスを変更」に修正 | admin/reservations/page.tsx |

---

## 3. 横断改善（一度で複数ファイル）

- **CTA 無効時の統一配色**: 全画面で `rgba(13,148,136,0.35)` → `#d6d4cd` + `#9a978c` に統一
- **スクロール問題**: `globals.css` から全ページ `overflow: hidden` 撤廃
- **型安全性**: `next.config.js` の `ignoreBuildErrors: true` を削除し、厳格な型チェックを復活
- **TS 型エラーを完全解消**: Prisma スキーマ v.s. コード不整合、@simplewebauthn v13 対応、Uint8Array 型等

---

## 4. 残課題（未対応・要検討）

| 優先度 | 内容 | 理由 |
|--------|------|-----|
| 中 | 電話番号テンキー UI の共通ライブラリ化 (`src/lib/phoneInput.ts`) | 現在 driver/page.tsx と profile/page.tsx に同じコードが重複。3箇所目（reserve 等）に波及する前に共通化 |
| 中 | 管理画面 CSV エクスポートボタンを top-right へ移動 | 現状はページ最下部。仕様確認が必要 |
| 低 | 印刷設定 (paperWidth/autoPrint) の User モデル vs localStorage の統合 | HANDOFF.md 参照、現状維持の方針を採用済み |
| 低 | 管理画面の一括削除（bulk actions） | 現状 1 件ずつ。大量データ運用が始まったら要 |
| 中 | Neon 接続プール数増加 | dev 環境から Neon に繋がりにくい問題は本番では発生しにくいが、スケール時に影響 |

---

## 5. 本日コミット一覧

```
fbe97ba fix: キオスク & 管理画面 UX 改善
67ab01e fix: ドライバー画面の UX 改善一括
e6999cd fix: 電話番号入力のガタつきを更に抑制
f6e737c fix: 電話番号入力のクイック選択ボタン消失でレイアウトジャンプ
ed39122 fix: スクロールが死んでいる問題解消 (globals.css)
2a7e259 fix: 予約画面ハング解消 (driver/berths の date → reservationDate)
d21555c fix: ドライバー各ページの /api/auth ループ解消
41a8c21 fix: TSエラー一括修正 + 厳格型チェック有効化
e6927a6 fix: ドライバー予約ログインのエラー解消
```

すべて本番反映済 (2026-04-23)。
