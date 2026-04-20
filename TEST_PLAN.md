# truck-reception-app — 動作テストプラン

## Base URL
- local: http://localhost:3000
- prod: https://truck-reception-app.vercel.app

## API Smoke

### 1. register — Origin なし(別オリジン扱い) → 403
```bash
# expect: status 403
curl -s -o /dev/null -w "%{http_code}" -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil.example.com" \
  -d '{"phone":"09011112222","centerId":1}'
```

### 2. register — 壊れた JSON → 400
```bash
# expect: status 400
# expect: contains "形式が不正"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d 'NOT_JSON'
```

### 3. register — 空 phone → 400
```bash
# expect: status 400
# expect: contains "電話番号"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"","centerId":1}'
```

### 4. register — 電話番号形式不正(英字混在)→ 400
```bash
# expect: status 400
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"090ABCD1234","centerId":1}'
```

### 5. register — センターID 不正(0)→ 400
```bash
# expect: status 400
# expect: contains "センター"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"09011112222","centerId":0}'
```

### 6. register — 存在しないセンターID → 400
```bash
# expect: status 400
# expect: contains "存在しません"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"09011112222","centerId":99999}'
```

### 7. register — 会社名が長すぎる → 400
```bash
# expect: status 400
# expect: contains "会社名"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"09011112222","centerId":1,"driverInput":{"companyName":"あ","driverName":"","phone":"","maxLoad":""}}'
```

### 8. register — ドライバー名が長すぎる → 400
```bash
# expect: status 400
# expect: contains "名前"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"09011112222","centerId":1,"driverInput":{"driverName":"あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"}}'
```

### 9. register — 車両番号(plate.number) 英字混在 → 400
```bash
# expect: status 400
# expect: contains "車両番号"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"09011112222","centerId":1,"plate":{"region":"品川","classNum":"500","hira":"あ","number":"AB12"}}'
```

### 10. register — 正常入力 → 200 + 受付番号
```bash
# expect: status 200
# expect: contains "receptionNo"
# expect: contains "岸和田"
curl -s -X POST "https://truck-reception-app.vercel.app/api/reception/register" \
  -H "Content-Type: application/json" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app" \
  -d '{"phone":"09099990001","centerId":1,"plate":{"region":"品川","classNum":"500","hira":"あ","number":"1001"},"driverInput":{"companyName":"E2E テスト1","driverName":"テスト太郎","phone":"09099990001","maxLoad":"2000"}}'
```

### 11. lookup-phone — Origin なし → 403
```bash
# expect: status 403
curl -s -o /dev/null -w "%{http_code}" "https://truck-reception-app.vercel.app/api/reception/lookup-phone?phone=09011112222&centerId=1" \
  -H "Origin: https://evil.example.com"
```

### 12. lookup-phone — 空 phone → 400
```bash
# expect: status 400
curl -s -X GET "https://truck-reception-app.vercel.app/api/reception/lookup-phone?phone=&centerId=1" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app"
```

### 13. lookup-phone — 正常(結果なしでもOK)→ 200
```bash
# expect: status 200
curl -s -o /dev/null -w "%{http_code}" "https://truck-reception-app.vercel.app/api/reception/lookup-phone?phone=00000000000&centerId=1" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app"
```

### 14. lookup-reservation — 正常(結果なしでもOK)→ 200
```bash
# expect: status 200
curl -s -o /dev/null -w "%{http_code}" "https://truck-reception-app.vercel.app/api/reception/lookup-reservation?phone=00000000000&centerId=1" \
  -H "sec-fetch-site: same-origin" \
  -H "Origin: https://truck-reception-app.vercel.app"
```

### 15. 存在しないエンドポイント → 404
```bash
# expect: status 404
curl -s -o /dev/null -w "%{http_code}" "https://truck-reception-app.vercel.app/api/nonexistent"
```

### 16. キオスクトップ HTML
```bash
# expect: status 200
curl -s -o /dev/null -w "%{http_code}" "https://truck-reception-app.vercel.app/kiosk"
```

> **PWA リソース**: 本アプリはキオスク端末前提で PWA 化していない(manifest.json / sw.js / icon-*.png は公開していない)。
> PWA 対応が必要になったら berth-app 側の public/ を参考に追加する。

## Browser E2E

### キオスクトップ描画
1. ナビゲート: https://truck-reception-app.vercel.app/kiosk
2. 期待: 電話番号入力の大きなボタン UI が描画される / コンソールエラーなし
