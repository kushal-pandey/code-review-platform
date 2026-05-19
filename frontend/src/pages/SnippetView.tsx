import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Client } from "@stomp/stompjs";
import api from "../api/axios";
import SockJS from "sockjs-client/dist/sockjs";
import SnippetHeader from "../components/SnippetHeader";
import CommentList from "../components/CommentList";
import CommentInput from "../components/CommentInput";

export default function SnippetView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [lineNumber, setLineNumber] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [isRequestingAi, setIsRequestingAi] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [editorCode, setEditorCode] = useState<string>("");

  useEffect(() => {
    const initializePage = async () => {
      try {
        const [userRes, snippetRes] = await Promise.all([
          api.get("/api/auth/me"),
          api.get(`/api/snippets/${id}`),
        ]);

        setCurrentUser(userRes.data);
        setSnippet(snippetRes.data);
        setComments(snippetRes.data.comments || []);
        setEditorCode(snippetRes.data.code);
      } catch (err) {
        console.error("Initialization failed:", err);
        navigate("/login");
      }
    };

    initializePage();
  }, [id, navigate]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_WS_URL}/ws`) as WebSocket,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/snippets/${id}`, (msg) => {
          const comment = JSON.parse(msg.body);

          setComments((prev) => {
            let updatedComments = prev;
            const isPlaceholder =
              comment.isAi && comment.content.includes("Analyzing");
            const isRealReview =
              comment.isAi && !comment.content.includes("Analyzing");

            // 1. If it's a real review, clear out the Analyzing placeholders
            if (isRealReview) {
              updatedComments = prev.filter(
                (c) => !(c.isAi && c.content.includes("Analyzing")),
              );
            }

            // 2. NEW: If it's a placeholder, but we ALREADY have one, ignore it
            if (
              isPlaceholder &&
              prev.some((c) => c.isAi && c.content.includes("Analyzing"))
            ) {
              return prev;
            }

            // 3. Standard deduplication
            if (comment.id && updatedComments.some((c) => c.id === comment.id))
              return updatedComments;
            if (
              !comment.id &&
              updatedComments.some((c) => c.content === comment.content)
            )
              return updatedComments;

            return [...updatedComments, comment];
          });

          if (comment.isAi && !comment.content.includes("Analyzing")) {
            setIsRequestingAi(false);
          }
        });

        client.subscribe(`/topic/snippets/${id}/presence`, (msg) => {
          setViewerCount(parseInt(msg.body, 10));
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

  const handleAskAi = async (retryCount = 0) => {
    setIsRequestingAi(true);
    try {
      await api.post(`/api/snippets/${id}/review`);
    } catch (err: any) {
      if (err.response?.status === 503 && retryCount < 1) {
        setTimeout(() => handleAskAi(retryCount + 1), 2000);
        return;
      }
      setIsRequestingAi(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/api/snippets/${id}`);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportMarkdown = () => {
    const aiComments = comments.filter(
      (c) => c.isAi && !c.content.includes("Analyzing"),
    );

    if (aiComments.length === 0) {
      alert("No AI reviews available to export yet!");
      return;
    }

    const reviewText = aiComments.map((c) => c.content).join("\n\n---\n\n");

    const blob = new Blob([reviewText], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const fileName = snippet?.title
      ? `${snippet.title.replace(/\s+/g, "-").toLowerCase()}-review.md`
      : "code-review.md";

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatMarkdown = (rawText: string) => {
    let safeText = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return safeText
      .replace(
        /^### (.*$)/gim,
        '<h3 style="margin: 0 0 8px 0; font-size: 14px; color: #ffffff;">$1</h3>',
      )
      .replace(
        /^#### (.*$)/gim,
        '<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #e6edf3;">$1</h4>',
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff;">$1</strong>')
      .replace(
        /`([^`\n]+)`/g,
        '<code style="background: rgba(110, 118, 129, 0.4); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #e6edf3;">$1</code>',
      )
      .replace(
        /^\* (.*$)/gim,
        '<div style="display: flex; gap: 8px;"><span style="color: #a371f7;">•</span><span>$1</span></div>',
      );
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.split("\n");
        const language = lines[0].replace("```", "").trim();
        const actualCode = lines.slice(1, -1).join("\n");

        return (
          <div
            key={index}
            style={{
              margin: "12px 0",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #30363d",
              width: "100%",
              boxSizing: "border-box", 
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#161b22",
                padding: "8px 12px",
                borderBottom: "1px solid #30363d",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#8b949e",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                }}
              >
                {language || "code"}
              </span>
              <button
                onClick={() => {
                  setEditorCode(actualCode);
                  console.log("Code Applied!");
                }}
                style={{
                  background: "rgba(35, 134, 54, 0.2)",
                  color: "#3fb950",
                  border: "1px solid rgba(63, 185, 80, 0.4)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ⚡ Apply Fix
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: "12px",
                background: "#0d1117",
                overflowX: "auto",
                fontSize: "12px",
                color: "#e6edf3",
                maxWidth: "100%",
              }}
            >
              <code>{actualCode}</code>
            </pre>
          </div>
        );
      }

      // REPLACE IT WITH THIS NEW VERSION
      return (
        <div
          key={index}
          style={{
            whiteSpace: "pre-wrap",
            marginBottom: "12px",
            lineHeight: "1.6",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            width: "100%",
            boxSizing: "border-box",
          }}
          dangerouslySetInnerHTML={{ __html: formatMarkdown(part.trim()) }}
        />
      );
    });
  };

  if (!snippet)
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: 100 }}>
        Loading...
      </div>
    );

  return (
    <div
      style={{
        background: "#0d1117",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SnippetHeader
        snippet={snippet}
        connected={connected}
        isRequestingAi={isRequestingAi}
        currentUser={currentUser}
        onAskAi={() => handleAskAi()}
        onDelete={handleDelete}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* WE ADDED FLEX COLUMN HERE SO THE EDITOR DOESN'T OVERFLOW */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* NEW PRESENCE BADGE START */}
          <div
            style={{
              padding: "8px 16px",
              background: "#161b22",
              borderBottom: "1px solid #30363d",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#8b949e",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#238636",
                }}
              ></div>
              {viewerCount} {viewerCount === 1 ? "person" : "people"} viewing
              right now
            </span>
          </div>
          {/* NEW PRESENCE BADGE END */}

          <Editor
            height="100%"
            language={snippet.language}
            value={editorCode}
            theme="vs-dark"
            options={{ readOnly: true }}
          />
        </div>

        <div
          style={{
            width: "360px",
            display: "flex",
            flexDirection: "column",
            background: "#161b22",
            borderLeft: "1px solid #30363d",
          }}
        >
          {/* NEW EXPORT HEADER START */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid #30363d",
            }}
          >
            <span
              style={{ color: "white", fontSize: "14px", fontWeight: "600" }}
            >
              Discussions
            </span>
            <button
              onClick={handleExportMarkdown}
              style={{
                background: "#238636", // GitHub green button
                color: "white",
                border: "none",
                padding: "4px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              ↓ Export .md
            </button>
          </div>
          {/* NEW EXPORT HEADER END */}

          <CommentList
            comments={comments}
            renderMessageContent={renderMessageContent}
          />
          <CommentInput
            newComment={newComment}
            setNewComment={setNewComment}
            lineNumber={lineNumber}
            setLineNumber={setLineNumber}
            onSend={handleSendComment}
            disabled={!connected}
          />
        </div>
      </div>
    </div>
  );
}
