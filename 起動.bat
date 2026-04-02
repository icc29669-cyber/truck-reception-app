@echo off
cd /d %~dp0
echo 受付システムを起動します...

:: 初回のみ npm install
if not exist node_modules (
  echo パッケージをインストール中...
  npm install
)

:: ビルドがなければビルド
if not exist .next (
  echo ビルド中...
  npm run build
)

:: 起動
echo http://localhost:3001 で起動します
start "" "http://localhost:3001/kiosk"
npm start
