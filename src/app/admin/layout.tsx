export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ colorScheme: "light", minHeight: "100vh", overflow: "auto" }}>
      {children}
    </div>
  );
}
