import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/axios";

const LANGUAGES = [
  "javascript",
  "typescript",
  "java",
  "python",
  "cpp",
  "go",
  "rust",
  "csharp",
  "php",
  "swift",
];

export default function CreateSnippet() {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Write your code here...\n");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    
    if (!title.trim() || !code.trim()) {
      alert("Please fill in the title and code.");
      return;
    }
    setLoading(true);
    try {
      // Add the /api prefix here to match your Backend @RequestMapping
      const res = await api.post("/api/snippets", { title, code, language });
      navigate(`/snippet/${res.data.id}`);
    } catch (err) {
      console.error("Publishing error details:", err); // Log the actual error for debugging
      alert("Error publishing snippet. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#0d1117",
        minHeight: "100vh",
        color: "#e6edf3",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <nav
        style={{
          background: "#161b22",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #30363d",
        }}
      >
        <h2
          style={{ margin: 0, color: "#58a6ff", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          🔍 CodeReview
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "7px 14px",
              background: "transparent",
              color: "#8b949e",
              border: "1px solid #30363d",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "7px 20px",
              background: loading ? "#1a7f37" : "#238636",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Publishing..." : "🚀 Publish Snippet"}
          </button>
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: "1000px",
          width: "100%",
          margin: "24px auto",
          padding: "0 24px",
          boxSizing: "border-box",
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your snippet a descriptive title..."
          style={{
            width: "100%",
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "8px",
            padding: "14px 16px",
            color: "#e6edf3",
            fontSize: "1.2rem",
            marginBottom: "14px",
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#58a6ff")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#30363d")}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <label style={{ color: "#8b949e", fontSize: "0.875rem" }}>
            Language:
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "6px",
              padding: "8px 12px",
              color: "#e6edf3",
              cursor: "pointer",
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            border: "1px solid #30363d",
            borderRadius: "10px",
            overflow: "hidden",
            flex: 1,
            minHeight: "500px",
          }}
        >
          <Editor
            height="500px"
            language={language}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
