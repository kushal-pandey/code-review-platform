import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Client } from "@stomp/stompjs";
import api from "../api/axios";
import SockJS from "sockjs-client/dist/sockjs";
// ✅ This tells TypeScript these are JUST types

// Import your new components
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

  // Keep your useEffects and Handlers (Logic) here for now
  useEffect(() => {
    const initializePage = async () => {
      try {
        // 🚀 This fires both requests at the exact same time
        const [userRes, snippetRes] = await Promise.all([
          api.get("/api/auth/me"),
          api.get(`/api/snippets/${id}`),
        ]);

        setCurrentUser(userRes.data);
        setSnippet(snippetRes.data);
        setComments(snippetRes.data.comments || []);
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
        setConnected(true); // ✅ This removes the yellow underline!
        client.subscribe(`/topic/snippets/${id}`, (msg) => {
          const comment = JSON.parse(msg.body);
          setComments((prev) => {
            if (comment.id && prev.some((c) => c.id === comment.id))
              return prev;
            if (!comment.id && prev.some((c) => c.content === comment.content))
              return prev;
            return [...prev, comment];
          });
          if (comment.isAi && !comment.content.includes("Analyzing")) {
            setIsRequestingAi(false);
          }
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
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            language={snippet.language}
            value={snippet.code}
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
          <CommentList comments={comments} commentsEndRef={commentsEndRef} />
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
