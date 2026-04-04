# 来場受付キオスク 画面遷移フロー資料

## 1. メインフロー（正常系）

```
[スタート画面]  →  [注意事項]  →  [電話番号入力]  →  [ドライバー選択]  →  [車両情報]  →  [最終確認]  →  [受付完了]
   /kiosk          /caution        /phone (Step1)    /person (Step2)    /vehicle (Step3)   /final-confirm     /complete
```

| # | 画面名 | パス | 使用目的 | 遷移先 |
|---|--------|------|----------|--------|
| 1 | スタート画面 | `/kiosk` | キオスク待機画面。タッチで受付開始 | → `/kiosk/caution` |
| 2 | 注意事項 | `/kiosk/caution` | 安全確認（場内ルール等） | → `/kiosk/phone` |
| 3 | 電話番号入力 | `/kiosk/phone` | 電話番号でドライバー検索（Step 1） | → `/kiosk/person`（通常）/ → `/kiosk/final-confirm`（編集戻り） |
| 4 | ドライバー選択 | `/kiosk/person` | 候補から選択 or 手入力（Step 2） | → `/kiosk/vehicle`（通常）/ → `/kiosk/final-confirm`（編集戻り） |
| 5 | 車両情報 | `/kiosk/vehicle` | ナンバー・最大積載量を入力（Step 3） | → `/kiosk/final-confirm` |
| 6 | 最終確認 | `/kiosk/final-confirm` | 全入力内容を確認＆修正（Step 4） | → `/kiosk/complete`（受付実行） |
| 7 | 受付完了 | `/kiosk/complete` | 受付番号表示。30秒後自動でスタートへ | → `/kiosk`（自動 or 手動） |

---

## 2. 各画面の詳細遷移

### 2-1. スタート画面 (`/kiosk`)
| 操作 | 遷移先 | 条件 |
|------|--------|------|
| 画面タッチ | `/kiosk/caution` | セッション初期化後 |

### 2-2. 注意事項 (`/kiosk/caution`)
| 操作 | 遷移先 | 条件 |
|------|--------|------|
| 「確認しました」ボタン | `/kiosk/phone` | なし |

### 2-3. 電話番号入力 (`/kiosk/phone`)
| 操作 | 遷移先 | 条件 |
|------|--------|------|
| OKボタン（通常） | `/kiosk/person` | `from` パラメータなし |
| OKボタン（編集戻り） | `/kiosk/final-confirm` | `?from=final-confirm` |
| 戻るボタン（通常） | `/kiosk/caution` | `from` パラメータなし |
| 戻るボタン（編集戻り） | `/kiosk/final-confirm` | `?from=final-confirm` |

**セッション操作:** 電話番号を `kiosk_session.phone` に保存

### 2-4. ドライバー選択 (`/kiosk/person`)
| 操作 | 遷移先 | 条件 |
|------|--------|------|
| 候補選択（通常） | `/kiosk/vehicle` | `from` パラメータなし |
| 候補選択（編集戻り） | `/kiosk/final-confirm` | `?from=final-confirm` |
| 手入力完了（通常） | `/kiosk/vehicle` | `from` パラメータなし |
| 手入力完了（編集戻り） | `/kiosk/final-confirm` | `?from=final-confirm` |
| 戻るボタン（通常） | `/kiosk/phone` | `from` パラメータなし |
| 戻るボタン（編集戻り） | `/kiosk/final-confirm` | `?from=final-confirm` |

**クエリパラメータ:**
- `?from=final-confirm` — 最終確認からの編集フロー
- `&field=company` — 会社名の編集モードで開く
- `&field=name` — ドライバー名の編集モードで開く

**セッション操作:** `selectedDriver`, `driverInput` (companyName, driverName) を保存

### 2-5. 車両情報 (`/kiosk/vehicle`)
| 操作 | 遷移先 | 条件 |
|------|--------|------|
| 候補選択 | `/kiosk/final-confirm` | 常に同じ（※冗長な三項演算子） |
| 手入力完了 | `/kiosk/final-confirm` | 常に同じ（※冗長な三項演算子） |
| 戻るボタン（通常） | `/kiosk/person` | `from` パラメータなし |
| 戻るボタン（編集戻り） | `/kiosk/final-confirm` | `?from=final-confirm` |

**クエリパラメータ:**
- `?from=final-confirm` — 最終確認からの編集フロー
- `&section=region` — 地域名の編集
- `&section=classNum` — 分類番号の編集
- `&section=hira` — ひらがなの編集
- `&section=number` — 一連番号の編集
- `&section=maxload` — 最大積載量の編集

**セッション操作:** `selectedVehicle`, `plate`, `driverInput.maxLoad` を保存

### 2-6. 最終確認 (`/kiosk/final-confirm`)
| 操作 | 遷移先 | 備考 |
|------|--------|------|
| 「受付する」ボタン | `/kiosk/complete` | API送信成功後 |
| 戻るボタン | `/kiosk/vehicle` | 車両情報へ戻る |
| 電話番号「修正」 | `/kiosk/phone?from=final-confirm` | 電話番号編集 |
| 会社名「修正」 | `/kiosk/person?from=final-confirm&field=company` | 会社名編集 |
| ドライバー名「修正」 | `/kiosk/person?from=final-confirm&field=name` | 氏名編集 |
| ナンバープレートタップ | `/kiosk/vehicle?section={部位}&from=final-confirm` | 該当部位の編集 |
| 最大積載量「修正」 | `/kiosk/vehicle?section=maxload&from=final-confirm` | 積載量編集 |

**セッション操作:** `receptionResult` を保存（API応答）

### 2-7. 受付完了 (`/kiosk/complete`)
| 操作 | 遷移先 | 条件 |
|------|--------|------|
| 「トップへ戻る」ボタン | `/kiosk` | セッションクリア |
| 30秒カウントダウン | `/kiosk` | 自動遷移、セッションクリア |
| セッションなし | `/kiosk` | `receptionResult` がない場合 `replace` |

---

## 3. 編集ループ（最終確認 → 各入力画面 → 最終確認）

最終確認画面から各項目を修正する場合の遷移パターン:

```
                    ┌─── 電話番号修正 ──→ /phone?from=final-confirm ───┐
                    │                                                   │
                    ├─── 会社名修正 ───→ /person?from=final-confirm ──┤
                    │                     &field=company                │
                    │                                                   │
/final-confirm ────├─── 氏名修正 ────→ /person?from=final-confirm ──├──→ /final-confirm
                    │                     &field=name                   │
                    │                                                   │
                    ├─── ナンバー修正 ─→ /vehicle?section=XXX ────────┤
                    │                     &from=final-confirm           │
                    │                                                   │
                    └─── 積載量修正 ───→ /vehicle?section=maxload ────┘
                                          &from=final-confirm
```

**ポイント:** `?from=final-confirm` パラメータにより、各入力画面は通常フローではなく最終確認への直接戻りモードで動作する。

---

## 4. セッションデータ（sessionStorage）

キー: `kiosk_session`

| フィールド | 型 | 書込み画面 | 読込み画面 |
|-----------|-----|-----------|-----------|
| `centerId` | number | (初期値: 1) | final-confirm |
| `centerName` | string | (初期値: "") | final-confirm |
| `phone` | string | phone | final-confirm, person |
| `plate.region` | string | vehicle | final-confirm |
| `plate.classNum` | string | vehicle | final-confirm |
| `plate.hira` | string | vehicle | final-confirm |
| `plate.number` | string | vehicle | final-confirm |
| `driverInput.companyName` | string | person | final-confirm |
| `driverInput.driverName` | string | person | final-confirm |
| `driverInput.phone` | string | person | final-confirm |
| `driverInput.maxLoad` | string | vehicle | final-confirm |
| `driverCandidates` | array | person | person |
| `selectedDriver` | object\|null | person | final-confirm |
| `vehicleCandidates` | array | vehicle | vehicle |
| `selectedVehicle` | object\|null | vehicle | final-confirm |
| `receptionResult` | object\|null | final-confirm | complete |

---

## 5. ガード（未入力時の挙動）

| 画面 | ガード条件 | 挙動 |
|------|-----------|------|
| `/kiosk/complete` | `receptionResult` なし | `/kiosk` へ `replace` |
| `/kiosk/final-confirm` | StepDots で未完了ステップを表示 | 遷移はブロックしない（受付ボタン押下時にAPI側でバリデーション） |

---

## 6. レガシーページ（リダイレクト）

以下のページは旧フローの残存で、即座にリダイレクトされる:

| パス | リダイレクト先 | 備考 |
|------|---------------|------|
| `/kiosk/driver-input` | `/kiosk/name-input` | `replace` |
| `/kiosk/confirm` | `/kiosk/final-confirm` | `replace` |
| `/kiosk/plate/region` | `/kiosk/plate/kana` | `replace` |
| `/kiosk/plate/confirm` | `/kiosk/vehicle-select` | `replace` |

---

## 7. フロー図（全体像）

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  スタート  │───→│  注意事項  │───→│ 電話番号   │───→│ドライバー │───→│  車両情報  │───→│  最終確認  │───→│  受付完了  │
│  /kiosk   │    │ /caution  │    │  /phone   │    │ /person   │    │ /vehicle  │    │/final-    │    │ /complete │
│           │    │           │    │  Step 1   │    │  Step 2   │    │  Step 3   │    │ confirm   │    │           │
└──────────┘    └──────────┘    └────┬──────┘    └────┬──────┘    └────┬──────┘    │  Step 4   │    └─────┬────┘
       ↑                              │  ↑             │  ↑             │  ↑        └─────┬────┘          │
       │                              │  │             │  │             │  │              │               │
       │                              │  └─────────────┼──┼─────────────┼──┼── 修正ボタン ─┘               │
       │                              │                │  └─────────────┼──┼── 修正ボタン ─┘               │
       │                              │                │                │  └── 修正ボタン ─┘               │
       │                              │                │                │                                 │
       └──────────────────────────────┼────────────────┼────────────────┼──── 30秒自動 or 手動 ───────────┘
                                      │                │                │
                                      └── 戻る ────────┘── 戻る ────────┘
```

---

*作成日: 2026-04-04*
*対象: truck-reception-app キオスクフロー*
