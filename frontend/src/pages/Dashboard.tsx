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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const mySnippets = snippets.filter(
    (s) => s.author.username === user?.username,
  );

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
      .get("/api/snippets")
      .then((res) => setSnippets(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Snippets failed:", err));
  }, []); // Empty dependency array is safer here

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleToggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedIds) => selectedIds !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === mySnippets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mySnippets.map((s) => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} snippet(s)?`,
      )
    )
      return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/snippets/batch?ids=${selectedIds.join(",")}`);

      setSnippets((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete snippets.");
    } finally {
      setIsDeleting(false);
    }
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#8b949e", fontWeight: 400, margin: 0 }}>
            {snippets.length} code snippet{snippets.length !== 1 ? "s" : ""}
          </h3>

          {/* Only show bulk actions if the user actually has snippets they own */}
          {mySnippets.length > 0 && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={handleSelectAll}
                style={{
                  background: "transparent",
                  color: "#58a6ff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {selectedIds.length === mySnippets.length
                  ? "Deselect All"
                  : "Select All My Snippets"}
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  style={{
                    background: "#da3633",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  {isDeleting
                    ? "Deleting..."
                    : `Delete Selected (${selectedIds.length})`}
                </button>
              )}
            </div>
          )}
        </div>

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
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {/* Checkbox: Only visible if the logged-in user owns this snippet */}
                {user?.username === snippet.author.username && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(snippet.id)}
                    onClick={(e) => handleToggleSelect(snippet.id, e)}
                    style={{
                      cursor: "pointer",
                      width: "16px",
                      height: "16px",
                      accentColor: "#da3633",
                    }}
                  />
                )}
                <h4 style={{ margin: 0, color: "#e6edf3", fontSize: "1rem" }}>
                  {snippet.title}
                </h4>
              </div>

              {/* Your existing language tag span goes right here... */}
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
