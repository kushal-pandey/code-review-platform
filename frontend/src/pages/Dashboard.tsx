import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Snippet {
  id: number;
  title: string;
  language: string;
  author: { username: string; avatarUrl: string };
  createdAt: string;
  comments: unknown[];
}

interface User {
  username: string;
  avatarUrl: string;
}

const LANG_COLORS: Record<string, string> = {
  java: "#b07219",
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572A5",
  cpp: "#f34b7d",
  go: "#00ADD8",
  rust: "#dea584",
};

export default function Dashboard() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Add /api to the auth call
    api
      .get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("Auth Me failed:", err);
      });

    // 2. Add /api to the snippets call
    api
      .get("/snippets")
      .then((res) => setSnippets(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Snippets failed:", err));
  }, []); // Empty dependency array is safer here

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{ background: "#0d1117", minHeight: "100vh", color: "#e6edf3" }}
    >
      {/* Navbar */}
      <nav
        style={{
          background: "#161b22",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #30363d",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <h2 style={{ margin: 0, color: "#58a6ff", letterSpacing: "-0.5px" }}>
          🔍 CodeReview
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user && (
            <>
              <img
                src={user.avatarUrl}
                alt={user.username}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid #30363d",
                }}
              />
              <span style={{ color: "#c9d1d9" }}>{user.username}</span>
            </>
          )}
          <button
            onClick={() => navigate("/create")}
            style={{
              padding: "7px 16px",
              background: "#238636",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + New Snippet
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "7px 14px",
              background: "transparent",
              color: "#8b949e",
              border: "1px solid #30363d",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div
        style={{ maxWidth: "860px", margin: "32px auto", padding: "0 24px" }}
      >
        <h3 style={{ color: "#8b949e", fontWeight: 400, marginBottom: "20px" }}>
          {snippets.length} code snippet{snippets.length !== 1 ? "s" : ""}
        </h3>

        {snippets.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              background: "#161b22",
              border: "1px dashed #30363d",
              borderRadius: "12px",
              color: "#8b949e",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📝</div>
            <p>No snippets yet. Post the first one!</p>
          </div>
        )}

        {snippets.map((snippet) => (
          <div
            key={snippet.id}
            onClick={() => navigate(`/snippet/${snippet.id}`)}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "10px",
              padding: "18px 20px",
              marginBottom: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#58a6ff";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4 style={{ margin: 0, color: "#e6edf3", fontSize: "1rem" }}>
                {snippet.title}
              </h4>
              <span
                style={{
                  background: LANG_COLORS[snippet.language] || "#6e7681",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  color: "#0d1117",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {snippet.language}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
                color: "#8b949e",
                fontSize: "0.85rem",
              }}
            >
              {snippet.author?.avatarUrl && (
                <img
                  src={snippet.author.avatarUrl}
                  alt=""
                  style={{ width: 20, height: 20, borderRadius: "50%" }}
                />
              )}
              <span>{snippet.author?.username}</span>
              <span>•</span>
              <span>
                {new Date(snippet.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span>💬 {snippet.comments?.length || 0} comments</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
