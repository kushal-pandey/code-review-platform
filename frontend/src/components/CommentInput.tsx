interface Props {
  newComment: string;
  setNewComment: (val: string) => void;
  lineNumber: string;
  setLineNumber: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function CommentInput({ newComment, setNewComment, lineNumber, setLineNumber, onSend, disabled }: Props) {
  return (
    <div style={{ padding: "14px", borderTop: "1px solid #30363d" }}>
      <input type="number" value={lineNumber} onChange={(e) => setLineNumber(e.target.value)} placeholder="Line number (optional)" style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", padding: "8px", color: "white", marginBottom: "8px" }} />
      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows={3} style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", padding: "10px", color: "white" }} />
      <button onClick={onSend} disabled={disabled || !newComment.trim()} style={{ width: "100%", marginTop: "8px", padding: "10px", background: "#238636", color: "white", border: "none", borderRadius: "6px" }}>
        💬 Send Comment
      </button>
    </div>
  );
}