import InAppBrowserBanner from "@/components/InAppBrowserBanner";

export const metadata = {
  title: "機材センター受付予約システム",
  description: "日本セイフティー株式会社 機材センター受付予約システム",
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-warm min-h-screen" style={{ background: "#f2f1ed", color: "#26251e" }}>
      <InAppBrowserBanner />
      {children}
    </div>
  );
}
