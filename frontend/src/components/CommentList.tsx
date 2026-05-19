import { useEffect, useRef } from "react";
import type { Comment } from "../types";

export default function CommentList({
  comments,
  renderMessageContent,
}: {
  comments: Comment[];
  renderMessageContent: (content: string) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth", 
      });
    }
  }, [comments.length]); 

  return (
    <div 
      ref={containerRef}
      style={{ flex: 1, overflowY: "auto", padding: "12px" }}
    >
      {[...comments].reverse().map((comment, index) => (
        <div
          key={comment.id || `ai-${index}`}
          style={{
            background: comment.isAi ? "#160f24" : "#0d1117",
            border: comment.isAi ? "1px solid #a371f7" : "1px solid #30363d",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "10px",
            display: "flex", 
            gap: "12px",
          }}
        >
          {/* Profile Picture Section */}
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
                flexShrink: 0,
              }}
            >
              AI
            </div>
          )}

          {/* Content Section */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
                  ? (() => {
                      const timePart = comment.createdAt.includes("T") 
                        ? comment.createdAt.split("T")[1] 
                        : comment.createdAt.split(" ")[1];
                        
                      if (!timePart) return comment.createdAt;

                      const [hoursStr, minutesStr] = timePart.split(":");
                      let hours = parseInt(hoursStr, 10);
                      const minutes = minutesStr;
                      const ampm = hours >= 12 ? "PM" : "AM";
                      
                      hours = hours % 12;
                      hours = hours ? hours : 12;
                      
                      return `${hours}:${minutes} ${ampm}`;
                    })()
                  : "Just now"}
              </span>
            </div>
            <div
              className="markdown-content"
              style={{
                fontSize: "0.875rem",
                color: "#c9d1d9",
                lineHeight: 1.5,
                wordBreak: "break-word",
                overflowWrap: "break-word",
                width: "100%", 
                boxSizing: "border-box", 
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
    </div>
  );
}