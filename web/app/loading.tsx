export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #eff6ff, #eef2ff)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 80, height: 80,
          backgroundColor: "#3B82F6",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 12px 30px rgba(59,130,246,0.3)",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1E293B", letterSpacing: 1, marginBottom: 8 }}>
          RWATRACK
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>
          Loading your workspace...
        </p>

        <div style={{
          width: 32, height: 32, margin: "0 auto",
          border: "3px solid #E2E8F0",
          borderTopColor: "#3B82F6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />

        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    </div>
  );
}
