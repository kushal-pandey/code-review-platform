import type { Comment } from "../types";

export default function CommentList({
  comments,
  commentsEndRef,
  renderMessageContent,
}: {
  comments: Comment[];
  commentsEndRef: any;
  renderMessageContent: (content: string) => React.ReactNode;
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
            display: "flex", // Added flex to put DP beside content
            gap: "12px",
          }}
        >
          {/* 1. Profile Picture Section */}
          {!comment.isAi && (
            <img
              src={
                comment.author?.avatarUrl ||
                "https://github.com/identicons/jasonlong.png"
              }
              alt="avatar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid #30363d",
                marginTop: "2px",
              }}
            />
          )}
          {/* AI Icon Fallback if you want one */}
          {comment.isAi && (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#a371f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "white",
              }}
            >
              AI
            </div>
          )}

          {/* 2. Content Section */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
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
                maxWidth: "280px", 
                overflowX: "hidden", 
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {comment.isAi ? (
                renderMessageContent(comment.content)
              ) : (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {comment.content}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={commentsEndRef} />
    </div>
  );
}
