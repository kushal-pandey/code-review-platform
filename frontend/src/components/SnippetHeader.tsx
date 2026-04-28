import type { User, Snippet } from "../types";

interface Props {
  snippet: Snippet;
  connected: boolean;
  isRequestingAi: boolean;
  currentUser: User | null;
  onAskAi: () => void;
  onDelete: () => void;
}

export default function SnippetHeader({ snippet, connected, isRequestingAi, currentUser, onAskAi, onDelete }: Props) {
  return (
    <nav style={{ background: "#161b22", padding: "0 24px", height: "60px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #30363d" }}>
      <div>
        <span style={{ color: "#e6edf3", fontWeight: 600 }}>{snippet.title}</span>
        <span style={{ color: "#8b949e", fontSize: "0.8rem", display: "block" }}>by {snippet.author?.username}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={onAskAi} disabled={isRequestingAi} style={{ color: isRequestingAi ? "#8b949e" : "#a371f7", border: `1px solid ${isRequestingAi ? "#8b949e" : "#a371f7"}`, background: "transparent", padding: "4px 12px", borderRadius: "6px", cursor: isRequestingAi ? "wait" : "pointer" }}>
          {isRequestingAi ? "✨ Waking AI..." : "✨ Ask AI to Review"}
        </button>
        {currentUser?.id === snippet.author?.id && (
          <button onClick={onDelete} style={{ color: "#f85149", border: "1px solid #f85149", background: "transparent", padding: "4px 12px", borderRadius: "6px" }}>🗑️ Delete</button>
        )}
        <span style={{ background: "#1f6feb", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem" }}>{snippet.language}</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#2ea043" : "#f85149" }} />
      </div>
    </nav>
  );
}