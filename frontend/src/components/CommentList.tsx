// If types.ts is in the src folder
import type { Comment } from "../types";

export default function CommentList({
  comments,
  commentsEndRef,
  renderMessageContent,
}: {
  comments: Comment[];
  commentsEndRef: any;
  renderMessageContent: (content: string) => React.ReactNode; // <-- 2. Add the type here
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
      {comments.map((comment, index) => (
        <div
          key={comment.id || `ai-${index}`}
          style={{
            background: comment.isAi ? "#160f24" : "#0d1117",
            border: comment.isAi ? "1px solid #a371f7" : "1px solid #30363d",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: comment.isAi ? "#a371f7" : "#e6edf3",
              }}
            >
              {comment.isAi ? comment.sender : comment.author?.username}
            </span>
            <span style={{ color: "#8b949e", fontSize: "0.7rem" }}>
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleTimeString()
                : "Just now"}
            </span>
          </div>
          <div
            className="markdown-content"
            style={{
              fontSize: "0.875rem",
              color: "#c9d1d9",
              lineHeight: 1.5,
              maxWidth: "100%",
              overflowX: "auto",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {comment.isAi ? (
              renderMessageContent(comment.content)
            ) : (
              <p>{comment.content}</p>
            )}
          </div>
        </div>
      ))}
      <div ref={commentsEndRef} />
    </div>
  );
}
