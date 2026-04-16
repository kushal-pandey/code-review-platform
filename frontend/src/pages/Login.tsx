export default function Login() {
  const handleLogin = () => {
    // If the URL in the browser bar isn't localhost, we are in production
    const isProduction = window.location.hostname !== "localhost";

    // Use Render for production, Localhost for dev
    // REPLACE the URL below with your actual Render backend URL
    const backendUrl = isProduction
      ? "https://codereview-backend-4fp2.onrender.com"
      : import.meta.env.VITE_API_URL || "http://localhost:8080";

    console.log("Redirecting to Backend Auth:", backendUrl);
    window.location.href = `${backendUrl}/oauth2/authorization/github`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0d1117",
      }}
    >
      <div
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "48px",
          textAlign: "center",
          maxWidth: "400px",
          width: "90%",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
        <h1 style={{ color: "#e6edf3", fontSize: "2rem", marginBottom: "8px" }}>
          CodeReview
        </h1>
        <p style={{ color: "#8b949e", marginBottom: "32px", lineHeight: 1.6 }}>
          Real-time collaborative code reviews.
          <br />
          Share code. Get instant feedback.
        </p>
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: "#238636",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#2ea043")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#238636")}
        >
          🐙 Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
