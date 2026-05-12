interface Props {
  newComment: string;
  setNewComment: (val: string) => void;
  lineNumber: string;
  setLineNumber: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function CommentInput({
  newComment,
  setNewComment,
  lineNumber,
  setLineNumber,
  onSend,
  disabled,
}: Props) {
  return (
    <div style={{ padding: "14px", borderTop: "1px solid #30363d" }}>
      <input
        type="text" 
        value={lineNumber}
        onChange={(e) => setLineNumber(e.target.value.replace(/\D/g, ""))} 
        placeholder="Line number"
        style={{
          width: "100%",
          background: "#0d1117",
          border: "1px solid #30363d",
          padding: "8px",
          color: "white",
          marginBottom: "8px",
          borderRadius: "6px",
          fontSize: "0.85rem",
          outline: "none",
        }}
      />
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        style={{
          width: "100%",
          background: "#0d1117",
          border: "1px solid #30363d",
          padding: "10px",
          color: "white",
          borderRadius: "6px",
          resize: "none", 
          fontSize: "0.9rem",
          outline: "none",
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !newComment.trim()}
        style={{
          width: "100%",
          marginTop: "8px",
          padding: "10px",
          background: disabled || !newComment.trim() ? "#1a7f37" : "#238636", 
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: 600,
          cursor: disabled || !newComment.trim() ? "not-allowed" : "pointer",
          opacity: disabled || !newComment.trim() ? 0.6 : 1,
        }}
      >
        Send Comment
      </button>
    </div>
  );
}
