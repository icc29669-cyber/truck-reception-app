@echo off
chcp 65001 > nul
cd /d %~dp0

echo ================================
echo  来場受付システム 起動
echo ================================
echo.

:: ポータブル Node.js のパスを追加
set "NODE_HOME=C:\Users\1219\node"
set "PATH=%NODE_HOME%;%PATH%"

:: Node.js の確認
where node >nul 2>&1
if errorlevel 1 (
  echo [エラー] Node.js が見つかりません。
  echo C:\Users\1219\node フォルダを確認してください。
  echo.
  pause
  exit /b 1
)

echo Node.js バージョン:
node -v
echo npm バージョン:
npm -v
echo.

:: 初回のみ npm install
if not exist node_modules (
  echo パッケージをインストール中...
  npm install
  if errorlevel 1 (
    echo [エラー] npm install に失敗しました
    pause
    exit /b 1
  )
)

:: ビルドがなければビルド
if not exist .next (
  echo ビルド中（数分かかります）...
  npm run build
  if errorlevel 1 (
    echo [エラー] ビルドに失敗しました
    pause
    exit /b 1
  )
)

echo.
echo ブラウザで http://localhost:3001 を開いてください
echo 終了するには このウィンドウを閉じてください
echo.
start "" "http://localhost:3001/kiosk"
npm start
pause
