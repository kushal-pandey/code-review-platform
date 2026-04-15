import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  avatarUrl: string;
}

interface Comment {
  id: number;
  content: string;
  lineNumber?: number;
  author: User;
  createdAt: string;
}

interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  author: User;
  comments: Comment[];
}

export default function SnippetView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [lineNumber, setLineNumber] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setCurrentUser(res.data))
      .catch(() => navigate("/login"));
    api.get(`/snippets/${id}`).then((res) => {
      setSnippet(res.data);
      setComments(res.data.comments || []);
    });
  }, [id, navigate]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_WS_URL}/ws`) as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/snippet/${id}`, (message) => {
          const comment: Comment = JSON.parse(message.body);
          setComments((prev) => {
            const exists = prev.some((c) => c.id === comment.id);
            return exists ? prev : [...prev, comment];
          });
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    stompClientRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSendComment = () => {
    if (
      !newComment.trim() ||
      !currentUser ||
      !stompClientRef.current?.connected
    )
      return;
    stompClientRef.current.publish({
      destination: `/app/comment/${id}`,
      body: JSON.stringify({
        content: newComment.trim(),
        lineNumber: lineNumber ? parseInt(lineNumber) : null,
        userId: currentUser.id,
      }),
    });
    setNewComment("");
    setLineNumber("");
  };

  if (!snippet) {
    return (
      <div
        style={{
          color: "#e6edf3",
          textAlign: "center",
          marginTop: 100,
          background: "#0d1117",
          height: "100vh",
        }}
      >
        <div style={{ fontSize: "2rem" }}>⏳</div>
        <p style={{ marginTop: 12, color: "#8b949e" }}>Loading snippet...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0d1117",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "#e6edf3",
      }}
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
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#58a6ff",
            cursor: "pointer",
            fontSize: "1.1rem",
          }}
          onClick={() => navigate("/")}
        >
          ← CodeReview
        </h2>
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#e6edf3", fontWeight: 600 }}>
            {snippet.title}
          </span>
          <span
            style={{ color: "#8b949e", fontSize: "0.8rem", display: "block" }}
          >
            by {snippet.author?.username}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              background: "#1f6feb",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {snippet.language}
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#2ea043" : "#f85149",
              display: "inline-block",
            }}
            title={connected ? "Live" : "Reconnecting..."}
          />
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Code Editor (read-only) */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Editor
            height="100%"
            language={snippet.language}
            value={snippet.code}
            theme="vs-dark"
            options={{
              fontSize: 14,
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Comment Panel */}
        <div
          style={{
            width: "360px",
            display: "flex",
            flexDirection: "column",
            background: "#161b22",
            borderLeft: "1px solid #30363d",
            flexShrink: 0,
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #30363d",
              flexShrink: 0,
            }}
          >
            <h4 style={{ margin: 0, color: "#e6edf3" }}>
              💬 Discussion
              <span
                style={{
                  marginLeft: 8,
                  background: "#30363d",
                  color: "#8b949e",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: 400,
                }}
              >
                {comments.length}
              </span>
            </h4>
          </div>

          {/* Comments List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {comments.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8b949e",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: "0.875rem" }}>
                  No comments yet.
                  <br />
                  Start the code review!
                </p>
              </div>
            )}

            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  background: "#0d1117",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "10px",
                  border: "1px solid #30363d",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {comment.author?.avatarUrl && (
                    <img
                      src={comment.author.avatarUrl}
                      alt=""
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: "#e6edf3",
                      }}
                    >
                      {comment.author?.username}
                    </span>
                    {comment.lineNumber && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: "#1f6feb22",
                          color: "#58a6ff",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          border: "1px solid #1f6feb44",
                        }}
                      >
                        Line {comment.lineNumber}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      color: "#8b949e",
                      fontSize: "0.7rem",
                      flexShrink: 0,
                    }}
                  >
                    {new Date(comment.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "#c9d1d9",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {comment.content}
                </p>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <div
            style={{
              padding: "14px",
              borderTop: "1px solid #30363d",
              flexShrink: 0,
            }}
          >
            <input
              type="number"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              placeholder="Line number (optional)"
              min={1}
              style={{
                width: "100%",
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#e6edf3",
                marginBottom: "8px",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment... (Ctrl+Enter to send)"
              rows={3}
              style={{
                width: "100%",
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: "6px",
                padding: "10px 12px",
                color: "#e6edf3",
                resize: "none",
                marginBottom: "8px",
                fontSize: "0.875rem",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#58a6ff")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#30363d")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleSendComment();
              }}
            />
            <button
              onClick={handleSendComment}
              disabled={!newComment.trim() || !connected}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                cursor:
                  newComment.trim() && connected ? "pointer" : "not-allowed",
                background:
                  newComment.trim() && connected ? "#238636" : "#21262d",
                color: newComment.trim() && connected ? "white" : "#8b949e",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.15s",
              }}
            >
              {connected ? "💬 Send Comment" : "⚡ Connecting..."}
            </button>

            <button
              onClick={() => navigator.clipboard.writeText(snippet.code)}
              style={{
                padding: "6px 14px",
                background: "#238636",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Copy code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
