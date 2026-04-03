/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // src/generated/prisma は除外（大きな生成ファイルがTailwindのスキャンをクラッシュさせる）
  ],
  theme: {
    extend: {
      colors: {
        kb: {
          bg:      "#EBF2FA",
          header:  "#0D2B4E",
          input:   "#FFF176",
          plate:   "#1B5E20",
          danger:  "#C62828",
          primary: "#1565C0",
          success: "#2E7D32",
          key:     "#FFFFFF",
          del:     "#FFCCBC",
          accent:  "#FF6F00",
          confirm: "#F3F8FF",
        },
      },
      fontSize: {
        "k-sm":   ["24px", { lineHeight: "32px" }],
        "k-base": ["32px", { lineHeight: "44px" }],
        "k-lg":   ["36px", { lineHeight: "48px" }],
        "k-xl":   ["40px", { lineHeight: "52px" }],
        "k-2xl":  ["48px", { lineHeight: "60px" }],
        "k-3xl":  ["56px", { lineHeight: "68px" }],
        "k-4xl":  ["64px", { lineHeight: "76px" }],
        "k-5xl":  ["72px", { lineHeight: "84px" }],
        "k-6xl":  ["88px", { lineHeight: "100px" }],
      },
    },
  },
  plugins: [],
};
