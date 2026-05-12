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
            gap: "12px", // Space between icon and text
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#2ea043")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#238636")}
        >
          <svg
            height="20"
            width="20"
            viewBox="0 0 16 16"
            fill="white"
            style={{ display: "block" }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
